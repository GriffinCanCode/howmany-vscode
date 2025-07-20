# Changelog

All notable changes to the HowMany VS Code Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.4] - 2025-01-20

### 📝 Documentation Update
- **IMPROVED**: Completely rewritten README for professional presentation
- **SIMPLIFIED**: Removed emojis and fluff, focused on core functionality
- **CLARIFIED**: Clear value proposition and use cases

## [0.1.3] - 2025-01-20

### 🎨 Status Bar Icon Update
- **NEW**: Custom status bar icon using "?" symbol from HowMany logo
- **IMPROVED**: More distinctive status bar presence
- Replaced generic graph icon with brand-specific identifier

## [0.1.2] - 2025-01-20

### 🎨 Visual Update
- **NEW**: Updated to use official HowMany logo
- **IMPROVED**: Better marketplace visual identity
- High-resolution icon (1024x1024) for crisp display

## [0.1.1] - 2025-01-20

### 🔄 Package Rename
- **BREAKING**: Extension name changed from `howmany-vscode` to `howmany`
- Extension ID is now `GriffinCanCode.howmany`
- All functionality remains the same

## [0.1.0] - 2025-01-20

### 🎉 Initial Release

#### Added
- **Smart Status Bar Integration**
  - Configurable display modes: `lines`, `files`, `quality`, `auto`, and `smart`
  - Intelligent number formatting: abbreviated (`1.2K`), full (`1,234`), or compact (`12K`)
  - Quality color-coding with VS Code theme integration
  - One-click access to quick actions menu

- **Interactive Webview Reports**
  - Modern, responsive design with VS Code theme support
  - Quality metrics with animated progress bars
  - Language breakdown with file and line statistics
  - Development time estimates
  - Export functionality (JSON, HTML, CSV)

- **Command Palette Integration**
  - `HowMany: Analyze Workspace` - Full workspace analysis
  - `HowMany: Analyze Current File` - Single file analysis
  - `HowMany: Show Report` - Interactive report viewer
  - `HowMany: Export Report` - Multi-format export
  - `HowMany: Refresh Analysis` - Re-run analysis
  - `HowMany: Open Settings` - Quick settings access

- **Context-Aware Quick Actions**
  - Intelligent menu that shows only relevant actions
  - Grouped actions by category (Analysis, Results, Suggestions, Config)
  - Smart suggestions based on quality metrics
  - Time-aware refresh notifications

- **Tree View Explorer Integration**
  - Dedicated HowMany panel in Explorer view
  - Hierarchical display of analysis results
  - Auto-refresh on analysis completion
  - Loading states and error handling

- **Comprehensive Configuration System**
  - Status bar customization options
  - Analysis behavior settings
  - Quality threshold configuration
  - Notification preferences
  - Webview display options

- **Keyboard Shortcuts**
  - `Ctrl+Shift+H Ctrl+W` - Analyze Workspace
  - `Ctrl+Shift+H Ctrl+F` - Analyze Current File
  - `Ctrl+Shift+H Ctrl+R` - Show Report

- **Context Menu Integration**
  - Right-click folder → "Analyze Workspace"
  - Right-click file → "Analyze Current File"

#### Technical Features
- **Full TypeScript Implementation**
  - Strict type safety with interfaces matching Rust structs
  - Comprehensive error handling and validation
  - Modern async/await patterns

- **HowMany Core Integration**
  - Direct binary execution with JSON output parsing
  - Support for HowMany CLI v0.3.1+
  - Automatic feature detection and compatibility

- **Performance Optimizations**
  - Result caching for quick access
  - Efficient JSON parsing and validation
  - Memory-conscious resource management

- **Accessibility & UX**
  - Full ARIA support for screen readers
  - Semantic HTML structure
  - Keyboard navigation support
  - Responsive design for all screen sizes

- **Professional UI/UX**
  - Clean, modern interface following VS Code design patterns
  - Smooth animations and transitions
  - Quality-based color coding
  - Progressive disclosure of information

### 📋 Requirements
- VS Code 1.85.0 or higher
- HowMany CLI installed and accessible in PATH
- Node.js 18+ (for development)

### 🔗 Integration
- **Main Repository**: [HowMany Core](https://github.com/GriffinCanCode/howmany)
- **GitHub Action**: [HowMany Actions](https://github.com/GriffinCanCode/howmany-actions)
- **Homebrew**: [Homebrew Formula](https://github.com/GriffinCanCode/homebrew-howmany)

---

## [Unreleased]

### Planned Features
- **Enhanced Tree View**
  - File-level analysis details
  - Quality indicators per file
  - Quick actions on individual files

- **Inline Decorations**
  - Code complexity indicators
  - Quality warnings in editor
  - Hover information for metrics

- **Real-time Analysis**
  - Analysis on file save
  - Incremental updates
  - Performance optimizations

- **Advanced Reporting**
  - Historical trend analysis
  - Comparison reports
  - Custom report templates

- **Team Features**
  - Shared quality thresholds
  - Team dashboard integration
  - Collaborative quality goals

### Known Issues
- Analysis performance may be slower on very large projects (>10,000 files)
- Some advanced metrics require latest HowMany CLI version
- Windows path handling edge cases in certain configurations

### Feedback Welcome
We're actively seeking feedback on:
- User experience and workflow integration
- Performance with different project sizes
- Additional configuration options needed
- Integration with other VS Code extensions

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and contribution guidelines.

## Support

- **Issues**: [GitHub Issues](https://github.com/GriffinCanCode/howmany-vscode/issues)
- **Discussions**: [GitHub Discussions](https://github.com/GriffinCanCode/howmany-vscode/discussions)
- **Email**: griffin@griffin-code.com 