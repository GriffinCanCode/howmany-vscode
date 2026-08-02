import * as vscode from 'vscode';
import { HowManyResult, QualityThresholds } from '../types/HowManyTypes';
import { Icons } from '../icons/icons';
import {
    CompositionSlice,
    LanguageRow,
    LANGUAGE_PREVIEW_COUNT,
    QualityModel,
    ReportModel,
    StructureModel,
    EXTENSIONLESS,
    bandLabel,
    buildReportModel,
    countOf,
    formatBytes,
    formatDuration,
} from './reportModel';

/** Sections offered in the sticky navigation, in document order. */
interface NavEntry {
    id: string;
    label: string;
}

export class HowManyReportPanel {
    private static currentPanel: HowManyReportPanel | undefined;
    private readonly panel: vscode.WebviewPanel;
    private readonly extensionUri: vscode.Uri;
    private disposables: vscode.Disposable[] = [];
    private result: HowManyResult;
    private scope: string;

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        result: HowManyResult,
        scope: string
    ) {
        this.panel = panel;
        this.extensionUri = extensionUri;
        this.result = result;
        this.scope = scope;
        this.update(result, scope);

        this.panel.webview.onDidReceiveMessage(
            message => this.handleMessage(message),
            null,
            this.disposables
        );
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    }

    public static createOrShow(
        result: HowManyResult,
        extensionUri?: vscode.Uri,
        scope?: string
    ): void {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        const resolvedUri =
            extensionUri ?? vscode.extensions.getExtension('GriffinCanCode.howmany')?.extensionUri;
        if (!resolvedUri) {
            vscode.window.showErrorMessage('HowMany: unable to resolve extension resources.');
            return;
        }

        const resolvedScope = scope ?? HowManyReportPanel.defaultScope();

        if (HowManyReportPanel.currentPanel) {
            HowManyReportPanel.currentPanel.panel.reveal(column);
            HowManyReportPanel.currentPanel.update(result, resolvedScope);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'howmanyReport',
            'HowMany Report',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.joinPath(resolvedUri, 'media')],
            }
        );

        panel.iconPath = vscode.Uri.joinPath(resolvedUri, 'resources', 'icon-32.png');

        HowManyReportPanel.currentPanel = new HowManyReportPanel(
            panel,
            resolvedUri,
            result,
            resolvedScope
        );
    }

    /**
     * Re-render an already open report in place.
     *
     * Background refreshes use this instead of {@link createOrShow} so a
     * re-analysis never steals focus or reopens a panel the reader closed.
     */
    public static refreshIfOpen(result: HowManyResult, scope?: string): void {
        HowManyReportPanel.currentPanel?.update(result, scope);
    }

    public static disposeAll(): void {
        HowManyReportPanel.currentPanel?.dispose();
    }

    public static isOpen(): boolean {
        return HowManyReportPanel.currentPanel !== undefined;
    }

    /**
     * Reflect analysis state without rebuilding the document, so an in-flight
     * refresh does not throw away the reader's scroll position.
     */
    public static setAnalyzing(analyzing: boolean): void {
        HowManyReportPanel.currentPanel?.panel.webview.postMessage({
            type: analyzing ? 'analyzing' : 'idle',
        });
    }

    private static defaultScope(): string {
        return vscode.workspace.workspaceFolders?.[0]?.name ?? 'workspace';
    }

    private static thresholds(): QualityThresholds {
        const config = vscode.workspace.getConfiguration('howmany');
        const fallback = { overall: 70, maintainability: 65, documentation: 20, complexity: 10 };
        return {
            ...fallback,
            ...config.get<Partial<QualityThresholds>>('analysis.qualityThresholds', {}),
        };
    }

    private async handleMessage(message: { type?: string }): Promise<void> {
        switch (message?.type) {
            case 'refresh':
                await vscode.commands.executeCommand('howmany.refreshAnalysis');
                break;
            case 'export':
                await vscode.commands.executeCommand('howmany.exportReport');
                break;
            case 'copy':
                await vscode.env.clipboard.writeText(this.buildMarkdownSummary());
                this.panel.webview.postMessage({ type: 'copied' });
                break;
        }
    }

    /** A paste-ready digest for pull requests and issues. */
    private buildMarkdownSummary(): string {
        const model = buildReportModel(this.result, HowManyReportPanel.thresholds());
        const lines = [
            `**HowMany · ${this.scope}**`,
            '',
            `- ${model.headline.lines.toLocaleString()} lines across ${model.headline.files.toLocaleString()} files (${model.headline.totalSize})`,
            `- ${model.composition
                .filter(slice => slice.lines > 0)
                .map(slice => `${slice.pct.toFixed(1)}% ${slice.label.toLowerCase()}`)
                .join(', ')}`,
        ];

        if (model.quality) {
            lines.push(
                `- Quality ${Math.round(model.quality.overall)}/100 (${bandLabel(model.quality.band)}). ${model.quality.verdict}`
            );
        }
        if (model.languages.length) {
            lines.push(
                `- Languages: ${model.languages
                    .slice(0, 5)
                    .map(lang => `${lang.label} ${lang.pctLines.toFixed(1)}%`)
                    .join(', ')}`
            );
        }
        return lines.join('\n');
    }

    private update(result: HowManyResult, scope?: string): void {
        this.result = result;
        if (scope) this.scope = scope;
        this.panel.title = `HowMany · ${this.scope}`;
        this.panel.webview.html = this.getWebviewContent(result);
    }

    // ------------------------------------------------------------ rendering

    private asset(...segments: string[]): vscode.Uri {
        return this.panel.webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, ...segments));
    }

    private getWebviewContent(result: HowManyResult): string {
        const model = buildReportModel(result, HowManyReportPanel.thresholds());
        const nonce = getNonce();
        const cspSource = this.panel.webview.cspSource;
        const styles = this.asset('media', 'report.css');
        const script = this.asset('media', 'report.js');

        const body = model.isEmpty ? this.renderEmpty() : this.renderReport(model);
        const payload = { languagePreview: LANGUAGE_PREVIEW_COUNT };

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource} data:; style-src ${cspSource}; script-src 'nonce-${nonce}'; font-src ${cspSource};">
<link rel="stylesheet" href="${styles}">
<title>HowMany · ${esc(this.scope)}</title>
<script nonce="${nonce}">document.documentElement.classList.add('hm-js');</script>
</head>
<body>
${this.renderTopbar(model)}
<main class="page">
${body}
</main>
<div class="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="hm-data" nonce="${nonce}">${JSON.stringify(payload)}</script>
<script nonce="${nonce}" src="${script}"></script>
</body>
</html>`;
    }

    private navEntries(model: ReportModel): NavEntry[] {
        const entries: NavEntry[] = [{ id: 'summary', label: 'Summary' }];
        if (model.languages.length) entries.push({ id: 'languages', label: 'Languages' });
        if (model.quality) entries.push({ id: 'quality', label: 'Quality' });
        if (model.structure) entries.push({ id: 'structure', label: 'Structure' });
        entries.push({ id: 'footprint', label: 'Footprint' });
        return entries;
    }

    private renderTopbar(model: ReportModel): string {
        const nav = model.isEmpty
            ? ''
            : `<nav class="secnav" aria-label="Report sections">${this.navEntries(model)
                  .map(
                      entry => `<a class="secnav-link" href="#${entry.id}">${esc(entry.label)}</a>`
                  )
                  .join('')}</nav>`;

        const peek = model.isEmpty
            ? ''
            : `<p class="topbar-peek"><strong class="num">${model.headline.lines.toLocaleString()}</strong> lines <span class="sep">·</span> <strong class="num">${model.headline.files.toLocaleString()}</strong> ${model.headline.files === 1 ? 'file' : 'files'}</p>`;

        return `<header class="topbar">
    <div class="topbar-inner">
        <div class="brand">
            <span class="brand-mark">${Icons.brand}</span>
            <span class="brand-name">HowMany</span>
            <span class="brand-scope" title="${esc(this.scope)}">${esc(this.scope)}</span>
        </div>
        ${peek}
        ${nav}
        <div class="topbar-actions">
            <button class="iconbtn" type="button" data-action="copy" title="Copy summary as Markdown" aria-label="Copy summary as Markdown">${Icons.copy}</button>
            <button class="iconbtn" type="button" data-action="export" title="Export report" aria-label="Export report">${Icons.download}</button>
            <button class="iconbtn" type="button" data-action="refresh" title="Re-run analysis" aria-label="Re-run analysis">${Icons.refresh}</button>
        </div>
    </div>
    <div class="topbar-progress" aria-hidden="true"></div>
</header>`;
    }

    private renderEmpty(): string {
        return `<section class="empty">
    <span class="empty-icon">${Icons.inbox}</span>
    <h2 class="empty-title">Nothing to measure yet</h2>
    <p class="empty-body">No files matched the current filters in <strong>${esc(this.scope)}</strong>. Widen <code>howmany.extensions</code>, relax <code>howmany.ignorePatterns</code>, or turn on <code>howmany.includeHidden</code>, then run the analysis again.</p>
    <button class="btn" type="button" data-action="refresh">Re-run analysis</button>
</section>`;
    }

    private renderReport(model: ReportModel): string {
        return [
            this.renderSummary(model),
            model.languages.length ? this.renderLanguages(model) : '',
            model.quality ? this.renderQuality(model.quality) : '',
            model.structure ? this.renderStructure(model.structure) : '',
            this.renderFootprint(model),
            this.renderMeta(model),
        ]
            .filter(Boolean)
            .join('\n');
    }

    private renderSummary(model: ReportModel): string {
        const head = model.headline;
        const composition = model.composition.filter(slice => slice.lines > 0);

        const bar = composition
            .map(
                slice =>
                    `<span class="cbar-seg" data-tone="${slice.key}" data-fill="${slice.pct.toFixed(3)}"></span>`
            )
            .join('');

        const legend = composition
            .map(
                slice => `<li class="clegend-item">
                <span class="clegend-dot" data-tone="${slice.key}" aria-hidden="true"></span>
                <span class="clegend-label">${esc(slice.label)}</span>
                <span class="clegend-value">${slice.pct.toFixed(1)}%<small class="num">${slice.lines.toLocaleString()}</small></span>
            </li>`
            )
            .join('');

        const balance =
            model.balance.commentToCode > 0 || model.balance.docToCode > 0
                ? `<p class="hero-balance">Every 100 lines of code carry <span class="num">${model.balance.commentToCode.toFixed(0)}</span> lines of comment and <span class="num">${model.balance.docToCode.toFixed(0)}</span> of documentation.</p>`
                : '';

        const compositionLabel = composition
            .map(slice => `${slice.label} ${slice.pct.toFixed(1)}%`)
            .join(', ');

        return `<section id="summary" class="section section-hero reveal">
    <h2 class="visually-hidden">Summary</h2>
    <div class="hero">
        <div class="hero-primary">
            <p class="hero-figure">
                <span class="hero-number" data-count="${head.lines}">${head.lines.toLocaleString()}</span>
                <span class="hero-unit">lines in ${esc(this.scope)}</span>
            </p>
            <p class="hero-support">
                <span class="num">${head.files.toLocaleString()}</span> ${head.files === 1 ? 'file' : 'files'}
                <span class="sep">·</span>
                <span class="num">${Math.round(head.avgLinesPerFile).toLocaleString()}</span> lines per file
                <span class="sep">·</span>
                <span class="num">${esc(head.totalSize)}</span> on disk
            </p>
            <div id="hm-top-sentinel" aria-hidden="true"></div>
            <div class="cbar" role="img" aria-label="Line composition: ${esc(compositionLabel)}">${bar}</div>
            <ul class="clegend">${legend}</ul>
            ${balance}
        </div>
        ${model.quality ? this.renderGauge(model.quality) : ''}
    </div>
</section>`;
    }

    private renderGauge(quality: QualityModel): string {
        const score = Math.round(quality.overall);
        const band = `band-${quality.band}`;
        return `<aside class="gauge-card">
    <div class="gauge-top">
        <svg class="gauge" viewBox="0 0 92 92" role="img" aria-label="Quality score ${score} out of 100, ${esc(bandLabel(quality.band))}">
            <circle class="gauge-track" cx="46" cy="46" r="40"></circle>
            <circle class="gauge-value ${band}" cx="46" cy="46" r="40" data-arc="${quality.overall.toFixed(2)}"></circle>
            <line class="gauge-target" data-target="${quality.target}"></line>
        </svg>
        <div class="gauge-readout">
            <p class="gauge-score"><span data-count="${score}">${score}</span><small>/100</small></p>
            <p class="gauge-band ${band}">${esc(bandLabel(quality.band))}</p>
            <p class="gauge-caption">${esc(quality.verdict)}</p>
        </div>
    </div>
    <p class="gauge-detail">${esc(quality.detail)}</p>
    <button class="linkbtn" type="button" data-scroll="quality">See the four levers</button>
</aside>`;
    }

    private renderLanguages(model: ReportModel): string {
        // Languages past the distinct palette all share the muted tone, so as
        // separate slivers they read as a barcode. One merged slice says the
        // same thing and lets the six ranked colours carry the comparison.
        const named = model.languages.filter(lang => lang.tone < 6);
        const rest = model.languages.filter(lang => lang.tone >= 6);

        const segments =
            named
                .map(
                    lang =>
                        `<span class="langbar-seg" data-ext="${esc(lang.ext)}" data-label="${esc(lang.label)}" data-tone="${toneSlot(lang.tone)}" data-fill="${lang.pctLines.toFixed(3)}"></span>`
                )
                .join('') +
            (rest.length
                ? `<span class="langbar-seg" data-ext="__rest" data-label="${countOf(rest.length, 'smaller language')}" data-tone="rest"></span>`
                : '');

        const rows = model.languages
            .map((lang, index) => this.renderLanguageRow(lang, index))
            .join('');

        const distribution = model.languages
            .slice(0, 5)
            .map(lang => `${lang.label} ${lang.pctLines.toFixed(1)}%`)
            .join(', ');

        // With a single language there is nothing to rank and nothing to
        // compare, so the sort control and the stacked bar are pure chrome.
        const isMixed = model.languages.length > 1;
        const sorter = isMixed
            ? `<div class="seg" role="group" aria-label="Rank languages by">
            <button class="seg-btn" type="button" data-sort="lines" aria-pressed="true">Lines</button>
            <button class="seg-btn" type="button" data-sort="files" aria-pressed="false">Files</button>
            <button class="seg-btn" type="button" data-sort="size" aria-pressed="false">Size</button>
        </div>`
            : '';
        const bar = isMixed
            ? `<div class="langbar" role="img" aria-label="Language distribution: ${esc(distribution)}">${segments}</div>`
            : '';

        return `<section id="languages" class="section reveal">
    <div class="section-head">
        <h2 class="section-title">Languages</h2>
        ${sorter}
    </div>
    ${bar}
    <ol class="langlist">${rows}</ol>
    <button class="disclosure" type="button" hidden aria-expanded="false"></button>
</section>`;
    }

    private renderLanguageRow(lang: LanguageRow, index: number): string {
        const tone = toneSlot(lang.tone);
        const hidden = index >= LANGUAGE_PREVIEW_COUNT ? ' hidden' : '';

        const detail = lang.composition
            .filter(slice => slice.lines > 0)
            .map(
                (slice: CompositionSlice) => `<div class="langrow-stat">
                    <dt>${esc(slice.label)}</dt>
                    <dd>${slice.lines.toLocaleString()} <small>${slice.pct.toFixed(0)}%</small></dd>
                </div>`
            )
            .join('');

        return `<li class="langrow" data-ext="${esc(lang.ext)}"
        data-lines="${lang.lines}" data-files="${lang.files}" data-size="${lang.size}"
        data-pct-lines="${lang.pctLines.toFixed(3)}" data-pct-files="${lang.pctFiles.toFixed(3)}" data-pct-size="${lang.pctSize.toFixed(3)}"${hidden}>
    <button class="langrow-btn" type="button" aria-expanded="false">
        <span class="langrow-swatch" data-tone="${tone}" aria-hidden="true"></span>
        <span class="langrow-main">
            <span class="langrow-name">
                <span class="langrow-label">${esc(lang.label)}</span>
                ${lang.ext === EXTENSIONLESS ? '' : `<span class="langrow-ext">.${esc(lang.ext)}</span>`}
            </span>
            <span class="langrow-track"><span class="langrow-fill" data-tone="${tone}" data-fill="${lang.pctLines.toFixed(3)}"></span></span>
        </span>
        <span class="langrow-figures">
            <span class="langrow-sub num"
                data-lines="${countOf(lang.files, 'file')}"
                data-files="${countOf(lang.lines, 'line')}"
                data-size="${esc(formatBytes(lang.size))}">${countOf(lang.files, 'file')}</span>
            <span class="langrow-pct">${lang.pctLines.toFixed(1)}%</span>
            <span class="langrow-caret" aria-hidden="true">${Icons.caretRight}</span>
        </span>
    </button>
    <div class="langrow-panel"><div><dl class="langrow-detail">
        ${detail}
        <div class="langrow-stat"><dt>Average file</dt><dd>${Math.round(lang.avgLines).toLocaleString()} <small>lines</small></dd></div>
    </dl></div></div>
</li>`;
    }

    private renderQuality(quality: QualityModel): string {
        const levers = quality.levers
            .map(lever => {
                const band = `band-${lever.band}`;
                const lead = lever.key === quality.leverage.key ? ' is-lead' : '';
                return `<div class="lever${lead}">
        <p class="lever-name">${esc(lever.label)}<span class="lever-weight">${lever.weight}% of score</span></p>
        <p class="lever-score ${band}">${Math.round(lever.value)}</p>
        <div class="lever-track"><div class="lever-fill ${band}" data-fill="${lever.value.toFixed(2)}"></div></div>
        <p class="lever-basis">${esc(lever.basis)}</p>
    </div>`;
            })
            .join('');

        return `<section id="quality" class="section reveal">
    <div class="section-head">
        <h2 class="section-title">Quality</h2>
        <p class="section-note">Four measures, weighted into one score. Your target is ${quality.target}.</p>
    </div>
    <div class="levers">${levers}</div>
</section>`;
    }

    private renderStructure(structure: StructureModel): string {
        const stats = [
            {
                label: 'Functions',
                value: structure.functions.toLocaleString(),
                hint: structure.avgFunctionLength
                    ? `${Math.round(structure.avgFunctionLength)} lines each on average`
                    : 'declared across the project',
            },
            {
                label: 'Types',
                value: structure.totalStructures.toLocaleString(),
                hint: `${structure.classes.toLocaleString()} of them classes`,
            },
            {
                label: 'Cyclomatic',
                value: structure.cyclomatic.toFixed(1),
                hint: `cognitive ${structure.cognitive.toFixed(1)}`,
            },
            {
                label: 'Nesting depth',
                value: structure.maxNesting.toLocaleString(),
                hint: `${structure.avgNesting.toFixed(1)} on average`,
            },
        ]
            .map(
                stat => `<div class="stat">
        <p class="stat-label">${esc(stat.label)}</p>
        <p class="stat-value">${esc(stat.value)}</p>
        <p class="stat-hint">${esc(stat.hint)}</p>
    </div>`
            )
            .join('');

        const bands = structure.bands.length
            ? `<div class="bands" role="img" aria-label="Functions by complexity band: ${esc(structure.bands.map(b => `${b.label} ${b.count}`).join(', '))}">${structure.bands
                  .map(
                      (band, index) =>
                          `<span class="bands-seg" data-tone="${index}" data-fill="${band.pct.toFixed(3)}"></span>`
                  )
                  .join('')}</div>
    <ul class="clegend">${structure.bands
        .map(
            (band, index) => `<li class="clegend-item">
            <span class="clegend-dot" data-tone="${index}" aria-hidden="true"></span>
            <span class="clegend-label">${esc(band.label)}</span>
            <span class="clegend-value">${band.count.toLocaleString()}<small>${band.pct.toFixed(0)}%</small></span>
        </li>`
        )
        .join('')}</ul>`
            : '';

        return `<section id="structure" class="section reveal">
    <div class="section-head">
        <h2 class="section-title">Structure</h2>
        <p class="section-note">Declarations found by the language parsers.</p>
    </div>
    <div class="stats">${stats}</div>
    ${bands}
</section>`;
    }

    private renderFootprint(model: ReportModel): string {
        const stats = model.footprint
            .map(
                stat => `<div class="stat">
        <p class="stat-label">${esc(stat.label)}</p>
        <p class="stat-value">${esc(stat.value)}</p>
        <p class="stat-hint">${esc(stat.hint)}</p>
    </div>`
            )
            .join('');

        return `<section id="footprint" class="section reveal">
    <div class="section-head">
        <h2 class="section-title">Footprint</h2>
    </div>
    <div class="stats">${stats}</div>
</section>`;
    }

    private renderMeta(model: ReportModel): string {
        const items = [
            model.meta.relativeTime
                ? { label: 'Analyzed', value: model.meta.relativeTime }
                : undefined,
            model.meta.durationMs >= 0
                ? { label: 'Took', value: formatDuration(model.meta.durationMs) }
                : undefined,
            model.meta.depth ? { label: 'Depth', value: model.meta.depth } : undefined,
            model.meta.version ? { label: 'HowMany', value: `v${model.meta.version}` } : undefined,
        ].filter((item): item is { label: string; value: string } => Boolean(item));

        return `<footer class="meta">${items
            .map(
                item =>
                    `<span class="meta-item">${esc(item.label)} <span>${esc(item.value)}</span></span>`
            )
            .join('')}</footer>`;
    }

    private dispose(): void {
        HowManyReportPanel.currentPanel = undefined;
        this.panel.dispose();

        while (this.disposables.length) {
            this.disposables.pop()?.dispose();
        }
    }
}

/** Palette slots beyond the distinct set collapse to a single muted tone. */
function toneSlot(rank: number): string {
    return rank < 6 ? String(rank) : 'rest';
}

function esc(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getNonce(): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
