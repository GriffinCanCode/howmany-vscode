#!/usr/bin/env node

/**
 * VS Code Marketplace Readiness Verification Script
 * Checks if the HowMany VS Code Extension meets marketplace standards
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 HowMany VS Code Extension - Marketplace Readiness Check');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

function check(description, condition, details = '') {
    if (condition) {
        console.log(`✅ ${description}`);
        passed++;
    } else {
        console.log(`❌ ${description}`);
        if (details) console.log(`   ${details}`);
        failed++;
    }
}

function checkFile(filePath, description) {
    const exists = fs.existsSync(filePath);
    const size = exists ? fs.statSync(filePath).size : 0;
    check(`${description} exists`, exists, exists ? `(${size} bytes)` : 'File not found');
    return exists;
}

// Load package.json
const packagePath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

console.log('\n📦 Package Configuration');
console.log('-'.repeat(30));

check('Package name is valid', packageJson.name && packageJson.name.length > 0);
check('Display name is set', packageJson.displayName && packageJson.displayName.length > 0);
check('Description is comprehensive', packageJson.description && packageJson.description.length > 50);
check('Version is set', packageJson.version && packageJson.version.match(/^\d+\.\d+\.\d+$/));
check('Publisher is set', packageJson.publisher && packageJson.publisher.length > 0);
check('Repository URL is set', packageJson.repository && packageJson.repository.url);
check('License is specified', packageJson.license === 'MIT');
check('VS Code engine version', packageJson.engines && packageJson.engines.vscode);
check('Categories are appropriate', packageJson.categories && packageJson.categories.length >= 3);
check('Keywords are comprehensive', packageJson.keywords && packageJson.keywords.length >= 10);

console.log('\n🎨 Visual Assets');
console.log('-'.repeat(30));

checkFile('resources/icon.png', 'Main icon (PNG)');
checkFile('resources/icon.svg', 'Vector icon (SVG)');
checkFile('resources/icon-16.png', '16x16 icon');
checkFile('resources/icon-32.png', '32x32 icon');

check('Gallery banner configured', packageJson.galleryBanner && packageJson.galleryBanner.color);

console.log('\n📚 Documentation');
console.log('-'.repeat(30));

const readmeExists = checkFile('README.md', 'README.md');
if (readmeExists) {
    const readmeContent = fs.readFileSync('README.md', 'utf8');
    check('README is comprehensive', readmeContent.length > 5000);
    check('README has installation instructions', readmeContent.includes('## 🚀 Quick Start'));
    check('README has configuration examples', readmeContent.includes('## 🔧 Configuration'));
    check('README has usage examples', readmeContent.includes('## 🎯 Usage'));
    check('README has badges', readmeContent.includes('!['));
}

checkFile('CHANGELOG.md', 'CHANGELOG.md');
checkFile('CONTRIBUTING.md', 'CONTRIBUTING.md');
checkFile('LICENSE', 'LICENSE file');
checkFile('MARKETPLACE.md', 'Marketplace deployment guide');

console.log('\n🏗️ Build System');
console.log('-'.repeat(30));

check('TypeScript config exists', fs.existsSync('tsconfig.json'));
check('ESLint config exists', fs.existsSync('.eslintrc.json'));
check('Prettier config exists', fs.existsSync('.prettierrc.json'));
check('VS Code ignore file exists', fs.existsSync('.vscodeignore'));

// Check if dist folder exists and has content
const distExists = fs.existsSync('dist');
check('Compiled output exists', distExists);
if (distExists) {
    const distFiles = fs.readdirSync('dist');
    check('Extension compiled', distFiles.includes('extension.js'));
}

// Check package scripts
const scripts = packageJson.scripts || {};
check('Compile script exists', 'compile' in scripts);
check('Package script exists', 'package' in scripts);
check('Lint script exists', 'lint' in scripts);
check('Test script exists', 'test' in scripts);
check('Publish scripts exist', 'publish' in scripts && 'deploy' in scripts);

console.log('\n⚙️ GitHub Actions');
console.log('-'.repeat(30));

checkFile('.github/workflows/ci.yml', 'CI workflow');
checkFile('.github/workflows/publish.yml', 'Publish workflow');

console.log('\n🧪 Testing');
console.log('-'.repeat(30));

checkFile('src/test/runTest.ts', 'Test runner');
checkFile('src/test/suite/extension.test.ts', 'Extension tests');

console.log('\n📦 Package Verification');
console.log('-'.repeat(30));

const vsixExists = fs.existsSync('howmany-vscode-0.1.0.vsix');
check('VSIX package exists', vsixExists);
if (vsixExists) {
    const vsixSize = fs.statSync('howmany-vscode-0.1.0.vsix').size;
    check('Package size is reasonable', vsixSize < 10 * 1024 * 1024, `${(vsixSize / 1024).toFixed(1)} KB`);
}

console.log('\n🔗 Integration');
console.log('-'.repeat(30));

check('HowMany core repository linked', packageJson.homepage && packageJson.homepage.includes('howmany'));
check('Bug tracker configured', packageJson.bugs && packageJson.bugs.url);

console.log('\n' + '='.repeat(60));
console.log(`📊 Summary: ${passed} passed, ${failed} failed`);

if (failed === 0) {
    console.log('🎉 READY FOR MARKETPLACE! All checks passed.');
    console.log('\nNext steps:');
    console.log('1. Create Azure DevOps publisher account');
    console.log('2. Get Personal Access Token');
    console.log('3. Run: vsce login <publisher>');
    console.log('4. Run: npm run publish');
    console.log('5. Monitor marketplace listing');
} else {
    console.log('⚠️  Some issues need to be addressed before publishing.');
    console.log('Please fix the failed checks above.');
}

console.log('\n📖 For detailed instructions, see MARKETPLACE.md');
process.exit(failed > 0 ? 1 : 0); 