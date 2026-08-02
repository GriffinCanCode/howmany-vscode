import * as vscode from 'vscode';
import { HowManyResult } from '../types/HowManyTypes';
import {
    EXTENSIONLESS,
    ReportModel,
    bandLabel,
    buildReportModel,
    countOf,
    formatBytes,
} from '../panels/reportModel';

/**
 * Sidebar tree for HowMany.
 *
 * Two rules shape this view. Rows that expand never also run a command, so a
 * click always does exactly one predictable thing; and the numbers a reader
 * needs most sit at the root, expanded, rather than one disclosure away.
 */

interface ItemOptions {
    label: string;
    description?: string;
    tooltip?: string | vscode.MarkdownString;
    collapsible?: vscode.TreeItemCollapsibleState;
    contextValue?: string;
    icon?: string;
    iconColor?: string;
    command?: vscode.Command;
}

export class HowManyItem extends vscode.TreeItem {
    constructor(options: ItemOptions) {
        super(options.label, options.collapsible ?? vscode.TreeItemCollapsibleState.None);
        this.description = options.description;
        this.tooltip =
            options.tooltip ??
            `${options.label}${options.description ? ` · ${options.description}` : ''}`;
        this.contextValue = options.contextValue;
        this.command = options.command;
        if (options.icon) {
            this.iconPath = new vscode.ThemeIcon(
                options.icon,
                options.iconColor ? new vscode.ThemeColor(options.iconColor) : undefined
            );
        }
    }
}

const { Collapsed, Expanded, None } = vscode.TreeItemCollapsibleState;

/** Theme colour for a 0-100 score, matching the report's bands. */
function bandColor(score: number): string {
    if (score >= 85) return 'charts.green';
    if (score >= 70) return 'charts.blue';
    if (score >= 55) return 'charts.yellow';
    return 'charts.red';
}

/**
 * Fixed-width bar for Markdown tooltips.
 *
 * Safe only inside a code span, where the font is guaranteed monospace and
 * the block glyphs line up into a continuous rule.
 */
function bar(pct: number, width = 12): string {
    const filled = Math.round((Math.max(0, Math.min(100, pct)) / 100) * width);
    return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function markdown(lines: string[]): vscode.MarkdownString {
    const md = new vscode.MarkdownString(lines.join('\n'));
    md.supportThemeIcons = true;
    return md;
}

export class HowManyViewProvider implements vscode.TreeDataProvider<HowManyItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<HowManyItem | undefined | null | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private model: ReportModel | null = null;
    private isAnalyzing = false;
    private failed = false;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    updateResult(result: HowManyResult): void {
        this.model = buildReportModel(result, {
            overall: 70,
            maintainability: 65,
            documentation: 20,
            complexity: 10,
            ...vscode.workspace
                .getConfiguration('howmany')
                .get('analysis.qualityThresholds', {} as Record<string, number>),
        });
        this.isAnalyzing = false;
        this.failed = false;
        this.refresh();
    }

    setAnalyzing(analyzing: boolean): void {
        this.isAnalyzing = analyzing;
        if (analyzing) this.failed = false;
        this.refresh();
    }

    setFailed(): void {
        this.isAnalyzing = false;
        this.failed = true;
        this.refresh();
    }

    /** Short summary for the view header, so the count is visible when collapsed. */
    get headerDescription(): string {
        if (this.isAnalyzing) return 'analyzing…';
        if (!this.model) return '';
        const { lines, files } = this.model.headline;
        return `${compact(lines)} lines · ${compact(files)} ${files === 1 ? 'file' : 'files'}`;
    }

    getTreeItem(element: HowManyItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: HowManyItem): Thenable<HowManyItem[]> {
        if (!element) return Promise.resolve(this.rootItems());

        switch (element.contextValue) {
            case 'overview':
                return Promise.resolve(this.overviewChildren());
            case 'quality':
                return Promise.resolve(this.qualityChildren());
            case 'languages':
                return Promise.resolve(this.languageChildren());
            default:
                return Promise.resolve([]);
        }
    }

    private rootItems(): HowManyItem[] {
        if (this.isAnalyzing) {
            return [
                new HowManyItem({
                    label: 'Analyzing…',
                    description: 'counting files',
                    icon: 'loading~spin',
                }),
            ];
        }

        if (this.failed) {
            return [
                new HowManyItem({
                    label: 'Analysis failed',
                    description: 'check the HowMany binary path',
                    icon: 'error',
                    iconColor: 'charts.red',
                    command: {
                        command: 'howmany.openSettings',
                        title: 'Open HowMany settings',
                    },
                }),
            ];
        }

        // An empty array lets the contributed welcome view take over, which
        // gives the first run real buttons instead of a dead placeholder row.
        const model = this.model;
        if (!model) return [];

        const items: HowManyItem[] = [
            new HowManyItem({
                label: `${model.headline.lines.toLocaleString()} lines`,
                description: `${countOf(model.headline.files, 'file')} · ${model.headline.totalSize}`,
                collapsible: Expanded,
                contextValue: 'overview',
                icon: 'symbol-numeric',
                tooltip: this.overviewTooltip(model),
            }),
        ];

        if (model.quality) {
            const score = Math.round(model.quality.overall);
            items.push(
                new HowManyItem({
                    label: `Quality ${score}`,
                    description: `${bandLabel(model.quality.band)} · target ${model.quality.target}`,
                    collapsible: Expanded,
                    contextValue: 'quality',
                    icon: model.quality.meetsTarget ? 'pass' : 'warning',
                    iconColor: bandColor(model.quality.overall),
                    tooltip: this.qualityTooltip(model),
                })
            );
        }

        if (model.languages.length) {
            const top = model.languages[0];
            items.push(
                new HowManyItem({
                    label: 'Languages',
                    description: `${top.label} ${Math.round(top.pctLines)}%${model.languages.length > 1 ? ` of ${model.languages.length}` : ''}`,
                    collapsible: Collapsed,
                    contextValue: 'languages',
                    icon: 'symbol-file',
                    tooltip: this.languagesTooltip(model),
                })
            );
        }

        items.push(
            new HowManyItem({
                label: 'Open full report',
                icon: 'graph',
                command: {
                    command: 'howmany.showReport',
                    title: 'Show Analysis Report',
                },
            })
        );

        return items;
    }

    private overviewChildren(): HowManyItem[] {
        const model = this.model;
        if (!model) return [];

        const slices = model.composition
            .filter(slice => slice.lines > 0)
            .map(
                slice =>
                    new HowManyItem({
                        label: `${slice.lines.toLocaleString()} ${slice.label.toLowerCase()}`,
                        description: `${slice.pct.toFixed(1)}%`,
                        tooltip: markdown([
                            `**${slice.label}**`,
                            '',
                            `\`${bar(slice.pct)}\` ${slice.pct.toFixed(1)}%`,
                            '',
                            `${slice.lines.toLocaleString()} of ${model.headline.lines.toLocaleString()} lines`,
                        ]),
                    })
            );

        slices.push(
            new HowManyItem({
                label: `${Math.round(model.headline.avgLinesPerFile).toLocaleString()} lines per file`,
                description: 'average',
                tooltip: `Across ${countOf(model.headline.files, 'file')}, ${model.headline.totalSize} on disk.`,
            })
        );

        return slices;
    }

    private qualityChildren(): HowManyItem[] {
        const quality = this.model?.quality;
        if (!quality) return [];

        return quality.levers.map(
            lever =>
                new HowManyItem({
                    label: `${lever.label} ${Math.round(lever.value)}`,
                    description:
                        lever.key === quality.leverage.key
                            ? `${lever.weight}% of score · biggest lever`
                            : `${lever.weight}% of score`,
                    icon: 'circle-filled',
                    iconColor: bandColor(lever.value),
                    tooltip: markdown([
                        `**${lever.label}** · ${bandLabel(lever.band)}`,
                        '',
                        `\`${bar(lever.value)}\` ${lever.value.toFixed(1)}`,
                        '',
                        lever.basis,
                        '',
                        `Contributes ${lever.weight}% of the overall score.`,
                    ]),
                })
        );
    }

    private languageChildren(): HowManyItem[] {
        const model = this.model;
        if (!model) return [];

        return model.languages.slice(0, 10).map(
            lang =>
                new HowManyItem({
                    label: lang.label,
                    description: `${lang.pctLines.toFixed(1)}% · ${compact(lang.lines)} lines`,
                    tooltip: markdown([
                        lang.ext === EXTENSIONLESS
                            ? `**${lang.label}**`
                            : `**${lang.label}** \`.${lang.ext}\``,
                        '',
                        `\`${bar(lang.pctLines)}\` ${lang.pctLines.toFixed(1)}% of all lines`,
                        '',
                        `| | |`,
                        `|---|---:|`,
                        `| Files | ${lang.files.toLocaleString()} |`,
                        `| Lines | ${lang.lines.toLocaleString()} |`,
                        `| Average file | ${Math.round(lang.avgLines).toLocaleString()} lines |`,
                        `| On disk | ${formatBytes(lang.size)} |`,
                    ]),
                })
        );
    }

    private overviewTooltip(model: ReportModel): vscode.MarkdownString {
        return markdown([
            `**${model.headline.lines.toLocaleString()} lines** across ${countOf(model.headline.files, 'file')}`,
            '',
            ...model.composition
                .filter(slice => slice.lines > 0)
                .map(
                    slice =>
                        `\`${bar(slice.pct)}\` ${slice.pct.toFixed(1).padStart(5)}%  ${slice.label}`
                ),
            '',
            `${model.headline.totalSize} on disk · ${Math.round(model.headline.avgLinesPerFile).toLocaleString()} lines per file`,
        ]);
    }

    private qualityTooltip(model: ReportModel): vscode.MarkdownString {
        const quality = model.quality!;
        return markdown([
            `**Quality ${Math.round(quality.overall)} / 100** · ${bandLabel(quality.band)}`,
            '',
            quality.verdict,
            '',
            ...quality.levers.map(
                lever =>
                    `\`${bar(lever.value)}\` ${Math.round(lever.value).toString().padStart(3)}  ${lever.label}`
            ),
            '',
            quality.detail,
        ]);
    }

    private languagesTooltip(model: ReportModel): vscode.MarkdownString {
        return markdown([
            `**${countOf(model.languages.length, 'language')}**`,
            '',
            ...model.languages
                .slice(0, 8)
                .map(
                    lang =>
                        `\`${bar(lang.pctLines)}\` ${lang.pctLines.toFixed(1).padStart(5)}%  ${lang.label}`
                ),
        ]);
    }
}

function compact(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 10_000) return `${Math.round(value / 1000)}K`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
}
