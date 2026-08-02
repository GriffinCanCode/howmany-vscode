# Contributing to HowMany VS Code Extension

Thank you for your interest in contributing to the HowMany VS Code Extension! This document provides guidelines and instructions for contributing to this project.

## 🚀 Quick Start

### Prerequisites

- **VS Code**: 1.85.0 or higher
- **Node.js**: 22.0.0 or higher (build tooling only — the extension itself runs
  on the Node bundled with VS Code, currently 18.x)
- **npm**: 8.0.0 or higher
- **HowMany CLI**: Installed and accessible in PATH
- **Git**: For version control

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/howmany-vscode.git
   cd howmany-vscode
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Install HowMany CLI**
   ```bash
   # Using Homebrew (recommended)
   brew install GriffinCanCode/howmany/howmany
   
   # Or using Cargo
   cargo install howmany
   ```

4. **Open in VS Code**
   ```bash
   code .
   ```

5. **Start Development**
   - Press `F5` to launch the Extension Development Host
   - Make changes to the source code
   - Reload the extension host with `Ctrl+R` (or `Cmd+R` on macOS)

## 📁 Project Structure

```
howmany-vscode/
├── 📄 Core Configuration
│   ├── package.json              # Extension manifest & dependencies
│   ├── tsconfig.json             # TypeScript configuration
│   ├── eslint.config.js         # Code quality rules
│   └── .vscodeignore            # Files excluded from packaging
├── 📦 Source Code
│   └── src/
│       ├── extension.ts          # Main extension entry point
│       ├── types/
│       │   └── HowManyTypes.ts   # TypeScript interfaces
│       ├── services/
│       │   └── HowManyService.ts # Binary execution & analysis
│       ├── ui/
│       │   ├── StatusBarManager.ts # Status bar integration
│       │   └── HowManyViewProvider.ts # Tree view provider
│       ├── panels/
│       │   └── HowManyReportPanel.ts # Webview reports
│       └── styles/
│           └── report.css        # Report styling
├── 🎨 Resources
│   └── resources/                # Icons and assets
├── 📚 Documentation
│   ├── README.md                 # Main documentation
│   ├── CHANGELOG.md              # Release history
│   ├── CONTRIBUTING.md           # This file
│   └── docs/
│       ├── structure.md          # Architecture guide
│       ├── testing.md            # Testing instructions
│       └── marketplace.md        # Marketplace deployment guide
├── 🔧 Tooling
│   └── tools/                    # Development scripts (npm run verify)
└── 🏗️ Build Output
    └── dist/                     # Compiled JavaScript
```

## 🛠️ Development Workflow

### Code Style

We maintain high code quality standards:

- **TypeScript**: Full type safety with strict mode enabled
- **ESLint**: Comprehensive linting rules for consistency
- **Prettier**: Automatic code formatting
- **VS Code Standards**: Following extension development best practices

### Available Scripts

```bash
# Development
npm run compile          # Compile TypeScript
npm run watch           # Watch for changes and recompile
npm run lint            # Run ESLint checks
npm run format          # Format code with Prettier

# Testing
npm test                # Run test suite
npm run test:watch      # Run tests in watch mode

# Building & Packaging
npm run package         # Create .vsix package
npm run vscode:prepublish # Pre-publish script (compile + lint)
```

### Making Changes

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow the existing code patterns
   - Add TypeScript types for new interfaces
   - Update documentation if needed

3. **Test Your Changes**
   ```bash
   npm run compile
   npm test
   npm run lint
   ```

4. **Test in Extension Host**
   - Press `F5` to launch Extension Development Host
   - Test your changes thoroughly
   - Check status bar, commands, and webview functionality

5. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

## 🧪 Testing

### Manual Testing

1. **Extension Development Host**
   - Press `F5` to launch a new VS Code window with your extension
   - Open a project folder with code files
   - Test all extension features:
     - Status bar display and interactions
     - Command palette commands
     - Quick actions menu
     - Report webview
     - Export functionality

2. **Test Scenarios**
   - Small projects (<100 files)
   - Large projects (1000+ files)
   - Projects with no supported files
   - Projects with quality issues
   - Different VS Code themes (light/dark)

### Automated Testing

```bash
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
```

### Integration Testing

Test with different HowMany CLI versions:
```bash
# Test with different versions
howmany --version       # Check current version
npm test               # Run tests with current version
```

## 📝 Code Guidelines

### TypeScript

- Use strict TypeScript configuration
- Define interfaces for all data structures
- Use proper typing for VS Code API calls
- Avoid `any` types - use proper interfaces

```typescript
// Good
interface AnalysisResult {
  totalFiles: number;
  totalLines: number;
  qualityScore: number;
}

// Avoid
const result: any = await analyze();
```

### Error Handling

- Always handle errors gracefully
- Provide meaningful error messages to users
- Log errors for debugging but don't expose internal details

```typescript
try {
  const result = await service.analyzeWorkspace(path);
  // Handle success
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  vscode.window.showErrorMessage(`Analysis failed: ${message}`);
  console.error('Analysis error:', error);
}
```

### VS Code Integration

- Use VS Code's native UI components when possible
- Follow VS Code's design patterns and conventions
- Respect user preferences (themes, settings)
- Handle workspace changes gracefully

### Performance

- Cache analysis results when appropriate
- Use VS Code's progress API for long-running operations
- Dispose of resources properly to prevent memory leaks

## 🎨 UI/UX Guidelines

### Status Bar

- Keep status bar text concise
- Use appropriate colors for quality indicators
- Provide helpful tooltips
- Handle different display modes properly

### Webview Reports

- Maintain responsive design
- Support both light and dark themes
- Use semantic HTML with proper ARIA labels
- Ensure keyboard navigation works

### Commands and Menus

- Use clear, descriptive command names
- Group related commands logically
- Provide keyboard shortcuts for frequently used actions
- Show commands only when relevant

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Environment Information**
   - VS Code version
   - Extension version
   - Operating system
   - HowMany CLI version

2. **Steps to Reproduce**
   - Clear, numbered steps
   - Sample project or code if possible
   - Expected vs actual behavior

3. **Logs and Screenshots**
   - VS Code Developer Console output
   - Screenshots if UI-related
   - Error messages

## 💡 Feature Requests

When suggesting features:

1. **Use Case**: Describe the problem you're trying to solve
2. **Proposed Solution**: How you envision the feature working
3. **Alternatives**: Other solutions you've considered
4. **Implementation**: Technical considerations if applicable

## 📋 Pull Request Process

1. **Before Submitting**
   - Ensure all tests pass
   - Run linting and fix any issues
   - Test manually in Extension Development Host
   - Update documentation if needed

2. **PR Description**
   - Clear title describing the change
   - Detailed description of what changed and why
   - Screenshots for UI changes
   - Link to related issues

3. **Review Process**
   - Maintainers will review your PR
   - Address feedback promptly
   - Keep PR focused and atomic

## 🏷️ Commit Convention

We use conventional commits for clear history:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Build process or auxiliary tool changes

Examples:
```
feat: add smart status bar display mode
fix: handle empty analysis results gracefully
docs: update configuration examples
refactor: extract report generation logic
```

## 🔄 Release Process

Releases are handled by maintainers:

1. Version bump in `package.json`
2. Update CHANGELOG.md
3. Create GitHub release
4. Publish to VS Code Marketplace

## 📞 Getting Help

- **Issues**: [GitHub Issues](https://github.com/GriffinCanCode/howmany-vscode/issues)
- **Discussions**: [GitHub Discussions](https://github.com/GriffinCanCode/howmany-vscode/discussions)
- **Email**: contact@howmany.dev

## 📜 Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). Please be respectful and professional in all interactions.

---

Thank you for contributing to the HowMany VS Code Extension! Your help makes this project better for everyone. 🎉 