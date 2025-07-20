# HowMany VS Code Extension

**Intelligent code analysis with complexity metrics and quality scores**

A VS Code extension that integrates with the [HowMany](https://github.com/GriffinCanCode/howmany) code analysis tool to provide real-time insights into your codebase.

## Screenshots

## What It Does

- **Status Bar Integration**: Shows live metrics (lines of code, file count, or quality score) in your VS Code status bar
- **Interactive Reports**: Generate detailed analysis reports with quality metrics, complexity scores, and language breakdowns
- **Quality Assessment**: Evaluate code maintainability, documentation coverage, and technical debt

- **Multi-Language Support**: Analyze 25+ programming languages with intelligent file detection

![HowMany VS Code Extension](resources/vscode.png)


## Why Use It

- **Immediate Feedback**: See code metrics without leaving your editor
- **Quality Awareness**: Track code health and identify areas needing attention  
- **Project Understanding**: Quickly assess unfamiliar codebases
- **Technical Debt**: Quantify maintainability issues before they become problems
- **Team Alignment**: Share consistent quality metrics across development teams

![HowMany CLI](resources/cli.png)

## Installation

1. Install the extension from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=GriffinCanCode.howmany)
2. Install the HowMany CLI:
   ```bash
   # Using Homebrew (macOS/Linux)
   brew install howmany
   
   # Using Cargo
   cargo install howmany
   ```

## Usage

- **Status Bar**: Click the HowMany indicator for quick actions
- **Command Palette**: Search "HowMany" for available commands
- **Context Menu**: Right-click folders or files for analysis options

## Configuration

Key settings in VS Code preferences:

```json
{
  "howmany.statusBar.display": "smart",
  "howmany.statusBar.format": "abbreviated",
  "howmany.autoAnalyze": true,
  "howmany.binaryPath": "howmany"
}
```

## Requirements

- VS Code 1.85.0 or higher
- HowMany CLI installed and accessible in PATH
- Node.js 18+ (for development)

## Integration

This extension interfaces directly with the [HowMany Rust binary](https://github.com/GriffinCanCode/howmany), providing:

- Type-safe communication between TypeScript and Rust
- Efficient JSON-based data exchange
- Automatic error handling and recovery
- Caching for improved performance

## Related Tools

- [HowMany Core](https://github.com/GriffinCanCode/howmany) - The main CLI tool
- [HowMany GitHub Action](https://github.com/GriffinCanCode/howmany-actions) - CI/CD integration

## License

MIT License - see [LICENSE](LICENSE) for details. 