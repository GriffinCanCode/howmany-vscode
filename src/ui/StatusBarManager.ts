import * as vscode from 'vscode';
import { HowManyResult, ExtensionConfig } from '../types/HowManyTypes';
import { Icons } from '../icons/icons';

/**
 * Manages the HowMany status bar item with intelligent display and formatting
 */
export class StatusBarManager implements vscode.Disposable {
    private statusBarItem: vscode.StatusBarItem;
    private config: ExtensionConfig;
    private lastResult: HowManyResult | null = null;
    private readonly HOWMANY_ICON = '$(dashboard)';

    constructor(config: ExtensionConfig) {
        this.config = config;
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
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
    }

    /**
     * Show analyzing state with progress indication
     */
    showAnalyzing(): void {
        const icon = this.config.statusBar.showIcon ? '$(loading~spin) ' : '';
        this.statusBarItem.text = `${icon}HowMany: Analyzing...`;
        this.statusBarItem.color = new vscode.ThemeColor('charts.blue');
        this.statusBarItem.tooltip = 'Analyzing workspace\n\nClick for options';
    }

    /**
     * Show idle state
     */
    showIdle(): void {
        const icon = this.config.statusBar.showIcon ? `${this.HOWMANY_ICON} ` : '';
        this.statusBarItem.text = `${icon}HowMany`;
        this.statusBarItem.color = undefined;
        this.statusBarItem.tooltip = 'HowMany Code Analysis\n\nClick to start analysis';
    }

    /**
     * Show error state
     */
    showError(): void {
        const icon = this.config.statusBar.showIcon ? '$(error) ' : '';
        this.statusBarItem.text = `${icon}HowMany: Error`;
        this.statusBarItem.color = new vscode.ThemeColor('errorForeground');
        this.statusBarItem.tooltip = 'Analysis failed\n\nClick for options';
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
        let prefix = 'HowMany:';

        switch (display) {
            case 'files':
                value = result.basic.total_files;
                unit = value === 1 ? 'file' : 'files';
                break;
            case 'quality':
                const quality = result.ratios?.quality_metrics;
                if (quality) {
                    const score = Math.round(quality.overall_quality_score);
                    return `${prefix} ${score}% quality`;
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
                        return `${prefix} ${score}% quality`;
                    }
                    
                    // Show documentation issues if critical
                    if (docScore < this.config.analysis.qualityThresholds.documentation) {
                        const score = Math.round(docScore);
                        return `${prefix} ${score}% docs`;
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
                } else if (result.ratios?.quality_metrics && result.ratios.quality_metrics.overall_quality_score < 70) {
                    // Poor quality: highlight quality score
                    const score = Math.round(result.ratios.quality_metrics.overall_quality_score);
                    return `${prefix} ${score}% quality`;
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
        return `${prefix} ${formattedValue} ${unit}`;
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
                    return thousands >= 10 ? `${Math.round(thousands)}K` : `${thousands.toFixed(1)}K`;
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
     * Build clean, concise tooltip optimized for hover menus
     */
    private buildTooltip(result: HowManyResult): string {
        const lines = ['HowMany Analysis'];

        // Essential metrics only
        lines.push(`${result.basic.total_files} files, ${this.formatNumber(result.basic.total_lines, 'abbreviated')} lines`);

        // Quality score if available (most important metric)
        const quality = result.ratios?.quality_metrics;
        if (quality) {
            const score = Math.round(quality.overall_quality_score);
            const qualityText = score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : score >= 50 ? 'Fair' : 'Needs Work';
            lines.push(`Quality: ${score}% (${qualityText})`);
        }

        // Top language only
        const topLanguages = Object.entries(result.basic.stats_by_extension)
            .sort(([,a], [,b]) => b.total_lines - a.total_lines);
        
        if (topLanguages.length > 0) {
            const [topExt, topData] = topLanguages[0];
            const percentage = Math.round((topData.total_lines / result.basic.total_lines) * 100);
            lines.push(`Primary: ${topExt.toUpperCase()} (${percentage}%)`);
        }

        lines.push('', 'Click for more options');
        return lines.join('\n');
    }

    /**
     * Dispose of resources
     */
    dispose(): void {
        this.statusBarItem.dispose();
    }
} 