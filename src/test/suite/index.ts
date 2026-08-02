import { readdir } from 'fs/promises';
import * as path from 'path';
import Mocha from 'mocha';

/** Compiled suites sit under `dist/test`; walking them keeps the runner free of
 *  any file-matching dependency of its own. */
async function findTests(dir: string): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true });
    const nested = await Promise.all(
        entries.map(entry => {
            const full = path.resolve(dir, entry.name);
            if (entry.isDirectory()) return findTests(full);
            return entry.name.endsWith('.test.js') ? [full] : [];
        })
    );
    return nested.flat();
}

export async function run(): Promise<void> {
    const mocha = new Mocha({
        ui: 'tdd',
        color: true,
    });

    const testsRoot = path.resolve(__dirname, '..');
    for (const file of await findTests(testsRoot)) {
        mocha.addFile(file);
    }

    const failures = await new Promise<number>(resolve => mocha.run(resolve));
    if (failures > 0) {
        throw new Error(`${failures} tests failed.`);
    }
}
