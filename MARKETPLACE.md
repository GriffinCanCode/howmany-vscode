# VS Code Marketplace Deployment Guide

This guide covers the complete process of publishing the HowMany VS Code Extension to the Visual Studio Code Marketplace.

## 📋 Prerequisites

### Required Accounts
1. **Microsoft Account** - For Azure DevOps access
2. **Azure DevOps Organization** - For publishing tokens
3. **GitHub Account** - For repository and automated publishing

### Required Tools
- **Node.js 18+** - For building the extension
- **Visual Studio Code Extension Manager (vsce)** - For packaging and publishing
- **Git** - For version control

### Installation
```bash
# Install vsce globally
npm install -g @vscode/vsce

# Verify installation
vsce --version
```

## 🔑 Publisher Setup

### 1. Create Azure DevOps Organization
1. Go to [Azure DevOps](https://dev.azure.com/)
2. Sign in with your Microsoft account
3. Create a new organization (e.g., "howmany-extensions")

### 2. Create Personal Access Token
1. In Azure DevOps, click on your profile → Personal Access Tokens
2. Create new token with these settings:
   - **Name**: `vscode-marketplace-howmany`
   - **Organization**: Your organization
   - **Expiration**: 1 year (or custom)
   - **Scopes**: `Marketplace (Manage)`

### 3. Create Publisher
```bash
# Create publisher (one-time setup)
vsce create-publisher howmany

# Or login with existing publisher
vsce login howmany
```

When prompted, enter your Personal Access Token.

## 📦 Pre-Publication Checklist

### Code Quality
- [ ] All TypeScript compiles without errors
- [ ] ESLint passes with no issues
- [ ] All tests pass
- [ ] Code is properly formatted

### Documentation
- [ ] README.md is comprehensive and up-to-date
- [ ] CHANGELOG.md includes all changes
- [ ] All configuration options are documented
- [ ] Screenshots are current and high-quality

### Package.json Verification
- [ ] Version number is correct
- [ ] Publisher name matches your Azure DevOps publisher
- [ ] Categories are appropriate
- [ ] Keywords are comprehensive
- [ ] Repository URLs are correct
- [ ] Icon and gallery banner are set

### Testing
- [ ] Extension works in latest VS Code version
- [ ] All commands function correctly
- [ ] Status bar displays properly
- [ ] Webview reports render correctly
- [ ] Export functionality works
- [ ] Configuration changes take effect

### Assets
- [ ] Icon files exist and are properly formatted
- [ ] Gallery banner is visually appealing
- [ ] Screenshots are high-quality and current

## 🚀 Publishing Process

### Manual Publishing

#### 1. Build and Test
```bash
# Clean previous builds
npm run clean

# Install dependencies
npm ci

# Run full test suite
npm test

# Lint code
npm run lint

# Compile TypeScript
npm run compile
```

#### 2. Package Extension
```bash
# Create .vsix package
npm run package

# Verify package contents
vsce ls
```

#### 3. Test Package Locally
```bash
# Install locally for testing
npm run install:local

# Or install manually
code --install-extension howmany-vscode-0.1.0.vsix
```

#### 4. Publish to Marketplace
```bash
# Publish release version
npm run publish

# Or publish pre-release
npm run publish:pre-release
```

### Automated Publishing (Recommended)

#### 1. Set Up GitHub Secrets
In your GitHub repository settings, add these secrets:
- `VSCE_PAT`: Your Azure DevOps Personal Access Token

#### 2. Create Release
```bash
# Tag the release
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0

# Create GitHub release
# Go to GitHub → Releases → Create a new release
# Use tag v0.1.0
# Add release notes from CHANGELOG.md
```

#### 3. Monitor Workflow
The GitHub Action will automatically:
1. Run tests and quality checks
2. Build the extension
3. Package the .vsix file
4. Publish to VS Code Marketplace
5. Upload artifacts

## 📊 Post-Publication

### Verification
1. **Marketplace Listing**: Visit [VS Code Marketplace](https://marketplace.visualstudio.com/vscode)
2. **Search**: Search for "HowMany" or "howmany-vscode"
3. **Installation**: Test installation via `code --install-extension howmany.howmany-vscode`
4. **Functionality**: Verify all features work correctly

### Monitoring
- **Download Statistics**: Monitor via Azure DevOps or VS Code Marketplace
- **User Feedback**: Watch for reviews and ratings
- **Issues**: Monitor GitHub issues for bug reports

## 🔄 Version Updates

### Patch Releases (0.1.0 → 0.1.1)
```bash
# Update version
npm version patch

# Update CHANGELOG.md
# Commit changes
git add .
git commit -m "Release v0.1.1"

# Tag and push
git push origin main
git push origin v0.1.1
```

### Minor Releases (0.1.0 → 0.2.0)
```bash
# Update version
npm version minor

# Update CHANGELOG.md with new features
# Commit and push as above
```

### Major Releases (0.1.0 → 1.0.0)
```bash
# Update version
npm version major

# Update CHANGELOG.md with breaking changes
# Commit and push as above
```

## 🛠️ Troubleshooting

### Common Issues

#### Authentication Errors
```bash
# Re-login to vsce
vsce logout
vsce login howmany
```

#### Package Validation Errors
```bash
# Check package contents
vsce ls

# Validate package
vsce package --no-dependencies
```

#### Publishing Failures
- Verify Personal Access Token is valid
- Check publisher name matches Azure DevOps
- Ensure version number is incremented
- Verify all required fields in package.json

#### Icon/Banner Issues
- Icons must be PNG format
- Recommended sizes: 128x128 for icon
- Gallery banner: 1200x630 recommended

### Getting Help
- **vsce CLI Help**: `vsce --help`
- **VS Code Publishing Docs**: [Official Documentation](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- **GitHub Issues**: Report issues in the repository

## 📈 Marketplace Optimization

### SEO Best Practices
- Use descriptive, searchable keywords
- Write clear, benefit-focused description
- Include relevant categories
- Add comprehensive README with screenshots

### User Experience
- Provide clear installation instructions
- Include configuration examples
- Add troubleshooting section
- Respond promptly to user feedback

### Marketing
- Announce releases on social media
- Write blog posts about features
- Engage with the VS Code community
- Consider creating demo videos

## 📋 Release Checklist Template

```markdown
## Release Checklist for v0.1.0

### Pre-Release
- [ ] Code review completed
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Version bumped in package.json
- [ ] CHANGELOG.md updated
- [ ] Screenshots updated if needed

### Testing
- [ ] Manual testing completed
- [ ] Extension host testing passed
- [ ] Configuration changes tested
- [ ] Export functionality verified

### Publishing
- [ ] Package created successfully
- [ ] Local installation test passed
- [ ] Published to marketplace
- [ ] Marketplace listing verified
- [ ] GitHub release created

### Post-Release
- [ ] Installation from marketplace tested
- [ ] Documentation links verified
- [ ] Community notifications sent
- [ ] Monitoring set up
```

---

## 🎉 Success!

Once published, your extension will be available to millions of VS Code users worldwide. Monitor feedback, iterate based on user needs, and continue improving the extension.

**Marketplace URL**: https://marketplace.visualstudio.com/items?itemName=howmany.howmany-vscode 