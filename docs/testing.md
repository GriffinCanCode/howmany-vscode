# HowMany VS Code Extension - Testing Guide

## 🚀 **Build & Installation**

### Prerequisites
- VS Code 1.85.0+
- Node.js 18+
- HowMany binary installed and in PATH

### Building the Extension

```bash
# Navigate to extension directory
cd howmany-vscode

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package the extension
npm run package
```

This creates `howmany-vscode-0.1.0.vsix` ready for installation.

### Installing for Testing

```bash
# Install the VSIX package
code --install-extension howmany-vscode-0.1.0.vsix

# Or drag and drop the .vsix file onto VS Code
```

## 🧪 **Testing Checklist**

### ✅ **Status Bar Functionality**

#### Basic Display
- [ ] Status bar shows "HowMany" when idle
- [ ] Shows spinning icon during analysis
- [ ] Displays results after analysis completion
- [ ] Shows error state when analysis fails

#### Number Formatting
- [ ] **Abbreviated** (default): `1.2K`, `1.2M`
- [ ] **Full**: `1,234`, `1,234,567`
- [ ] **Compact**: `12K`, `1M`

#### Display Modes
- [ ] **Lines**: Always shows line count
- [ ] **Files**: Always shows file count  
- [ ] **Quality**: Shows quality percentage (if available)
- [ ] **Auto**: Intelligent switching based on project size
- [ ] **Smart**: Shows quality warnings and issues

#### Visual Features
- [ ] Quality color coding (green/blue/yellow/red)
- [ ] Icon visibility toggle
- [ ] Configurable click actions

### ✅ **Quick Actions Menu**

#### Context Awareness
- [ ] Shows "Analyze Workspace" when no results
- [ ] Shows "Analyze Current File" when file is open
- [ ] Shows "Show Report" only when results available
- [ ] Shows "Export Report" only when results available
- [ ] Shows "Refresh Analysis" only when results available

#### Smart Categorization
- [ ] **Analysis** section: Analysis actions
- [ ] **Results** section: Report and export actions
- [ ] **Suggestions** section: Quality-based recommendations
- [ ] **Configuration** section: Settings access

#### Intelligent Suggestions
- [ ] Shows quality warning for scores < 60%
- [ ] Shows documentation suggestion for low doc coverage
- [ ] Time-aware refresh ("last analyzed 5m ago")

### ✅ **Report Webview**

#### Modern Design
- [ ] Clean card-based layout
- [ ] Responsive design (mobile-friendly)
- [ ] VS Code theme integration
- [ ] Smooth animations and transitions

#### Content Display
- [ ] **Overview Card**: Files, lines, code, comments, docs
- [ ] **Quality Card**: Overall score with progress bars
- [ ] **Languages Card**: Top languages by line count
- [ ] **Time Card**: Development time estimates

#### Interactive Features
- [ ] Export buttons (JSON, HTML, CSV)
- [ ] Refresh button
- [ ] Hover effects on metrics
- [ ] Loading states for actions

#### Accessibility
- [ ] Proper ARIA labels
- [ ] Semantic HTML structure
- [ ] Keyboard navigation
- [ ] Screen reader compatibility

### ✅ **Configuration System**

#### Status Bar Settings
```json
{
  "howmany.statusBar.display": "smart",
  "howmany.statusBar.format": "abbreviated", 
  "howmany.statusBar.showQualityColor": true,
  "howmany.statusBar.showIcon": true,
  "howmany.statusBar.clickAction": "quickActions"
}
```

#### Webview Settings
```json
{
  "howmany.webview.theme": "auto",
  "howmany.webview.animations": true,
  "howmany.webview.autoRefresh": false
}
```

#### Analysis Settings
```json
{
  "howmany.analysis.smartSuggestions": true,
  "howmany.analysis.qualityThresholds": {
    "overall": 70,
    "maintainability": 65,
    "documentation": 20,
    "complexity": 10
  }
}
```

#### Notification Settings
```json
{
  "howmany.notifications.showCompletion": true,
  "howmany.notifications.showErrors": true,
  "howmany.notifications.showQualityWarnings": true
}
```

### ✅ **Commands & Keyboard Shortcuts**

#### Available Commands
- [ ] `HowMany: Analyze Workspace` (`Ctrl+Shift+H Ctrl+W`)
- [ ] `HowMany: Analyze Current File` (`Ctrl+Shift+H Ctrl+F`)
- [ ] `HowMany: Show Analysis Report` (`Ctrl+Shift+H Ctrl+R`)
- [ ] `HowMany: Export Report`
- [ ] `HowMany: Refresh Analysis`
- [ ] `HowMany: Open Settings`

#### Context Menu Integration
- [ ] Right-click folder → "Analyze Workspace"
- [ ] Right-click file → "Analyze Current File"

### ✅ **Error Handling**

#### Graceful Failures
- [ ] Missing HowMany binary → Clear error message
- [ ] Analysis timeout → Proper error state
- [ ] Invalid file permissions → Graceful degradation
- [ ] Network issues → Retry mechanisms

#### User Feedback
- [ ] Progress indicators during analysis
- [ ] Success notifications (configurable)
- [ ] Error notifications with actionable advice
- [ ] Loading states in all UI components

## 🎯 **Test Scenarios**

### Scenario 1: First-Time User
1. Install extension
2. Open a project folder
3. Click status bar item
4. Should see "Analyze Workspace" prominently
5. Run analysis and verify results display

### Scenario 2: Power User Workflow
1. Set status bar to "smart" mode
2. Enable quality warnings
3. Analyze a low-quality project
4. Verify quality warnings appear in status bar
5. Use quick actions to access suggestions

### Scenario 3: Configuration Changes
1. Change status bar format to "compact"
2. Verify numbers display as "12K" instead of "1.2K"
3. Toggle icon visibility
4. Verify icon appears/disappears immediately

### Scenario 4: Large Project Analysis
1. Open large project (1000+ files)
2. Verify status bar switches to file count automatically
3. Check that analysis completes successfully
4. Verify performance is acceptable

### Scenario 5: Multi-Language Project
1. Analyze project with multiple languages
2. Verify languages card shows proper breakdown
3. Check that all supported languages are detected
4. Verify proper file extension handling

## 🐛 **Known Limitations**

### Current Limitations
- Requires separate HowMany binary installation
- Analysis performance depends on project size
- Some advanced metrics require HowMany core features

### Future Enhancements
- Tree view integration
- Inline code decorations
- Real-time analysis on file changes
- Integration with VS Code testing framework

## 📊 **Performance Benchmarks**

### Expected Performance
- **Small projects** (<100 files): < 1 second
- **Medium projects** (100-1000 files): < 5 seconds  
- **Large projects** (1000+ files): < 30 seconds

### Memory Usage
- Extension baseline: ~5MB
- With analysis results: ~10MB
- Webview active: ~15MB

## ✅ **Verification Checklist**

Before releasing:
- [ ] All TypeScript compiles without errors
- [ ] Extension packages successfully
- [ ] All configuration options work
- [ ] Status bar displays correctly in all modes
- [ ] Quick actions menu is context-aware
- [ ] Report webview renders properly
- [ ] Export functionality works
- [ ] Keyboard shortcuts are functional
- [ ] Error handling is graceful
- [ ] Performance is acceptable
- [ ] Accessibility features work
- [ ] Documentation is complete

---

## 🎉 **Success Criteria**

The extension is ready when:
1. ✅ **Clean & Modern UI**: Beautiful, VS Code-integrated interface
2. ✅ **Intelligent UX**: Context-aware actions and smart defaults  
3. ✅ **Proper SoC**: Clean separation between CSS, HTML, and TypeScript
4. ✅ **Type Safety**: Full TypeScript coverage with proper interfaces
5. ✅ **Accessibility**: WCAG-compliant with proper ARIA support
6. ✅ **Performance**: Fast, responsive, and memory-efficient
7. ✅ **Configuration**: Comprehensive, user-friendly settings
8. ✅ **Error Handling**: Graceful failures with helpful messages

**The HowMany VS Code extension now provides a professional, modern, and intelligent code analysis experience! 🚀** 