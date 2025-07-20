import * as vscode from 'vscode';
import { HowManyService } from './services/HowManyService';
import { HowManyReportPanel } from './panels/HowManyReportPanel';
import { StatusBarManager } from './ui/StatusBarManager';
import { HowManyViewProvider } from './ui/HowManyViewProvider';
import { HowManyResult, ExtensionConfig, QuickAction } from './types/HowManyTypes';

let service: HowManyService;
let statusBar: StatusBarManager;
let viewProvider: HowManyViewProvider;

/**
 * Extension activation
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
    console.log('🚀 HowMany extension activating...');

    // Load configuration
    const config = loadConfiguration();
    
    // Initialize services
    service = new HowManyService(config);
    statusBar = new StatusBarManager(config);
    statusBar.initialize();
    
    // Initialize tree view provider
    viewProvider = new HowManyViewProvider();
    const treeView = vscode.window.createTreeView('howmanyExplorer', {
        treeDataProvider: viewProvider,
        showCollapseAll: false
    });
    
    // Add refresh command to tree view
    vscode.commands.registerCommand('howmany.refreshView', () => {
        refreshAnalysis();
    });

    // Auto-analyze on startup if workspace is available
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder && config.autoAnalyze) {
        // Run analysis in background after a short delay
        setTimeout(async () => {
            try {
                console.log('Auto-analyzing workspace on startup...');
                statusBar.showAnalyzing();
                viewProvider.setAnalyzing(true);
                
                const result = await service.analyzeWorkspace(workspaceFolder.uri.fsPath);
                if (result) {
                    statusBar.updateWithResult(result);
                    viewProvider.updateResult(result);
                    
                    // Update the report panel if it's currently open
                    const extension = vscode.extensions.getExtension('howmany.howmany-vscode');
                    if (HowManyReportPanel.isOpen()) {
                        HowManyReportPanel.createOrShow(result, extension?.extensionUri);
                    }
                    
                    console.log('✅ Auto-analysis completed');
                }
            } catch (error) {
                console.log('❌ Auto-analysis failed:', error);
                statusBar.showError();
                viewProvider.setAnalyzing(false);
            }
        }, 1000); // 1 second delay to let VS Code fully load
    }

    // Register commands
    const commands = [
        vscode.commands.registerCommand('howmany.analyzeWorkspace', analyzeWorkspace),
        vscode.commands.registerCommand('howmany.analyzeCurrentFile', analyzeCurrentFile),
        vscode.commands.registerCommand('howmany.showReport', showReport),
        vscode.commands.registerCommand('howmany.exportReport', exportReport),
        vscode.commands.registerCommand('howmany.refreshAnalysis', refreshAnalysis),
        vscode.commands.registerCommand('howmany.showQuickActions', showQuickActions),
        vscode.commands.registerCommand('howmany.openSettings', openSettings)
    ];

    // Register configuration change listener
    const configChangeListener = vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('howmany')) {
            const newConfig = loadConfiguration();
            statusBar.updateConfig(newConfig);
            // Note: Service config updates could be added here if needed
        }
    });

    commands.forEach(cmd => context.subscriptions.push(cmd));
    context.subscriptions.push(statusBar, configChangeListener);

    console.log('✅ HowMany extension activated');
}

/**
 * Extension deactivation
 */
export function deactivate(): void {
    console.log('👋 HowMany extension deactivating...');
    HowManyReportPanel.disposeAll();
}

/**
 * Load extension configuration
 */
function loadConfiguration(): ExtensionConfig {
    const config = vscode.workspace.getConfiguration('howmany');
    
    return {
        binaryPath: config.get('binaryPath', 'howmany'),
        autoAnalyze: config.get('autoAnalyze', true),
        maxDepth: config.get('maxDepth', 50),
        includeHidden: config.get('includeHidden', false),
        extensions: config.get('extensions', []),
        ignorePatterns: config.get('ignorePatterns', ['node_modules', 'target', 'dist', '.git']),
        sortBy: config.get('sortBy', 'lines'),
        showNotifications: config.get('showNotifications', true),
        statusBar: {
            display: config.get('statusBar.display', 'auto'),
            format: config.get('statusBar.format', 'abbreviated'),
            showQualityColor: config.get('statusBar.showQualityColor', true),
            showIcon: config.get('statusBar.showIcon', true),
            clickAction: config.get('statusBar.clickAction', 'quickActions')
        },
        webview: {
            theme: config.get('webview.theme', 'auto'),
            animations: config.get('webview.animations', true),
            autoRefresh: config.get('webview.autoRefresh', false)
        },
        analysis: {
            smartSuggestions: config.get('analysis.smartSuggestions', true),
            qualityThresholds: config.get('analysis.qualityThresholds', {
                overall: 70,
                maintainability: 65,
                documentation: 20,
                complexity: 10
            })
        },
        notifications: {
            showCompletion: config.get('notifications.showCompletion', true),
            showErrors: config.get('notifications.showErrors', true),
            showQualityWarnings: config.get('notifications.showQualityWarnings', true)
        },
        qualityThresholds: config.get('qualityThresholds', {
            overall: 70,
            maintainability: 65,
            documentation: 20,
            complexity: 10
        })
    };
}

/**
 * Analyze workspace command
 */
async function analyzeWorkspace(): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder is open');
        return;
    }

    try {
        statusBar.showAnalyzing();
        viewProvider.setAnalyzing(true);
        
        const result = await service.analyzeWorkspace(workspaceFolder.uri.fsPath);
        
        if (result) {
            statusBar.updateWithResult(result);
            viewProvider.updateResult(result);
            
            // Automatically open the report
            const extension = vscode.extensions.getExtension('howmany.howmany-vscode');
            HowManyReportPanel.createOrShow(result, extension?.extensionUri);
            
            if (loadConfiguration().showNotifications) {
                const message = `Analysis complete: ${result.basic.total_files} files, ${formatNumber(result.basic.total_lines)} lines`;
                vscode.window.showInformationMessage(message);
            }
        }
        
    } catch (error) {
        statusBar.showError();
        viewProvider.setAnalyzing(false);
        vscode.window.showErrorMessage(`Analysis failed: ${error}`);
    }
}

/**
 * Analyze current file command
 */
async function analyzeCurrentFile(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No file is open in the editor');
        return;
    }

    try {
        statusBar.showAnalyzing();
        viewProvider.setAnalyzing(true);
        const result = await service.analyzeCurrentFile(editor.document.uri.fsPath);
        if (result) {
            statusBar.updateWithResult(result);
            viewProvider.updateResult(result);
            
            // Automatically open the report
            const extension = vscode.extensions.getExtension('howmany.howmany-vscode');
            HowManyReportPanel.createOrShow(result, extension?.extensionUri);
            
            if (loadConfiguration().showNotifications) {
                const message = `Analysis complete for ${editor.document.fileName}: ${result.basic.total_lines} lines`;
                vscode.window.showInformationMessage(message);
            }
        }
    } catch (error) {
        statusBar.showError();
        viewProvider.setAnalyzing(false);
        vscode.window.showErrorMessage(`Analysis failed: ${error}`);
    }
}

/**
 * Show analysis report
 */
async function showReport(): Promise<void> {
    const result = service.getLastResult();
    if (!result) {
        const response = await vscode.window.showInformationMessage(
            'No analysis results available. Run an analysis first.',
            'Analyze Workspace'
        );
        if (response === 'Analyze Workspace') {
            await analyzeWorkspace();
        }
        return;
    }

    // Get the extension context to pass the extensionUri
    const extension = vscode.extensions.getExtension('howmany.howmany-vscode');
    HowManyReportPanel.createOrShow(result, extension?.extensionUri);
}

/**
 * Export report to file
 */
async function exportReport(): Promise<void> {
    const result = service.getLastResult();
    if (!result) {
        vscode.window.showErrorMessage('No analysis results to export');
        return;
    }

    const uri = await vscode.window.showSaveDialog({
        saveLabel: 'Export Report',
        filters: {
            'JSON': ['json'],
            'HTML': ['html'],
            'CSV': ['csv']
        }
    });

    if (uri) {
        try {
            await service.exportReport(result, uri.fsPath);
            vscode.window.showInformationMessage(`Report exported to ${uri.fsPath}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Export failed: ${error}`);
        }
    }
}

/**
 * Refresh analysis
 */
async function refreshAnalysis(): Promise<void> {
    await analyzeWorkspace();
}

/**
 * Show intelligent quick actions menu with context-aware options
 */
async function showQuickActions(): Promise<void> {
    const actions = getAvailableActions();
    
    if (actions.length === 0) {
        vscode.window.showInformationMessage('No actions available at this time.');
        return;
    }

    // Group actions by category for better UX
    const groupedActions = groupActionsByCategory(actions);
    const items = createQuickPickItems(groupedActions);

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Choose a HowMany action',
        title: 'HowMany Code Analysis',
        matchOnDescription: true,
        matchOnDetail: true
    });

    if (selected && selected.action) {
        await vscode.commands.executeCommand(`howmany.${selected.action}`);
    }
}

/**
 * Get available actions based on current state with enhanced intelligence
 */
function getAvailableActions(): QuickAction[] {
    const hasResults = service.getLastResult() !== null;
    const isAnalyzing = service.isRunning();
    const hasWorkspace = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0;
    const hasActiveFile = vscode.window.activeTextEditor !== undefined;
    const result = service.getLastResult();
    
    const actions: QuickAction[] = [];

    // Analysis Actions
    if (hasWorkspace) {
        actions.push({
            id: 'analyzeWorkspace',
            label: 'Analyze Workspace',
            icon: 'graph',
            enabled: !isAnalyzing,
            description: isAnalyzing ? 'Analysis in progress...' : 'Run comprehensive workspace analysis',
            category: 'analysis'
        });
    }

    if (hasActiveFile) {
        actions.push({
            id: 'analyzeCurrentFile',
            label: 'Analyze Current File',
            icon: 'file-code',
            enabled: !isAnalyzing,
            description: isAnalyzing ? 'Analysis in progress...' : 'Analyze the currently open file',
            category: 'analysis'
        });
    }

    // Results Actions (only show if we have results)
    if (hasResults) {
        actions.push(
            {
                id: 'showReport',
                label: 'Show Report',
                icon: 'report',
                enabled: true,
                description: 'View detailed analysis results in webview',
                category: 'results'
            },
            {
                id: 'exportReport',
                label: 'Export Report',
                icon: 'export',
                enabled: true,
                description: 'Save report as JSON, HTML, or CSV',
                category: 'results'
            }
        );

        // Smart refresh action with context
        if (!isAnalyzing) {
            const lastAnalysis = result?.metadata.timestamp;
            const timeAgo = lastAnalysis ? getTimeAgo(new Date(lastAnalysis)) : '';
            actions.push({
                id: 'refreshAnalysis',
                label: 'Refresh Analysis',
                icon: 'refresh',
                enabled: true,
                description: timeAgo ? `Re-run analysis (last: ${timeAgo})` : 'Re-run analysis',
                category: 'results'
            });
        }
    }

    // Configuration Actions
    actions.push({
        id: 'openSettings',
        label: 'Open Settings',
        icon: 'settings-gear',
        enabled: true,
        description: 'Configure HowMany extension preferences',
        category: 'config'
    });

    // Smart suggestions based on results
    const quality = result?.ratios?.quality_metrics;
    if (hasResults && quality) {
        if (quality.overall_quality_score < 60) {
            actions.push({
                id: 'showReport',
                label: 'Review Quality Issues',
                icon: 'warning',
                enabled: true,
                description: `Quality score is low (${Math.round(quality.overall_quality_score)}%) - review details`,
                category: 'suggestions'
            });
        }

        if (quality.documentation_score < 20) {
            actions.push({
                id: 'showReport',
                label: 'Improve Documentation',
                icon: 'book',
                enabled: true,
                description: `Documentation coverage is low (${Math.round(quality.documentation_score)}%)`,
                category: 'suggestions'
            });
        }
    }

    return actions.filter(action => action.enabled);
}

/**
 * Group actions by category for better organization
 */
function groupActionsByCategory(actions: QuickAction[]): Record<string, QuickAction[]> {
    const groups: Record<string, QuickAction[]> = {};
    
    actions.forEach(action => {
        const category = action.category || 'other';
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(action);
    });

    return groups;
}

/**
 * Create quick pick items with proper grouping and separators
 */
function createQuickPickItems(groupedActions: Record<string, QuickAction[]>): (vscode.QuickPickItem & { action?: string })[] {
    const items: (vscode.QuickPickItem & { action?: string })[] = [];
    
    const categoryOrder = ['analysis', 'results', 'suggestions', 'config'];
    const categoryLabels: Record<string, string> = {
        'analysis': 'Analysis',
        'results': 'Results',
        'suggestions': 'Suggestions',
        'config': 'Configuration'
    };

    let isFirst = true;
    
    categoryOrder.forEach(category => {
        if (groupedActions[category] && groupedActions[category].length > 0) {
            // Add separator (except for first category)
            if (!isFirst) {
                items.push({
                    label: '',
                    kind: vscode.QuickPickItemKind.Separator
                });
            }
            
            // Add category header if there are multiple categories
            if (Object.keys(groupedActions).length > 1) {
                items.push({
                    label: categoryLabels[category] || category.toUpperCase(),
                    kind: vscode.QuickPickItemKind.Separator
                });
            }

            // Add actions in this category
            groupedActions[category].forEach(action => {
                items.push({
                    label: `$(${action.icon}) ${action.label}`,
                    description: action.description,
                    action: action.id
                });
            });
            
            isFirst = false;
        }
    });

    return items;
}

/**
 * Get human-readable time ago string
 */
function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

/**
 * Open extension settings
 */
function openSettings(): void {
    vscode.commands.executeCommand('workbench.action.openSettings', 'howmany');
}

/**
 * Format number with abbreviation
 */
function formatNumber(value: number): string {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
} 