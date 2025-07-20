import * as assert from 'assert';
import * as vscode from 'vscode';

suite('HowMany Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('howmany.howmany-vscode'));
    });

    test('Extension should activate', async () => {
        const extension = vscode.extensions.getExtension('howmany.howmany-vscode');
        assert.ok(extension);
        
        if (extension && !extension.isActive) {
            await extension.activate();
        }
        
        assert.ok(extension?.isActive);
    });

    test('Commands should be registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        
        const expectedCommands = [
            'howmany.analyzeWorkspace',
            'howmany.analyzeCurrentFile',
            'howmany.showReport',
            'howmany.exportReport',
            'howmany.refreshAnalysis',
            'howmany.showQuickActions',
            'howmany.openSettings'
        ];

        expectedCommands.forEach(cmd => {
            assert.ok(commands.includes(cmd), `Command ${cmd} should be registered`);
        });
    });

    test('Configuration should have default values', () => {
        const config = vscode.workspace.getConfiguration('howmany');
        
        assert.strictEqual(config.get('binaryPath'), 'howmany');
        assert.strictEqual(config.get('autoAnalyze'), false);
        assert.strictEqual(config.get('maxDepth'), 50);
        assert.strictEqual(config.get('showNotifications'), true);
    });

    test('Status bar configuration should be valid', () => {
        const config = vscode.workspace.getConfiguration('howmany');
        const statusBarConfig = config.get('statusBar') as any;
        
        assert.ok(statusBarConfig);
        assert.ok(['auto', 'lines', 'files', 'quality'].includes(statusBarConfig.display));
        assert.ok(['abbreviated', 'full', 'compact'].includes(statusBarConfig.format));
        assert.strictEqual(typeof statusBarConfig.showQualityColor, 'boolean');
    });
}); 