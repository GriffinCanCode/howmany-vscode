# HowMany VS Code Extension Test Project

This test project contains sample files to demonstrate the HowMany VS Code extension functionality.

## Test Files

- **`sample.py`** - Python file with classes, functions, documentation, and various complexity patterns
- **`sample.js`** - JavaScript file with async functions, classes, and modern ES6+ patterns
- **`README.md`** - This documentation file

## Testing the Extension

### 1. Install the Extension

If you have the VSIX package:
```bash
code --install-extension howmany-vscode-0.1.0.vsix
```

Or install from the VS Code marketplace when published.

### 2. Test the Status Bar

1. Open this project folder in VS Code
2. Look at the bottom-right status bar
3. You should see "HowMany" with intelligent display
4. Click the status bar item to see quick actions

### 3. Test Analysis Features

#### Analyze Workspace
- Click status bar → "Analyze Workspace"
- Or use Command Palette: `Ctrl+Shift+P` → "HowMany: Analyze Workspace"
- Or use keyboard shortcut: `Ctrl+Shift+H Ctrl+W`

#### Analyze Current File
- Open `sample.py` or `sample.js`
- Click status bar → "Analyze Current File" 
- Or use Command Palette: `Ctrl+Shift+P` → "HowMany: Analyze Current File"
- Or use keyboard shortcut: `Ctrl+Shift+H Ctrl+F`

#### View Report
- After analysis, click status bar → "Show Report"
- Or use Command Palette: `Ctrl+Shift+P` → "HowMany: Show Report"
- Or use keyboard shortcut: `Ctrl+Shift+H Ctrl+R`

### 4. Test Configuration

Open VS Code Settings (`Ctrl+,`) and search for "howmany":

#### Status Bar Settings
- **Display Mode**: Try different modes (lines, files, quality, auto, smart)
- **Format**: Test number formatting (abbreviated, full, compact)
- **Quality Colors**: Toggle quality-based color coding
- **Click Action**: Change what happens when you click the status bar

#### Webview Settings
- **Theme**: Switch between auto, minimal, detailed
- **Animations**: Enable/disable smooth transitions
- **Auto Refresh**: Auto-refresh reports when analysis completes

#### Analysis Settings
- **Smart Suggestions**: Enable intelligent suggestions based on results
- **Quality Thresholds**: Adjust thresholds for quality warnings

### 5. Test Export Features

1. Run an analysis
2. Open the report webview
3. Click export buttons (JSON, HTML, CSV)
4. Choose a location to save the exported report

## Expected Results

### Status Bar Display Examples

With different configurations, you should see:
- **Lines mode**: "HowMany: 150 lines"
- **Files mode**: "HowMany: 3 files"  
- **Quality mode**: "HowMany: 85% quality"
- **Auto mode**: Intelligent switching based on project size
- **Smart mode**: Quality warnings like "HowMany: ⚠️ 45% quality"

### Number Formatting Examples

- **Abbreviated**: "1.2K lines", "1.5M lines"
- **Full**: "1,234 lines", "1,500,000 lines"
- **Compact**: "12K lines", "1M lines"

### Quality Color Coding

Status bar text should change color based on quality scores:
- **Green**: Excellent quality (85%+)
- **Blue**: Good quality (75%+)
- **Yellow**: Warning quality (60%+)
- **Red**: Poor quality (<60%)

## Troubleshooting

### Extension Not Loading
- Check that the HowMany binary is installed and in PATH
- Restart VS Code after installing the extension

### Analysis Failing
- Ensure the HowMany binary is accessible
- Check the VS Code Developer Console for error messages

### Webview Not Showing
- Try reloading the webview: `F1` → "Developer: Reload Webviews"
- Check browser console in webview developer tools

### Configuration Not Working
- Reload VS Code after changing settings
- Check that settings are in the correct format

## Features to Test

### ✅ Status Bar Features
- [ ] Intelligent number formatting (K, M suffixes)
- [ ] Smart display mode selection
- [ ] Quality-based color coding
- [ ] Configurable click actions
- [ ] Icon visibility toggle

### ✅ Quick Actions Menu
- [ ] Context-aware action grouping
- [ ] Smart suggestions for quality issues
- [ ] Time-aware refresh information
- [ ] Clean categorized interface

### ✅ Report Webview
- [ ] Modern, responsive design
- [ ] VS Code theme integration
- [ ] Smooth animations
- [ ] Accessibility features
- [ ] Export functionality

### ✅ Configuration System
- [ ] Comprehensive settings
- [ ] Live configuration updates
- [ ] Smart defaults
- [ ] Clear descriptions

---

**Note**: This extension requires the HowMany binary to be installed separately. The extension provides the VS Code integration and UI, while the actual analysis is performed by the HowMany core binary. 