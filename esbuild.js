// Bundles the extension into a single file.
//
// `.vscodeignore` excludes node_modules on purpose -- the published .vsix is
// meant to be compiled output and nothing else -- so a runtime dependency has
// to be compiled in rather than shipped alongside. `tsc` still runs first and
// still owns type checking and the declarations the test harness loads; this
// only replaces the entry point it emitted with a self-contained one.

const esbuild = require('esbuild');

const watch = process.argv.includes('--watch');

const options = {
    entryPoints: ['src/extension.ts'],
    bundle: true,
    outfile: 'dist/extension.js',
    // The extension host supplies `vscode` at runtime; bundling it would
    // produce a second, disconnected copy of the API.
    external: ['vscode'],
    format: 'cjs',
    platform: 'node',
    target: 'node18',
    sourcemap: true,
    minify: process.argv.includes('--minify'),
    logLevel: 'info',
};

async function main() {
    if (watch) {
        const context = await esbuild.context(options);
        await context.watch();
        return;
    }
    await esbuild.build(options);
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
