/**
 * Sample JavaScript file for testing HowMany VS Code extension.
 * 
 * This demonstrates various JavaScript patterns and complexity levels
 * that can be analyzed by HowMany.
 */

// Import statements (modern ES6+)
const fs = require('fs');
const path = require('path');

/**
 * Utility class for code analysis
 */
class CodeAnalyzer {
    /**
     * Creates a new CodeAnalyzer instance
     * @param {string} name - The analyzer name
     * @param {string} version - Version string
     */
    constructor(name, version = '1.0.0') {
        this.name = name;
        this.version = version;
        this.metrics = new Map();
    }

    /**
     * Analyzes a single file and returns basic metrics
     * @param {string} filePath - Path to the file to analyze
     * @returns {Promise<Object>} Analysis results
     */
    async analyzeFile(filePath) {
        try {
            // Check if file exists
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }

            const content = await fs.promises.readFile(filePath, 'utf8');
            const lines = content.split('\n');

            // Calculate basic metrics
            const metrics = {
                totalLines: lines.length,
                codeLines: lines.filter(line => 
                    line.trim() && 
                    !line.trim().startsWith('//') && 
                    !line.trim().startsWith('/*') &&
                    !line.trim().startsWith('*')
                ).length,
                commentLines: lines.filter(line => {
                    const trimmed = line.trim();
                    return trimmed.startsWith('//') || 
                           trimmed.startsWith('/*') || 
                           trimmed.startsWith('*');
                }).length,
                blankLines: lines.filter(line => !line.trim()).length
            };

            return metrics;
        } catch (error) {
            console.error(`Error analyzing file ${filePath}:`, error.message);
            throw error;
        }
    }

    /**
     * Analyzes multiple files in a directory
     * @param {string} directory - Directory to analyze
     * @param {Array<string>} extensions - File extensions to include
     * @returns {Promise<Object>} Combined analysis results
     */
    async analyzeDirectory(directory, extensions = ['.js', '.ts', '.jsx', '.tsx']) {
        const results = {};

        try {
            const files = await this.getFilesRecursively(directory, extensions);
            
            // Process files in parallel for better performance
            const analysisPromises = files.map(async (file) => {
                try {
                    const metrics = await this.analyzeFile(file);
                    const relativePath = path.relative(directory, file);
                    return { path: relativePath, metrics };
                } catch (error) {
                    console.warn(`Skipping file ${file}: ${error.message}`);
                    return null;
                }
            });

            const analysisResults = await Promise.all(analysisPromises);
            
            // Filter out failed analyses and build results object
            analysisResults
                .filter(result => result !== null)
                .forEach(result => {
                    results[result.path] = result.metrics;
                });

            return results;
        } catch (error) {
            console.error(`Error analyzing directory ${directory}:`, error.message);
            throw error;
        }
    }

    /**
     * Recursively gets all files with specified extensions
     * @param {string} directory - Directory to search
     * @param {Array<string>} extensions - File extensions to include
     * @returns {Promise<Array<string>>} Array of file paths
     */
    async getFilesRecursively(directory, extensions) {
        const files = [];

        async function traverse(dir) {
            const entries = await fs.promises.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory()) {
                    // Skip hidden directories and common ignore patterns
                    if (!entry.name.startsWith('.') && 
                        !['node_modules', 'dist', 'build'].includes(entry.name)) {
                        await traverse(fullPath);
                    }
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name);
                    if (extensions.includes(ext)) {
                        files.push(fullPath);
                    }
                }
            }
        }

        await traverse(directory);
        return files;
    }

    /**
     * Generates a formatted report from analysis results
     * @param {Object} results - Analysis results from analyzeDirectory
     * @returns {string} Formatted report
     */
    generateReport(results) {
        if (!results || Object.keys(results).length === 0) {
            return 'No files analyzed.';
        }

        const files = Object.keys(results);
        const totalFiles = files.length;

        // Calculate totals
        const totals = files.reduce((acc, file) => {
            const metrics = results[file];
            acc.totalLines += metrics.totalLines;
            acc.codeLines += metrics.codeLines;
            acc.commentLines += metrics.commentLines;
            acc.blankLines += metrics.blankLines;
            return acc;
        }, { totalLines: 0, codeLines: 0, commentLines: 0, blankLines: 0 });

        // Calculate ratios
        const docRatio = totals.totalLines > 0 
            ? (totals.commentLines / totals.totalLines * 100).toFixed(1)
            : '0.0';

        // Get top 5 largest files
        const sortedFiles = files
            .map(file => ({ file, metrics: results[file] }))
            .sort((a, b) => b.metrics.totalLines - a.metrics.totalLines)
            .slice(0, 5);

        // Build report
        const report = `
Analysis Report - ${this.name} v${this.version}
${'='.repeat(50)}

Files analyzed: ${totalFiles.toLocaleString()}
Total lines: ${totals.totalLines.toLocaleString()}
Code lines: ${totals.codeLines.toLocaleString()}
Comment lines: ${totals.commentLines.toLocaleString()}
Blank lines: ${totals.blankLines.toLocaleString()}
Documentation ratio: ${docRatio}%

Top 5 largest files:
${sortedFiles.map((item, index) => 
    `  ${index + 1}. ${item.file}: ${item.metrics.totalLines.toLocaleString()} lines`
).join('\n')}
`;

        return report;
    }
}

/**
 * Main function to run the analyzer
 * @param {Array<string>} args - Command line arguments
 */
async function main(args) {
    if (args.length < 3) {
        console.log('Usage: node sample.js <directory>');
        process.exit(1);
    }

    const directory = args[2];
    const analyzer = new CodeAnalyzer('JavaScript Analyzer');

    try {
        console.log(`Analyzing directory: ${directory}`);
        const results = await analyzer.analyzeDirectory(directory);
        
        const report = analyzer.generateReport(results);
        console.log(report);
    } catch (error) {
        console.error('Analysis failed:', error.message);
        process.exit(1);
    }
}

// Export for use as module
module.exports = { CodeAnalyzer };

// Run if called directly
if (require.main === module) {
    main(process.argv);
} 