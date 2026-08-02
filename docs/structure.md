# HowMany VS Code Extension - Project Structure

## 📁 **Complete Directory Structure**

```
howmany-vscode/
├── 📄 Core Configuration
│   ├── package.json              # Extension manifest & dependencies
│   ├── tsconfig.json             # TypeScript configuration
│   ├── eslint.config.js         # Code quality rules
│   └── .vscodeignore            # Files to exclude from packaging
│
├── 📦 Source Code
│   └── src/
│       ├── extension.ts          # Main extension entry point
│       ├── types/
│       │   └── HowManyTypes.ts   # TypeScript interfaces
│       ├── services/
│       │   └── HowManyService.ts # Binary execution & analysis
│       ├── ui/
│       │   └── StatusBarManager.ts # Status bar integration
│       └── panels/
│           └── HowManyReportPanel.ts # Webview reports
│
├── 🏗️ Build Output
│   └── dist/                     # Compiled JavaScript (generated)
│
├── 📚 Documentation
│   ├── README.md                 # Main documentation
│   └── docs/structure.md        # This file
│
└── 🔧 Development
    └── node_modules/            # Dependencies (generated)
```

## 🎯 **Key Design Decisions**

### **1. Clean Architecture**
- **Separation of Concerns**: Each component has a single responsibility
- **Type Safety**: Full TypeScript with interfaces matching Rust structs
- **Modular Design**: Easy to extend and maintain

### **2. VS Code Integration**
- **Native UI**: Uses VS Code's built-in components and themes
- **Command Registration**: Follows VS Code extension patterns
- **Configuration**: Leverages VS Code settings system

### **3. HowMany Core Integration**
- **Binary Interface**: Spawns and communicates with Rust binary
- **JSON Protocol**: Structured data exchange
- **Error Handling**: Graceful failures and user feedback

## 🚀 **Extension Points**

### **Easy to Extend**
1. **New Commands**: Add to `extension.ts` and `package.json`
2. **UI Components**: Create new classes in `ui/` directory
3. **Report Formats**: Extend `HowManyService` export methods
4. **Configuration**: Add settings to `package.json` schema

### **Future Enhancements**
- **Tree View**: File explorer integration
- **Decorators**: Inline code metrics
- **Codelens**: Quick analysis actions
- **Notifications**: Smart alerts for quality issues

## 🔗 **Integration Pattern**

```typescript
// How the extension interfaces with HowMany core:

1. User Action → Command → HowManyService
2. HowManyService → Spawn Binary → Parse JSON
3. Results → StatusBar + WebView + Cache
4. User Feedback → Notifications + UI Updates
```

## 📊 **Data Flow**

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   User      │ -> │  Extension   │ -> │  HowMany    │
│  Actions    │    │   Commands   │    │   Binary    │
└─────────────┘    └──────────────┘    └─────────────┘
                           │                    │
                           v                    v
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Status    │ <- │    Cache     │ <- │    JSON     │
│    Bar      │    │   Results    │    │   Output    │
└─────────────┘    └──────────────┘    └─────────────┘
                           │
                           v
                   ┌──────────────┐
                   │   WebView    │
                   │   Reports    │
                   └──────────────┘
```

## 🛠️ **Development Workflow**

1. **Setup**: `npm install`
2. **Development**: `npm run watch` + `F5` in VS Code
3. **Testing**: Extension Development Host opens
4. **Building**: `npm run compile`
5. **Packaging**: `npm run package` → Creates `.vsix`
6. **Publishing**: `npm run deploy` → VS Code Marketplace

---

This structure follows VS Code extension best practices and provides a solid foundation for the HowMany integration! 🎉 