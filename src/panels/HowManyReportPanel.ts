import * as vscode from 'vscode';
import { HowManyResult } from '../types/HowManyTypes';
import { Icons } from '../icons/icons';

export class HowManyReportPanel {
    private static currentPanel: HowManyReportPanel | undefined;
    private readonly panel: vscode.WebviewPanel;
    private readonly extensionUri: vscode.Uri;
    private disposables: vscode.Disposable[] = [];
    private result: HowManyResult;

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, result: HowManyResult) {
        this.panel = panel;
        this.extensionUri = extensionUri;
        this.result = result;
        this.update(result);
        
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    }

    public static createOrShow(result: HowManyResult, extensionUri?: vscode.Uri): void {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (HowManyReportPanel.currentPanel) {
            HowManyReportPanel.currentPanel.panel.reveal(column);
            HowManyReportPanel.currentPanel.update(result);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'howmanyReport',
            'HowMany Report',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri || vscode.extensions.getExtension('howmany.howmany-vscode')?.extensionUri!, 'src', 'styles')
                ]
            }
        );

        HowManyReportPanel.currentPanel = new HowManyReportPanel(
            panel, 
            extensionUri || vscode.extensions.getExtension('howmany.howmany-vscode')?.extensionUri!, 
            result
        );
    }

    public static disposeAll(): void {
        HowManyReportPanel.currentPanel?.dispose();
    }

    public static isOpen(): boolean {
        return HowManyReportPanel.currentPanel !== undefined;
    }

    private update(result: HowManyResult): void {
        this.result = result;
        this.panel.webview.html = this.getWebviewContent(result);
    }



    private getWebviewContent(result: HowManyResult): string {
        // Get CSS file URI
        const stylesUri = this.panel.webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'src', 'styles', 'report.css')
        );

        // Generate nonce for security
        const nonce = this.getNonce();

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${this.panel.webview.cspSource}; script-src 'nonce-${nonce}'; font-src ${this.panel.webview.cspSource};">
    <link rel="stylesheet" type="text/css" href="${stylesUri}">
    <title>HowMany Report</title>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1 class="title">${Icons.chart} HowMany</h1>
            <p class="subtitle">Comprehensive code analysis results</p>
        </header>
        
        <main class="grid" role="main">
            ${this.generateOverviewCard(result)}
            ${this.generateQualityCard(result)}
            ${this.generateLanguagesCard(result)}
            ${this.generateTimeCard(result)}
        </main>
        

    </div>
    
    <script nonce="${nonce}">
        // Animate metric values on load
        document.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('.metric-value').forEach((el, index) => {
                setTimeout(() => {
                    el.classList.add('updated');
                    setTimeout(() => el.classList.remove('updated'), 300);
                }, index * 100);
            });
        });
    </script>
</body>
</html>`;
    }

    private generateOverviewCard(result: HowManyResult): string {
        return `
            <section class="card" role="region" aria-labelledby="overview-title">
                <header class="card-header">
                    <span class="card-icon" aria-hidden="true">${Icons.folder}</span>
                    <h2 class="card-title" id="overview-title">Project Overview</h2>
                </header>
                <div class="metric">
                    <span class="metric-label">Total Files</span>
                    <span class="metric-value">${result.basic.total_files.toLocaleString()}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Total Lines</span>
                    <span class="metric-value">${result.basic.total_lines.toLocaleString()}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Code Lines</span>
                    <span class="metric-value">${result.basic.code_lines.toLocaleString()}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Comments</span>
                    <span class="metric-value">${result.basic.comment_lines.toLocaleString()}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Documentation</span>
                    <span class="metric-value">${result.basic.doc_lines.toLocaleString()}</span>
                </div>
            </section>`;
    }

    private generateQualityCard(result: HowManyResult): string {
        const quality = result.ratios?.quality_metrics;
        if (!quality) {
            return '';
        }

        return `
            <section class="card" role="region" aria-labelledby="quality-title">
                <header class="card-header">
                    <span class="card-icon" aria-hidden="true">${Icons.target}</span>
                    <h2 class="card-title" id="quality-title">Quality Metrics</h2>
                </header>
                <div class="quality-score ${this.getQualityClass(quality.overall_quality_score)}" 
                     aria-label="Overall quality score: ${quality.overall_quality_score.toFixed(1)} percent">
                    ${quality.overall_quality_score.toFixed(1)}%
                </div>
                <div class="metric">
                    <span class="metric-label">Maintainability</span>
                    <div class="progress-container">
                        <span class="metric-value">${quality.maintainability_score.toFixed(1)}%</span>
                        <div class="progress-bar" role="progressbar" 
                             aria-valuenow="${quality.maintainability_score}" 
                             aria-valuemin="0" aria-valuemax="100"
                             aria-label="Maintainability score">
                            <div class="progress-fill ${this.getQualityClass(quality.maintainability_score)}" 
                                 style="width: ${quality.maintainability_score}%"></div>
                        </div>
                    </div>
                </div>
                <div class="metric">
                    <span class="metric-label">Documentation</span>
                    <div class="progress-container">
                        <span class="metric-value">${quality.documentation_score.toFixed(1)}%</span>
                        <div class="progress-bar" role="progressbar" 
                             aria-valuenow="${quality.documentation_score}" 
                             aria-valuemin="0" aria-valuemax="100"
                             aria-label="Documentation score">
                            <div class="progress-fill ${this.getQualityClass(quality.documentation_score)}" 
                                 style="width: ${quality.documentation_score}%"></div>
                        </div>
                    </div>
                </div>
            </section>`;
    }

    private generateLanguagesCard(result: HowManyResult): string {
        const topLanguages = Object.entries(result.basic.stats_by_extension)
            .sort(([,a], [,b]) => b.total_lines - a.total_lines)
            .slice(0, 8);

        return `
            <section class="card" role="region" aria-labelledby="languages-title">
                <header class="card-header">
                    <span class="card-icon" aria-hidden="true">${Icons.files}</span>
                    <h2 class="card-title" id="languages-title">Languages</h2>
                </header>
                <ul class="languages-list" role="list">
                    ${topLanguages.map(([ext, data]) => `
                        <li class="language-item" role="listitem">
                            <span class="language-name">${ext.toUpperCase()}</span>
                            <span class="language-stats">
                                ${data.file_count} files • ${data.total_lines.toLocaleString()} lines
                            </span>
                        </li>
                    `).join('')}
                </ul>
            </section>`;
    }

    private generateTimeCard(result: HowManyResult): string {
        if (!result.time) {
            return '';
        }

        return `
            <section class="card" role="region" aria-labelledby="time-title">
                <header class="card-header">
                    <span class="card-icon" aria-hidden="true">${Icons.clock}</span>
                    <h2 class="card-title" id="time-title">Development Time</h2>
                </header>
                <div class="metric">
                    <span class="metric-label">Total Time</span>
                    <span class="metric-value">${result.time.total_time_formatted}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Code Writing</span>
                    <span class="metric-value">${result.time.code_time_formatted}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Documentation</span>
                    <span class="metric-value">${result.time.doc_time_formatted}</span>
                </div>
            </section>`;
    }

    private getQualityClass(score: number): string {
        if (score >= 85) return 'quality-excellent';
        if (score >= 75) return 'quality-good';
        if (score >= 60) return 'quality-warning';
        return 'quality-danger';
    }

    private formatHours(hours: number): string {
        const days = Math.floor(hours / 8);
        const remainingHours = Math.round(hours % 8);
        
        if (days > 0) {
            return `${days}d ${remainingHours}h`;
        }
        return `${remainingHours}h`;
    }

    private getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    private dispose(): void {
        HowManyReportPanel.currentPanel = undefined;
        this.panel.dispose();
        
        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
} 