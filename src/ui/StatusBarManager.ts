import * as vscode from 'vscode';
import { HowManyResult, ExtensionConfig } from '../types/HowManyTypes';
import { countOf, languageName } from '../panels/reportModel';

/**
 * Fixed-width bar for Markdown hovers. Only safe inside a code span, where
 * the font is monospace and the block glyphs align.
 */
function statusBar(pct: number, width = 10): string {
    const filled = Math.round((Math.max(0, Math.min(100, pct)) / 100) * width);
    return '█'.repeat(filled) + '░'.repeat(width - filled);
}

/**
 * Manages the HowMany status bar item with intelligent display and formatting
 */
export class StatusBarManager implements vscode.Disposable {
    private statusBarItem: vscode.StatusBarItem;
    private config: ExtensionConfig;
    private lastResult: HowManyResult | null = null;
    private readonly HOWMANY_ICON = '$(graph)';

    constructor(config: ExtensionConfig) {
        this.config = config;
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        // Named so the entry is identifiable in the status bar's own toggle
        // menu, which is what lets the label itself stay short.
        this.statusBarItem.name = 'HowMany';
        this.updateClickCommand();
    }

    /**
     * Update the click command based on configuration
     */
    private updateClickCommand(): void {
        switch (this.config.statusBar.clickAction) {
            case 'showReport':
                this.statusBarItem.command = 'howmany.showReport';
                break;
            case 'analyzeWorkspace':
                this.statusBarItem.command = 'howmany.analyzeWorkspace';
                break;
            default: // 'quickActions'
                this.statusBarItem.command = 'howmany.showQuickActions';
                break;
        }
    }

    /**
     * Initialize status bar
     */
    initialize(): void {
        this.updateDisplay();
        this.statusBarItem.show();
    }

    /**
     * Update configuration and refresh display
     */
    updateConfig(config: ExtensionConfig): void {
        this.config = config;
        this.updateClickCommand(); // Update command based on new config
        if (this.lastResult) {
            this.updateWithResult(this.lastResult);
        } else {
            this.updateDisplay();
        }
    }

    /**
     * Update display with analysis result
     */
    updateWithResult(result: HowManyResult): void {
        this.lastResult = result;
        const text = this.formatDisplayText(result);
        const color = this.getDisplayColor(result);
        const icon = this.config.statusBar.showIcon ? `${this.HOWMANY_ICON} ` : '';

        this.statusBarItem.text = `${icon}${text}`;
        this.statusBarItem.color = color;
        this.statusBarItem.tooltip = this.buildTooltip(result);
        this.statusBarItem.accessibilityInformation = { label: `HowMany: ${text}` };
    }

    /**
     * Show analyzing state with progress indication
     */
    showAnalyzing(): void {
        const icon = this.config.statusBar.showIcon ? '$(loading~spin) ' : '';
        this.statusBarItem.text = `${icon}Analyzing…`;
        this.statusBarItem.color = new vscode.ThemeColor('charts.blue');
        this.statusBarItem.tooltip = this.plainTooltip(
            'HowMany',
            'Counting files in the workspace.'
        );
        this.statusBarItem.accessibilityInformation = { label: 'HowMany: analyzing' };
    }

    /**
     * Show idle state
     */
    showIdle(): void {
        const icon = this.config.statusBar.showIcon ? `${this.HOWMANY_ICON} ` : '';
        this.statusBarItem.text = `${icon}HowMany`;
        this.statusBarItem.color = undefined;
        this.statusBarItem.tooltip = this.plainTooltip(
            'HowMany',
            'No analysis yet. Click to run one.'
        );
        this.statusBarItem.accessibilityInformation = { label: 'HowMany: no analysis yet' };
    }

    /**
     * Show error state
     */
    showError(): void {
        const icon = this.config.statusBar.showIcon ? '$(error) ' : '';
        this.statusBarItem.text = `${icon}HowMany failed`;
        this.statusBarItem.color = new vscode.ThemeColor('errorForeground');
        this.statusBarItem.tooltip = this.plainTooltip(
            'HowMany',
            'Analysis failed. Check that the `howmany` binary is on your PATH, or set `howmany.binaryPath`.'
        );
        this.statusBarItem.accessibilityInformation = { label: 'HowMany: analysis failed' };
    }

    private plainTooltip(title: string, body: string): vscode.MarkdownString {
        const md = new vscode.MarkdownString(`**${title}**\n\n${body}`);
        md.supportThemeIcons = true;
        return md;
    }

    /**
     * Update display based on current state
     */
    private updateDisplay(): void {
        this.showIdle();
    }

    /**
     * Format display text based on configuration with intelligent selection
     */
    private formatDisplayText(result: HowManyResult): string {
        const display = this.config.statusBar.display;
        const format = this.config.statusBar.format;

        let value: number;
        let unit: string;

        switch (display) {
            case 'files':
                value = result.basic.total_files;
                unit = value === 1 ? 'file' : 'files';
                break;
            case 'quality':
                const quality = result.ratios?.quality_metrics;
                if (quality) {
                    const score = Math.round(quality.overall_quality_score);
                    return `${score}% quality`;
                }
                // Fallback to lines if no quality data
                value = result.basic.total_lines;
                unit = 'lines';
                break;
            case 'smart':
                // Most intelligent mode - considers multiple factors
                const smartQuality = result.ratios?.quality_metrics;
                if (smartQuality) {
                    const qualityScore = smartQuality.overall_quality_score;
                    const docScore = smartQuality.documentation_score;

                    // Prioritize quality warnings
                    if (qualityScore < this.config.analysis.qualityThresholds.overall) {
                        const score = Math.round(qualityScore);
                        return `${score}% quality`;
                    }

                    // Show documentation issues if critical
                    if (docScore < this.config.analysis.qualityThresholds.documentation) {
                        const score = Math.round(docScore);
                        return `${score}% docs`;
                    }
                }

            // Fall through to auto logic for normal cases
            // eslint-disable-next-line no-fallthrough
            case 'auto':
                // Intelligent selection based on project characteristics
                if (result.basic.total_files > 1000) {
                    // Large projects: show file count
                    value = result.basic.total_files;
                    unit = 'files';
                } else if (
                    result.ratios?.quality_metrics &&
                    result.ratios.quality_metrics.overall_quality_score < 70
                ) {
                    // Poor quality: highlight quality score
                    const score = Math.round(result.ratios.quality_metrics.overall_quality_score);
                    return `${score}% quality`;
                } else {
                    // Default: show lines
                    value = result.basic.total_lines;
                    unit = 'lines';
                }
                break;
            default: // 'lines'
                value = result.basic.total_lines;
                unit = 'lines';
                break;
        }

        const formattedValue = this.formatNumber(value, format);
        return `${formattedValue} ${unit}`;
    }

    /**
     * Enhanced number formatting with better thousand/million display
     */
    private formatNumber(value: number, format: string): string {
        switch (format) {
            case 'full':
                return value.toLocaleString();
            case 'compact':
                if (value >= 1000000) {
                    const millions = value / 1000000;
                    return millions >= 10 ? `${Math.round(millions)}M` : `${millions.toFixed(1)}M`;
                }
                if (value >= 1000) {
                    const thousands = value / 1000;
                    return thousands >= 10
                        ? `${Math.round(thousands)}K`
                        : `${thousands.toFixed(1)}K`;
                }
                return value.toString();
            default: // 'abbreviated' - balanced between readability and compactness
                if (value >= 1000000) {
                    const millions = value / 1000000;
                    return `${millions.toFixed(1)}M`;
                }
                if (value >= 10000) {
                    const thousands = Math.round(value / 1000);
                    return `${thousands}K`;
                }
                if (value >= 1000) {
                    const thousands = value / 1000;
                    return `${thousands.toFixed(1)}K`;
                }
                return value.toString();
        }
    }

    /**
     * Get display color based on quality with improved color scheme
     */
    private getDisplayColor(result: HowManyResult): vscode.ThemeColor | undefined {
        const quality = result.ratios?.quality_metrics;
        if (!this.config.statusBar.showQualityColor || !quality) {
            return undefined;
        }

        const score = quality.overall_quality_score;
        if (score >= 85) return new vscode.ThemeColor('charts.green');
        if (score >= 75) return new vscode.ThemeColor('charts.blue');
        if (score >= 60) return new vscode.ThemeColor('charts.yellow');
        return new vscode.ThemeColor('charts.red');
    }

    /**
     * Build the hover card.
     *
     * Markdown rather than plain text so the hover can carry the composition
     * bar and a real table, which is the difference between a label and a
     * glanceable summary.
     */
    private buildTooltip(result: HowManyResult): vscode.MarkdownString {
        const basic = result.basic;
        const total = basic.total_lines;
        const lines: string[] = [
            `**${total.toLocaleString()} lines** across ${countOf(basic.total_files, 'file')}`,
            '',
        ];

        const composition = [
            { label: 'Code', value: basic.code_lines },
            { label: 'Docs', value: basic.doc_lines },
            { label: 'Comments', value: basic.comment_lines },
            { label: 'Blank', value: basic.blank_lines },
        ].filter(slice => slice.value > 0);

        for (const slice of composition) {
            const share = total > 0 ? (slice.value / total) * 100 : 0;
            lines.push(`\`${statusBar(share)}\` ${share.toFixed(1).padStart(5)}%  ${slice.label}`);
        }

        const quality = result.ratios?.quality_metrics;
        if (quality) {
            const score = Math.round(quality.overall_quality_score);
            const target = this.config.analysis.qualityThresholds.overall;
            lines.push(
                '',
                `Quality **${score}/100**, ${score >= target ? `at or above` : `below`} your target of ${target}`
            );
        }

        const top = Object.entries(basic.stats_by_extension ?? {}).sort(
            ([, a], [, b]) => b.total_lines - a.total_lines
        )[0];
        if (top) {
            const share = total > 0 ? Math.round((top[1].total_lines / total) * 100) : 0;
            lines.push('', `Mostly ${languageName(top[0])} (${share}%)`);
        }

        lines.push('', '$(three-bars) Click for actions');

        const md = new vscode.MarkdownString(lines.join('\n'));
        md.supportThemeIcons = true;
        return md;
    }

    /**
     * Dispose of resources
     */
    dispose(): void {
        this.statusBarItem.dispose();
    }
}
