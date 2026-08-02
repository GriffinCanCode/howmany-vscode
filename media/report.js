// @ts-check
/**
 * HowMany report client.
 *
 * The page is server-rendered by the extension; this script owns three things
 * the markup cannot express under the webview's content security policy:
 *
 *  1. Geometry. `style-src` has no 'unsafe-inline', so inline style attributes
 *     are dropped by the browser. Every bar width and arc offset is therefore
 *     applied through the CSSOM, which CSP does not gate. This is also what
 *     gives the entrance animation a from-state for free.
 *  2. Orchestration. One entrance beat on first paint, then stillness.
 *  3. Progressive disclosure and re-sorting, which change what the numbers
 *     mean rather than just what they look like.
 */

(function () {
    'use strict';

    const vscode = acquireVsCodeApi();
    const root = document.body;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /** @type {any} */
    const model = JSON.parse(document.getElementById('hm-data')?.textContent || '{}');

    const $ = (sel, ctx = document) => /** @type {HTMLElement|null} */ (ctx.querySelector(sel));
    const $$ = (sel, ctx = document) =>
        /** @type {HTMLElement[]} */ (Array.prototype.slice.call(ctx.querySelectorAll(sel)));

    const previousState = vscode.getState() || {};
    /** Replaying the entrance on every re-analysis would be noise, not signal. */
    const isFirstRender = !previousState.hasRendered;

    // ------------------------------------------------------------- geometry

    /** Paint a value that the stylesheet declared a transition for. */
    function setWidth(el, pct) {
        el.style.width = Math.max(0, Math.min(100, pct)) + '%';
    }

    function applyBars(animate) {
        const paint = () => {
            $$('[data-fill]').forEach(el => setWidth(el, parseFloat(el.dataset.fill || '0')));
            $$('[data-arc]').forEach(drawArc);
        };
        // One frame of from-state so the transition has something to run from.
        if (animate) {
            requestAnimationFrame(() => requestAnimationFrame(paint));
        } else {
            paint();
        }
    }

    function drawArc(el) {
        const value = parseFloat(el.dataset.arc || '0');
        const radius = Number(el.getAttribute('r')) || 40;
        const circumference = 2 * Math.PI * radius;
        el.style.strokeDasharray = String(circumference);
        el.style.strokeDashoffset = String(
            circumference * (1 - Math.max(0, Math.min(100, value)) / 100)
        );
    }

    /** Place the threshold notch on the ring, in the SVG's own rotated frame. */
    function placeTarget() {
        const tick = $('[data-target]');
        if (!tick) return;
        const target = parseFloat(tick.dataset.target || '0');
        const cx = 46;
        const cy = 46;
        const angle = (target / 100) * Math.PI * 2;
        const inner = 33;
        const outer = 47;
        tick.setAttribute('x1', String(cx + Math.cos(angle) * inner));
        tick.setAttribute('y1', String(cy + Math.sin(angle) * inner));
        tick.setAttribute('x2', String(cx + Math.cos(angle) * outer));
        tick.setAttribute('y2', String(cy + Math.sin(angle) * outer));
    }

    // -------------------------------------------------------------- counters

    function formatterFor(el) {
        const decimals = parseInt(el.dataset.decimals || '0', 10);
        return v =>
            v.toLocaleString(undefined, {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
            });
    }

    function countUp(el) {
        const target = parseFloat(el.dataset.count || '0');
        const format = formatterFor(el);

        if (reduceMotion || target === 0) {
            el.textContent = format(target);
            return;
        }

        const duration = 900;
        const start = performance.now();
        const step = now => {
            const t = Math.min(1, (now - start) / duration);
            // Exponential ease-out: fast commitment, soft landing.
            const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
            el.textContent = format(target * eased);
            if (t < 1) requestAnimationFrame(step);
            else el.textContent = format(target);
        };
        requestAnimationFrame(step);
    }

    // ---------------------------------------------------------------- reveal

    function observeReveals() {
        const targets = $$('.reveal');
        if (reduceMotion || !('IntersectionObserver' in window)) {
            targets.forEach(el => el.classList.add('is-in'));
            return;
        }
        const io = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('is-in');
                    io.unobserve(entry.target);
                });
            },
            { rootMargin: '0px 0px -12% 0px', threshold: 0.05 }
        );
        targets.forEach(el => io.observe(el));
    }

    /** Sentinel-based, so no scroll handler is needed to condense the bar. */
    function observeHeaderPeek() {
        const sentinel = $('#hm-top-sentinel');
        if (!sentinel || !('IntersectionObserver' in window)) return;
        new IntersectionObserver(
            entries => root.classList.toggle('is-scrolled', !entries[0].isIntersecting),
            { threshold: 0 }
        ).observe(sentinel);
    }

    function observeSectionNav() {
        const links = $$('.secnav-link');
        const sections = links
            .map(link => document.getElementById((link.getAttribute('href') || '').slice(1)))
            .filter(Boolean);
        if (!sections.length || !('IntersectionObserver' in window)) return;

        const visible = new Map();
        const io = new IntersectionObserver(
            entries => {
                entries.forEach(e =>
                    visible.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0)
                );
                let best = '';
                let bestRatio = 0;
                visible.forEach((ratio, id) => {
                    if (ratio > bestRatio) {
                        bestRatio = ratio;
                        best = id;
                    }
                });
                if (!best) return;
                links.forEach(link =>
                    link.classList.toggle('is-current', link.getAttribute('href') === '#' + best)
                );
            },
            { rootMargin: '-25% 0px -55% 0px', threshold: [0, 0.25, 0.5, 1] }
        );
        sections.forEach(section => section && io.observe(section));
    }

    // ------------------------------------------------------------- languages

    const PREVIEW = Number(model.languagePreview || 8);
    /** Sentinel extension for the merged tail slice of the stacked bar. */
    const REST = '__rest';
    let sortKey = previousState.sortKey || 'lines';
    let showAll = Boolean(previousState.showAll);

    function languageRows() {
        return $$('.langrow');
    }

    function renderLanguages(animate) {
        const rows = languageRows();
        const list = $('.langlist');
        if (!list || !rows.length) return;

        rows.slice()
            .sort((a, b) => Number(b.dataset[sortKey] || 0) - Number(a.dataset[sortKey] || 0))
            .forEach(row => list.appendChild(row));

        const ordered = languageRows();
        ordered.forEach((row, index) => {
            const share = Number(row.dataset['pct' + capitalize(sortKey)] || 0);
            const pctEl = $('.langrow-pct', row);
            const fill = $('.langrow-fill', row);
            const sub = $('.langrow-sub', row);
            if (pctEl) pctEl.textContent = share.toFixed(1) + '%';
            if (fill) {
                fill.dataset.fill = String(share);
                if (!animate) setWidth(fill, share);
            }
            if (sub) sub.textContent = sub.dataset[sortKey] || '';
            row.hidden = !showAll && index >= PREVIEW;
        });

        renderLanguageBar(animate);
        updateDisclosure(ordered.length);
        if (animate) applyBars(true);
    }

    function renderLanguageBar(animate) {
        const bar = $('.langbar');
        if (!bar) return;
        const segments = $$('.langbar-seg', bar);
        const rows = languageRows();
        const order = rows.map(row => row.dataset.ext);
        const rank = seg => (seg.dataset.ext === REST ? Infinity : order.indexOf(seg.dataset.ext));
        segments
            .slice()
            .sort((a, b) => rank(a) - rank(b))
            .forEach(seg => bar.appendChild(seg));

        const shareOf = row => Number(row.dataset['pct' + capitalize(sortKey)] || 0);
        let named = 0;
        segments.forEach(seg => {
            if (seg.dataset.ext === REST) return;
            const row = rows.find(r => r.dataset.ext === seg.dataset.ext);
            const share = row ? shareOf(row) : 0;
            named += share;
            seg.dataset.fill = String(share);
            seg.title = (seg.dataset.label || '') + ' ' + share.toFixed(1) + '%';
            if (!animate) setWidth(seg, share);
        });

        // The merged tail is whatever the six ranked colours do not account
        // for, so it stays exact no matter which measure is being ranked.
        const tail = segments.find(seg => seg.dataset.ext === REST);
        if (tail) {
            const share = Math.max(0, 100 - named);
            tail.dataset.fill = String(share);
            tail.title = (tail.dataset.label || '') + ' ' + share.toFixed(1) + '%';
            if (!animate) setWidth(tail, share);
        }
    }

    function updateDisclosure(total) {
        const button = $('.disclosure');
        if (!button) return;
        const hidden = Math.max(0, total - PREVIEW);
        button.hidden = hidden === 0;
        button.textContent = showAll ? 'Show fewer languages' : `Show all ${total} languages`;
        button.setAttribute('aria-expanded', String(showAll));
    }

    const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);

    // -------------------------------------------------------------- plumbing

    function saveState(patch) {
        vscode.setState(Object.assign({}, vscode.getState() || {}, patch));
    }

    let toastTimer;
    function toast(message) {
        const el = $('.toast');
        if (!el) return;
        el.textContent = message;
        el.classList.add('is-shown');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('is-shown'), 2200);
    }

    function wireActions() {
        document.addEventListener('click', event => {
            const target = /** @type {HTMLElement} */ (event.target);

            const actionEl = target.closest('[data-action]');
            if (actionEl) {
                const action = /** @type {HTMLElement} */ (actionEl).dataset.action;
                if (action === 'refresh') root.classList.add('is-analyzing');
                saveState({ scroll: window.scrollY });
                vscode.postMessage({ type: action });
                return;
            }

            const sortEl = target.closest('.seg-btn');
            if (sortEl) {
                sortKey = /** @type {HTMLElement} */ (sortEl).dataset.sort || 'lines';
                $$('.seg-btn').forEach(b =>
                    b.setAttribute('aria-pressed', String(b.dataset.sort === sortKey))
                );
                saveState({ sortKey });
                renderLanguages(!reduceMotion);
                return;
            }

            if (target.closest('.disclosure')) {
                showAll = !showAll;
                saveState({ showAll });
                renderLanguages(false);
                return;
            }

            const rowBtn = target.closest('.langrow-btn');
            if (rowBtn) {
                const expanded = rowBtn.getAttribute('aria-expanded') === 'true';
                rowBtn.setAttribute('aria-expanded', String(!expanded));
                return;
            }

            const jump = target.closest('[data-scroll]');
            if (jump) {
                const id = /** @type {HTMLElement} */ (jump).dataset.scroll;
                document.getElementById(id || '')?.scrollIntoView({
                    behavior: reduceMotion ? 'auto' : 'smooth',
                    block: 'start',
                });
            }
        });

        // Hovering a slice of the stacked bar lights up its row, so the two
        // views of the same data stay connected.
        $$('.langbar-seg').forEach(seg => {
            const setActive = on => {
                const row = languageRows().find(r => r.dataset.ext === seg.dataset.ext);
                row?.querySelector('.langrow-btn')?.classList.toggle('is-hot', on);
                seg.classList.toggle('is-active', on);
            };
            seg.addEventListener('mouseenter', () => setActive(true));
            seg.addEventListener('mouseleave', () => setActive(false));
        });

        window.addEventListener('message', event => {
            const message = event.data || {};
            if (message.type === 'analyzing') {
                root.classList.add('is-analyzing');
            } else if (message.type === 'idle') {
                root.classList.remove('is-analyzing');
            } else if (message.type === 'copied') {
                toast('Summary copied to clipboard');
            }
        });

        // Persisted on the way out rather than on every scroll frame.
        window.addEventListener('pagehide', () => saveState({ scroll: window.scrollY }));
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') saveState({ scroll: window.scrollY });
        });
    }

    function restoreScroll() {
        const y = Number(previousState.scroll || 0);
        if (y > 0) window.scrollTo(0, y);
    }

    // ------------------------------------------------------------------ boot

    function init() {
        placeTarget();
        $$('.seg-btn').forEach(b =>
            b.setAttribute('aria-pressed', String(b.dataset.sort === sortKey))
        );
        renderLanguages(false);

        observeReveals();
        observeHeaderPeek();
        observeSectionNav();
        wireActions();
        restoreScroll();

        const animate = isFirstRender && !reduceMotion;
        applyBars(animate);
        $$('[data-count]').forEach(el => {
            if (animate) countUp(el);
            else el.textContent = formatterFor(el)(parseFloat(el.dataset.count || '0'));
        });

        saveState({ hasRendered: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
