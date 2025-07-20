import * as vscode from 'vscode';
import * as path from 'path';
import { spawn } from 'child_process';
import { HowManyResult, ExtensionConfig } from '../types/HowManyTypes';

export class HowManyService {
    private lastResult: HowManyResult | null = null;
    private isAnalyzing = false;

    constructor(private config: ExtensionConfig) {}

    /**
     * Analyze workspace directory
     */
    async analyzeWorkspace(workspacePath: string): Promise<HowManyResult | null> {
        if (this.isAnalyzing) {
            vscode.window.showWarningMessage('Analysis already in progress');
            return null;
        }

        this.isAnalyzing = true;
        
        try {
            const args = this.buildAnalysisArgs(workspacePath);
            const result = await this.executeHowMany(args);
            
            if (result) {
                this.lastResult = result;
                return result;
            }
            
            return null;
        } finally {
            this.isAnalyzing = false;
        }
    }

    /**
     * Analyze current file
     */
    async analyzeCurrentFile(filePath: string): Promise<HowManyResult | null> {
        if (this.isAnalyzing) {
            vscode.window.showWarningMessage('Analysis already in progress');
            return null;
        }

        this.isAnalyzing = true;
        
        try {
            const args = this.buildAnalysisArgs(filePath);
            const result = await this.executeHowMany(args);
            
            if (result) {
                this.lastResult = result;
                return result;
            }
            
            return null;
        } finally {
            this.isAnalyzing = false;
        }
    }

    /**
     * Get the last analysis result
     */
    getLastResult(): HowManyResult | null {
        return this.lastResult;
    }

    /**
     * Check if analysis is currently running
     */
    isRunning(): boolean {
        return this.isAnalyzing;
    }

    /**
     * Export report to file
     */
    async exportReport(result: HowManyResult, filePath: string): Promise<void> {
        const extension = path.extname(filePath).toLowerCase();
        let content: string;

        switch (extension) {
            case '.json':
                content = JSON.stringify(result, null, 2);
                break;
            case '.html':
                content = this.generateHtmlReport(result);
                break;
            case '.csv':
                content = this.generateCsvReport(result);
                break;
            default:
                throw new Error(`Unsupported export format: ${extension}`);
        }

        await vscode.workspace.fs.writeFile(
            vscode.Uri.file(filePath),
            Buffer.from(content, 'utf8')
        );
    }

    /**
     * Build command line arguments for howmany
     */
    private buildAnalysisArgs(targetPath: string): string[] {
        const args = ['--output', 'json', '--no-interactive'];

        // Add target path (can be omitted for current directory)
        if (targetPath && targetPath !== '.') {
            args.unshift(targetPath);
        }

        if (this.config.maxDepth && this.config.maxDepth > 0) {
            args.push('--depth', this.config.maxDepth.toString());
        }

        if (this.config.includeHidden) {
            args.push('--hidden');
        }

        if (this.config.extensions && this.config.extensions.length > 0) {
            args.push('--ext', this.config.extensions.join(','));
        }

        if (this.config.ignorePatterns && this.config.ignorePatterns.length > 0) {
            args.push('--ignore', this.config.ignorePatterns.join(','));
        }

        if (this.config.sortBy) {
            args.push('--sort', this.config.sortBy);
        }

        return args;
    }

    /**
     * Execute howmany binary and parse results
     */
    private async executeHowMany(args: string[]): Promise<HowManyResult | null> {
        return new Promise((resolve, reject) => {
            const process = spawn(this.config.binaryPath, args);
            let stdout = '';
            let stderr = '';

            process.stdout.on('data', (data: Buffer) => {
                stdout += data.toString();
            });

            process.stderr.on('data', (data: Buffer) => {
                stderr += data.toString();
            });

            process.on('close', (code: number | null) => {
                if (code !== 0) {
                    reject(new Error(`HowMany failed with code ${code}: ${stderr}`));
                    return;
                }

                try {
                    // Clean the output - remove any non-JSON lines
                    const cleanOutput = this.cleanJsonOutput(stdout);
                    const result = JSON.parse(cleanOutput) as HowManyResult;
                    resolve(result);
                } catch (error) {
                    reject(new Error(`Failed to parse HowMany output: ${error}\n\nRaw output:\n${stdout}`));
                }
            });

            process.on('error', (error: Error) => {
                reject(new Error(`Failed to execute HowMany: ${error.message}`));
            });
        });
    }

    /**
     * Clean JSON output by removing any non-JSON lines
     */
    private cleanJsonOutput(output: string): string {
        const lines = output.split('\n');
        let jsonStart = -1;
        let jsonEnd = -1;
        let braceCount = 0;

        // Find the start and end of the JSON object
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('{') && jsonStart === -1) {
                jsonStart = i;
                braceCount = 1;
            } else if (jsonStart !== -1) {
                for (const char of line) {
                    if (char === '{') braceCount++;
                    else if (char === '}') braceCount--;
                }
                
                if (braceCount === 0) {
                    jsonEnd = i;
                    break;
                }
            }
        }

        if (jsonStart !== -1 && jsonEnd !== -1) {
            return lines.slice(jsonStart, jsonEnd + 1).join('\n');
        }

        // Fallback: try to find JSON by looking for the first { and last }
        const firstBrace = output.indexOf('{');
        const lastBrace = output.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            return output.substring(firstBrace, lastBrace + 1);
        }

        // If we can't find clean JSON, return the original output
        return output;
    }

    /**
     * Generate HTML report
     */
    private generateHtmlReport(result: HowManyResult): string {
        const quality = result.ratios?.quality_metrics;
        return `
<!DOCTYPE html>
<html>
<head>
    <title>HowMany Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 2rem; }
        .metric { margin: 1rem 0; padding: 1rem; border-left: 4px solid #007ACC; background: #f8f9fa; }
        .quality-good { border-color: #28a745; }
        .quality-warning { border-color: #ffc107; }
        .quality-danger { border-color: #dc3545; }
        table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        th, td { text-align: left; padding: 0.5rem; border-bottom: 1px solid #dee2e6; }
        th { background: #f8f9fa; }
    </style>
</head>
<body>
    <h1>HowMany Report</h1>
    <div class="metric">
        <h3>📊 Overview</h3>
        <p>Files: ${result.basic.total_files}</p>
        <p>Lines: ${result.basic.total_lines.toLocaleString()}</p>
        <p>Code Lines: ${result.basic.code_lines.toLocaleString()}</p>
        <p>Documentation Lines: ${result.basic.doc_lines.toLocaleString()}</p>
        <p>Comment Lines: ${result.basic.comment_lines.toLocaleString()}</p>
    </div>
    ${quality ? `
    <div class="metric ${this.getQualityClass(quality.overall_quality_score)}">
        <h3>🎯 Quality Metrics</h3>
        <p>Overall Score: ${quality.overall_quality_score.toFixed(1)}%</p>
        <p>Maintainability: ${quality.maintainability_score.toFixed(1)}%</p>
        <p>Documentation: ${quality.documentation_score.toFixed(1)}%</p>
        <p>Readability: ${quality.readability_score.toFixed(1)}%</p>
    </div>
    ` : ''}
    ${result.time ? `
    <div class="metric">
        <h3>⏱️ Development Time</h3>
        <p>Total Time: ${result.time.total_time_formatted}</p>
        <p>Code Time: ${result.time.code_time_formatted}</p>
        <p>Documentation Time: ${result.time.doc_time_formatted}</p>
    </div>
    ` : ''}
</body>
</html>`;
    }

    /**
     * Generate CSV report
     */
    private generateCsvReport(result: HowManyResult): string {
        const rows = [
            ['Metric', 'Value'],
            ['Total Files', result.basic.total_files.toString()],
            ['Total Lines', result.basic.total_lines.toString()],
            ['Code Lines', result.basic.code_lines.toString()],
            ['Comment Lines', result.basic.comment_lines.toString()],
            ['Documentation Lines', result.basic.doc_lines.toString()],
            ['Blank Lines', result.basic.blank_lines.toString()]
        ];

        const quality = result.ratios?.quality_metrics;
        if (quality) {
            rows.push(
                ['Overall Quality', `${quality.overall_quality_score.toFixed(1)}%`],
                ['Maintainability', `${quality.maintainability_score.toFixed(1)}%`],
                ['Documentation', `${quality.documentation_score.toFixed(1)}%`],
                ['Readability', `${quality.readability_score.toFixed(1)}%`]
            );
        }

        if (result.time) {
            rows.push(
                ['Total Time', result.time.total_time_formatted],
                ['Code Time', result.time.code_time_formatted],
                ['Documentation Time', result.time.doc_time_formatted]
            );
        }

        return rows.map(row => row.join(',')).join('\n');
    }

    /**
     * Get quality CSS class for styling
     */
    private getQualityClass(score: number): string {
        if (score >= 85) return 'quality-good';
        if (score >= 65) return 'quality-warning';
        return 'quality-danger';
    }
} 