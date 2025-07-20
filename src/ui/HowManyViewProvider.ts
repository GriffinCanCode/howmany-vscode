import * as vscode from 'vscode';
import { HowManyResult } from '../types/HowManyTypes';
import { Icons } from '../icons/icons';

export class HowManyViewProvider implements vscode.TreeDataProvider<HowManyItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<HowManyItem | undefined | null | void> = new vscode.EventEmitter<HowManyItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<HowManyItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private result: HowManyResult | null = null;
    private isAnalyzing = false;

    constructor() {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    updateResult(result: HowManyResult): void {
        this.result = result;
        this.isAnalyzing = false;
        this.refresh();
    }

    setAnalyzing(analyzing: boolean): void {
        this.isAnalyzing = analyzing;
        this.refresh();
    }

    getTreeItem(element: HowManyItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: HowManyItem): Thenable<HowManyItem[]> {
        if (!element) {
            // Root level items
            return Promise.resolve(this.getRootItems());
        }

        // Child items for expandable elements
        if (element.contextValue === 'overview') {
            return Promise.resolve(this.getOverviewDetails());
        } else if (element.contextValue === 'quality') {
            return Promise.resolve(this.getQualityDetails());
        } else if (element.contextValue === 'languages') {
            return Promise.resolve(this.getLanguageDetails());
        }

        return Promise.resolve([]);
    }

    private getRootItems(): HowManyItem[] {
        if (this.isAnalyzing) {
            return [
                new HowManyItem(
                    'Analyzing...',
                    '',
                    vscode.TreeItemCollapsibleState.None,
                    'analyzing',
                    'loading~spin'
                )
            ];
        }

        if (!this.result) {
            return [
                new HowManyItem(
                    'No analysis data',
                    'Run analysis to see results',
                    vscode.TreeItemCollapsibleState.None,
                    'empty',
                    'info'
                )
            ];
        }

        const items: HowManyItem[] = [];

        // Quick overview - always visible and compact
        const fileCount = this.result.basic.total_files.toLocaleString();
        const lineCount = this.result.basic.total_lines.toLocaleString();
        
        items.push(
            new HowManyItem(
                `${fileCount} files`,
                `${lineCount} lines total`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'overview',
                'folder'
            )
        );

        // Quality score if available
        const quality = this.result.ratios?.quality_metrics;
        if (quality) {
            const score = Math.round(quality.overall_quality_score);
            const color = score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'error';
            items.push(
                new HowManyItem(
                    `${score}% quality`,
                    `Overall code quality score`,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'quality',
                    'target',
                    color
                )
            );
        }

        // Top languages
        const topLanguages = Object.entries(this.result.basic.stats_by_extension)
            .sort(([,a], [,b]) => b.total_lines - a.total_lines)
            .slice(0, 3);

        if (topLanguages.length > 0) {
            const topLang = topLanguages[0];
            const percentage = Math.round((topLang[1].total_lines / this.result.basic.total_lines) * 100);
            
            items.push(
                new HowManyItem(
                    `${topLang[0].toUpperCase()} ${percentage}%`,
                    `${topLanguages.length} languages detected`,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'languages',
                    'code'
                )
            );
        }

        return items;
    }

    private getOverviewDetails(): HowManyItem[] {
        if (!this.result) return [];

        return [
            new HowManyItem(
                `${this.result.basic.code_lines.toLocaleString()} code lines`,
                `${Math.round((this.result.basic.code_lines / this.result.basic.total_lines) * 100)}% of total`,
                vscode.TreeItemCollapsibleState.None,
                'detail'
            ),
            new HowManyItem(
                `${this.result.basic.comment_lines.toLocaleString()} comments`,
                `${Math.round((this.result.basic.comment_lines / this.result.basic.total_lines) * 100)}% of total`,
                vscode.TreeItemCollapsibleState.None,
                'detail'
            ),
            new HowManyItem(
                `${this.result.basic.doc_lines.toLocaleString()} documentation`,
                `${Math.round((this.result.basic.doc_lines / this.result.basic.total_lines) * 100)}% of total`,
                vscode.TreeItemCollapsibleState.None,
                'detail'
            ),
            new HowManyItem(
                `${this.formatSize(this.result.basic.total_size)} total size`,
                `Average ${this.formatSize(this.result.basic.average_file_size)} per file`,
                vscode.TreeItemCollapsibleState.None,
                'detail'
            )
        ];
    }

    private getQualityDetails(): HowManyItem[] {
        const quality = this.result?.ratios?.quality_metrics;
        if (!quality) return [];

        return [
            new HowManyItem(
                `${Math.round(quality.maintainability_score)}% maintainability`,
                'Code maintainability score',
                vscode.TreeItemCollapsibleState.None,
                'detail'
            ),
            new HowManyItem(
                `${Math.round(quality.documentation_score)}% documentation`,
                'Documentation coverage score',
                vscode.TreeItemCollapsibleState.None,
                'detail'
            ),
            new HowManyItem(
                `${Math.round(quality.readability_score)}% readability`,
                'Code readability score',
                vscode.TreeItemCollapsibleState.None,
                'detail'
            )
        ];
    }

    private getLanguageDetails(): HowManyItem[] {
        if (!this.result) return [];

        const languages = Object.entries(this.result.basic.stats_by_extension)
            .sort(([,a], [,b]) => b.total_lines - a.total_lines)
            .slice(0, 5);

        return languages.map(([ext, stats]) => {
            const percentage = Math.round((stats.total_lines / this.result!.basic.total_lines) * 100);
            return new HowManyItem(
                `${ext.toUpperCase()}`,
                `${stats.total_lines.toLocaleString()} lines (${percentage}%)`,
                vscode.TreeItemCollapsibleState.None,
                'detail'
            );
        });
    }

    private formatSize(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
    }
}

export class HowManyItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly description: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue?: string,
        public readonly iconName?: string,
        public readonly colorTheme?: string
    ) {
        super(label, collapsibleState);

        this.description = description;
        this.tooltip = `${this.label}: ${this.description}`;
        this.contextValue = contextValue;

        // Set icon based on iconName
        if (iconName) {
            this.iconPath = new vscode.ThemeIcon(iconName, colorTheme ? new vscode.ThemeColor(`charts.${colorTheme}`) : undefined);
        }

        // Add commands for clickable items
        if (contextValue === 'overview' || contextValue === 'quality' || contextValue === 'languages') {
            this.command = {
                command: 'howmany.showReport',
                title: 'Show Detailed Report',
                arguments: [this]
            };
        }
    }
} 