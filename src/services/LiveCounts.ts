import * as vscode from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions } from 'vscode-languageclient/node';

/**
 * The live line breakdown shown above each file.
 *
 * The CLI carries a language server (`howmany lsp`) that counts the buffer you
 * are editing, so the number in the code lens is produced by the same
 * classifier as the number in the report and cannot drift from it. Everything
 * this extension already does -- the tree, the status bar, the webview report --
 * is untouched; this only adds the per-file view, which needs a server because
 * it has to re-count on every keystroke.
 */
export class LiveCounts implements vscode.Disposable {
    private client: LanguageClient | undefined;

    /**
     * Start the server, unless the user has turned this off.
     *
     * A failure here is deliberately quiet. The rest of the extension works
     * without a language server, and an error notification on every window
     * opened with an older CLI installed would be worse than a missing lens.
     */
    async start(): Promise<void> {
        if (this.client) return;

        const settings = vscode.workspace.getConfiguration('howmany');
        if (!settings.get<boolean>('liveCounts', true)) return;

        const binary = settings.get<string>('binaryPath', 'howmany');
        const server: ServerOptions = {
            command: binary,
            args: ['lsp'],
            options: { env: process.env },
        };

        const options: LanguageClientOptions = {
            // Every file, because every file has a line count. Restricting this
            // to known languages would leave the lens off exactly the files
            // whose contents are hardest to guess at.
            documentSelector: [{ scheme: 'file' }],
            outputChannel: vscode.window.createOutputChannel('HowMany'),
            // A missing binary is reported through the status bar the extension
            // already owns, not through a modal the user has to dismiss.
            revealOutputChannelOn: 4,
        };

        const client = new LanguageClient('howmany', 'HowMany', server, options);

        try {
            await client.start();
            this.client = client;
        } catch (error) {
            console.log(`HowMany live counts unavailable: ${error}`);
        }
    }

    async stop(): Promise<void> {
        const running = this.client;
        this.client = undefined;
        await running?.stop().catch(() => undefined);
    }

    /** Restart so a changed binary path or threshold takes effect at once. */
    async restart(): Promise<void> {
        await this.stop();
        await this.start();
    }

    dispose(): void {
        void this.stop();
    }
}
