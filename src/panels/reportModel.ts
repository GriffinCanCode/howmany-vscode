import { HowManyResult, QualityThresholds, hasStructuralData } from '../types/HowManyTypes';

/**
 * Presentation model for the report webview.
 *
 * Everything the view renders is derived here so the markup stays a dumb
 * projection: the panel never does arithmetic and the client script never
 * decides what a number means.
 */

export type QualityBand = 'excellent' | 'good' | 'fair' | 'poor';

/** One segment of the code/doc/comment/blank split. */
export interface CompositionSlice {
    key: 'code' | 'doc' | 'comment' | 'blank';
    label: string;
    lines: number;
    pct: number;
}

export interface LanguageRow {
    ext: string;
    label: string;
    files: number;
    lines: number;
    size: number;
    pctLines: number;
    pctFiles: number;
    pctSize: number;
    avgLines: number;
    composition: CompositionSlice[];
    /** Rank-derived palette slot, so the largest languages stay distinguishable. */
    tone: number;
}

export interface QualityLever {
    key: string;
    label: string;
    value: number;
    band: QualityBand;
    /** Share of the overall score this lever contributes, as a percentage. */
    weight: number;
    /** What the core actually measures for this score. */
    basis: string;
}

export interface QualityModel {
    overall: number;
    band: QualityBand;
    target: number;
    meetsTarget: boolean;
    levers: QualityLever[];
    /** Lowest raw score. */
    weakest: QualityLever;
    /** Lever whose remaining headroom would move the overall score most. */
    leverage: QualityLever;
    verdict: string;
    detail: string;
}

export interface FootprintStat {
    label: string;
    value: string;
    hint: string;
}

export interface StructureModel {
    functions: number;
    classes: number;
    totalStructures: number;
    cyclomatic: number;
    cognitive: number;
    maxNesting: number;
    avgNesting: number;
    avgFunctionLength: number;
    bands: { label: string; count: number; pct: number }[];
}

export interface ReportModel {
    headline: {
        lines: number;
        files: number;
        codeLines: number;
        codePct: number;
        avgLinesPerFile: number;
        totalSize: string;
    };
    composition: CompositionSlice[];
    balance: {
        commentToCode: number;
        docToCode: number;
        documentedPct: number;
    };
    quality?: QualityModel;
    languages: LanguageRow[];
    /** Languages beyond the initially visible set, kept for the disclosure. */
    languageOverflow: number;
    footprint: FootprintStat[];
    structure?: StructureModel;
    meta: {
        version: string;
        generatedAt: string;
        relativeTime: string;
        durationMs: number;
        depth: string;
        languageCount: number;
    };
    isEmpty: boolean;
}

/** Extensions worth spelling out; anything else falls back to its uppercase form. */
/** The core buckets extensionless files under this sentinel, not a language. */
export const EXTENSIONLESS = 'no_ext';

const LANGUAGE_NAMES: Record<string, string> = {
    [EXTENSIONLESS]: 'No extension',
    rs: 'Rust',
    ts: 'TypeScript',
    tsx: 'TypeScript JSX',
    js: 'JavaScript',
    jsx: 'JavaScript JSX',
    mjs: 'JavaScript',
    cjs: 'JavaScript',
    py: 'Python',
    pyx: 'Cython',
    go: 'Go',
    java: 'Java',
    kt: 'Kotlin',
    swift: 'Swift',
    c: 'C',
    h: 'C Header',
    cpp: 'C++',
    cc: 'C++',
    hpp: 'C++ Header',
    cs: 'C#',
    rb: 'Ruby',
    php: 'PHP',
    scala: 'Scala',
    clj: 'Clojure',
    ex: 'Elixir',
    exs: 'Elixir',
    erl: 'Erlang',
    hs: 'Haskell',
    lua: 'Lua',
    dart: 'Dart',
    zig: 'Zig',
    sh: 'Shell',
    bash: 'Shell',
    zsh: 'Shell',
    fish: 'Shell',
    ps1: 'PowerShell',
    sql: 'SQL',
    html: 'HTML',
    css: 'CSS',
    scss: 'Sass',
    sass: 'Sass',
    less: 'Less',
    vue: 'Vue',
    svelte: 'Svelte',
    md: 'Markdown',
    mdx: 'MDX',
    json: 'JSON',
    yaml: 'YAML',
    yml: 'YAML',
    toml: 'TOML',
    xml: 'XML',
    proto: 'Protobuf',
    graphql: 'GraphQL',
    tf: 'Terraform',
    dockerfile: 'Dockerfile',
    makefile: 'Makefile',
    r: 'R',
    jl: 'Julia',
    nim: 'Nim',
    v: 'V',
    sol: 'Solidity',
};

/** Weights the core applies when folding the four levers into one score. */
const LEVER_WEIGHTS = {
    maintainability: 35,
    documentation: 25,
    readability: 25,
    consistency: 15,
} as const;

const LEVER_BASIS: Record<string, string> = {
    maintainability: 'Balance between code, comment, documentation and blank lines.',
    documentation: 'Documentation lines measured against code volume.',
    readability: 'Comment density and blank-line breathing room.',
    consistency: 'How closely each language mirrors the others.',
};

export function bandFor(score: number): QualityBand {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 55) return 'fair';
    return 'poor';
}

export function bandLabel(band: QualityBand): string {
    return { excellent: 'Excellent', good: 'Good', fair: 'Fair', poor: 'Needs work' }[band];
}

export function languageName(ext: string): string {
    return LANGUAGE_NAMES[ext.toLowerCase()] ?? ext.toUpperCase();
}

export function formatBytes(bytes: number): string {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, exp);
    return `${value.toFixed(exp === 0 ? 0 : value >= 100 ? 0 : 1)} ${units[exp]}`;
}

export function formatDuration(ms: number): string {
    if (ms < 1) return 'under a millisecond';
    if (ms < 1000) return `${Math.round(ms)} ms`;
    return `${(ms / 1000).toFixed(1)} s`;
}

export function formatRelativeTime(iso: string): string {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '';
    const minutes = Math.floor((Date.now() - then) / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

const pct = (part: number, whole: number): number => (whole > 0 ? (part / whole) * 100 : 0);

/** `1 file` / `12 files`, with the count grouped for readability. */
export const countOf = (n: number, noun: string, plural = noun + 's'): string =>
    `${n.toLocaleString()} ${n === 1 ? noun : plural}`;

const listOf = (items: string[]): string =>
    items.length < 3
        ? items.join(' and ')
        : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

function buildComposition(source: {
    code_lines: number;
    doc_lines: number;
    comment_lines: number;
    blank_lines: number;
    total_lines: number;
}): CompositionSlice[] {
    const total = source.total_lines;
    return (
        [
            { key: 'code', label: 'Code', lines: source.code_lines },
            { key: 'doc', label: 'Documentation', lines: source.doc_lines },
            { key: 'comment', label: 'Comments', lines: source.comment_lines },
            { key: 'blank', label: 'Blank', lines: source.blank_lines },
        ] as const
    ).map(slice => ({ ...slice, pct: pct(slice.lines, total) }));
}

function buildQuality(
    result: HowManyResult,
    thresholds: QualityThresholds
): QualityModel | undefined {
    const metrics = result.ratios?.quality_metrics;
    if (!metrics) return undefined;

    const levers: QualityLever[] = [
        { key: 'maintainability', label: 'Maintainability', value: metrics.maintainability_score },
        { key: 'documentation', label: 'Documentation', value: metrics.documentation_score },
        { key: 'readability', label: 'Readability', value: metrics.readability_score },
        { key: 'consistency', label: 'Consistency', value: metrics.consistency_score },
    ].map(lever => ({
        ...lever,
        band: bandFor(lever.value),
        weight: LEVER_WEIGHTS[lever.key as keyof typeof LEVER_WEIGHTS],
        basis: LEVER_BASIS[lever.key],
    }));

    const overall = metrics.overall_quality_score;
    const target = thresholds.overall;
    const meetsTarget = overall >= target;

    const weakest = levers.reduce((low, l) => (l.value < low.value ? l : low));
    // Headroom weighted by contribution: the lever that would move the total most.
    const leverage = levers.reduce((best, l) =>
        (100 - l.value) * l.weight > (100 - best.value) * best.weight ? l : best
    );

    // The score is already shown as a numeral, so this sentence only has to
    // answer the question the numeral cannot: is that good enough for you?
    const gap = Math.round(Math.abs(overall - target));
    const distance = gap === 0 ? 'Just' : `${gap} point${gap === 1 ? '' : 's'}`;
    const verdict = meetsTarget
        ? `${distance} above your target of ${target}.`
        : `${distance} short of your target of ${target}.`;

    // Scores are shown rounded, so ties have to be judged on what the reader
    // actually sees. Claiming a unique low when two levers read the same
    // number would be the one sentence on the page that looks wrong.
    const floor = Math.round(weakest.value);
    const tied = levers.filter(l => Math.round(l.value) === floor);

    const detail =
        tied.length > 1
            ? `${listOf(tied.map(l => l.label))} are tied at the lowest score (${floor}), and together they carry ${tied.reduce((sum, l) => sum + l.weight, 0)}% of the total.`
            : leverage.key === weakest.key
              ? `${leverage.label} is both the lowest score (${floor}) and the heaviest lever at ${leverage.weight}% of the total.`
              : `${weakest.label} is the lowest score at ${floor}, but ${leverage.label} has more room to move: it carries ${leverage.weight}% of the total and sits at ${Math.round(leverage.value)}.`;

    return {
        overall,
        band: bandFor(overall),
        target,
        meetsTarget,
        levers,
        weakest,
        leverage,
        verdict,
        detail,
    };
}

function buildStructure(result: HowManyResult): StructureModel | undefined {
    if (!hasStructuralData(result)) return undefined;
    const c = result.complexity;
    const dist = c.complexity_distribution;
    const bandTotal = dist
        ? dist.very_low_complexity +
          dist.low_complexity +
          dist.medium_complexity +
          dist.high_complexity +
          dist.very_high_complexity
        : 0;

    return {
        functions: c.function_count,
        classes: c.class_count,
        totalStructures: c.total_structures,
        cyclomatic: c.cyclomatic_complexity,
        cognitive: c.cognitive_complexity,
        maxNesting: c.max_nesting_depth,
        avgNesting: c.average_nesting_depth,
        avgFunctionLength: c.average_function_length ?? 0,
        bands:
            dist && bandTotal > 0
                ? [
                      { label: 'Very low', count: dist.very_low_complexity },
                      { label: 'Low', count: dist.low_complexity },
                      { label: 'Medium', count: dist.medium_complexity },
                      { label: 'High', count: dist.high_complexity },
                      { label: 'Very high', count: dist.very_high_complexity },
                  ].map(b => ({ ...b, pct: pct(b.count, bandTotal) }))
                : [],
    };
}

/** Number of language rows rendered before the disclosure kicks in. */
export const LANGUAGE_PREVIEW_COUNT = 8;

export function buildReportModel(
    result: HowManyResult,
    thresholds: QualityThresholds
): ReportModel {
    const basic = result.basic;
    const total = basic.total_lines;
    const extensions = Object.entries(basic.stats_by_extension ?? {});

    const languages: LanguageRow[] = extensions
        .sort(([, a], [, b]) => b.total_lines - a.total_lines)
        .map(([ext, stats], index) => ({
            ext,
            label: languageName(ext),
            files: stats.file_count,
            lines: stats.total_lines,
            size: stats.total_size,
            pctLines: pct(stats.total_lines, total),
            pctFiles: pct(stats.file_count, basic.total_files),
            pctSize: pct(stats.total_size, basic.total_size),
            avgLines: stats.average_lines_per_file,
            composition: buildComposition(stats),
            tone: index,
        }));

    const metadata = result.metadata;
    const ratios = result.ratios;
    const documented = basic.doc_lines + basic.comment_lines;

    return {
        headline: {
            lines: total,
            files: basic.total_files,
            codeLines: basic.code_lines,
            codePct: pct(basic.code_lines, total),
            avgLinesPerFile: basic.average_lines_per_file,
            totalSize: formatBytes(basic.total_size),
        },
        composition: buildComposition(basic),
        balance: {
            commentToCode: (ratios?.comment_to_code_ratio ?? 0) * 100,
            docToCode: (ratios?.doc_to_code_ratio ?? 0) * 100,
            documentedPct: pct(documented, basic.code_lines),
        },
        quality: buildQuality(result, thresholds),
        languages,
        languageOverflow: Math.max(0, languages.length - LANGUAGE_PREVIEW_COUNT),
        footprint: [
            {
                label: 'On disk',
                value: formatBytes(basic.total_size),
                hint: `${formatBytes(basic.average_file_size)} per file on average`,
            },
            {
                label: 'Lines per file',
                value: Math.round(basic.average_lines_per_file).toLocaleString(),
                hint: `across ${countOf(basic.total_files, 'file')}`,
            },
            {
                label: 'Largest file',
                value: formatBytes(basic.largest_file_size),
                hint: basic.smallest_file_size
                    ? `smallest is ${formatBytes(basic.smallest_file_size)}`
                    : 'by bytes on disk',
            },
            {
                label: 'Languages',
                value: languages.length.toLocaleString(),
                hint: languages.length
                    ? `${languages[0].label} leads at ${Math.round(languages[0].pctLines)}%`
                    : 'none detected',
            },
        ],
        structure: buildStructure(result),
        meta: {
            version: metadata?.version ?? '',
            generatedAt: metadata?.timestamp ?? '',
            relativeTime: metadata?.timestamp ? formatRelativeTime(metadata.timestamp) : '',
            durationMs: metadata?.calculation_time_ms ?? 0,
            depth: metadata?.analysis_depth ?? '',
            languageCount: languages.length,
        },
        isEmpty: basic.total_files === 0,
    };
}
