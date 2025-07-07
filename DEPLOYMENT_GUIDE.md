# RFQ Explorer - Deployment & Release Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Git configured with your GitHub account
- GitHub repository created for the project

### Initial Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install electron-updater:**
   ```bash
   npm install electron-updater --save
   ```

3. **Create application icons:**
   - Place your icons in the `assets/` folder:
     - `icon.ico` (Windows, 256x256)
     - `icon.icns` (macOS)
     - `icon.png` (Linux, 512x512)

## 📦 Building the Application

### Development Build
```bash
npm run electron-dev
```

### Production Build (Local)
```bash
npm run dist
```

### Build for All Platforms
```bash
npm run dist-publish
```

## 🔄 Auto-Updates Setup

### 1. GitHub Repository Setup

1. Create a new repository on GitHub
2. Update the `publish` configuration in `package.json`:
   ```json
   "publish": {
     "provider": "github",
     "owner": "your-github-username",
     "repo": "rfq-explorer"
   }
   ```

### 2. GitHub Token Configuration

1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Generate a new token with `repo` permissions
3. Add the token as a repository secret named `GITHUB_TOKEN`

### 3. Release Process

#### Automatic Release (Recommended)
1. Update version in `package.json`
2. Commit your changes
3. Create and push a new tag:
   ```bash
   git tag v1.0.3
   git push origin v1.0.3
   ```
4. GitHub Actions will automatically build and create a release

#### Manual Release
1. Build locally: `npm run dist-publish`
2. Upload files to GitHub releases manually

## 📋 Version Management

### Current Version: 1.0.3

### Updating Version
1. Update `package.json` version field
2. Commit changes
3. Create new git tag
4. Push tag to trigger release

### Version Format
Use semantic versioning: `MAJOR.MINOR.PATCH`
- MAJOR: Breaking changes
- MINOR: New features
- PATCH: Bug fixes

## 🛠️ Configuration Files

### package.json - Build Configuration
```json
{
  "build": {
    "appId": "com.rfqexplorer.app",
    "productName": "RFQ Explorer",
    "win": {
      "target": "nsis",
      "publish": ["github"]
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true
    }
  }
}
```

### GitHub Actions Workflow
Location: `.github/workflows/build-release.yml`
- Automatically builds for Windows, macOS, and Linux
- Publishes releases to GitHub
- Triggered by version tags

## 🔧 Troubleshooting

### Common Issues

1. **Icon not showing:**
   - Ensure icons are in correct format and size
   - Check file paths in package.json

2. **Auto-updater not working:**
   - Verify GitHub token permissions
   - Check repository publish configuration
   - Ensure app is code-signed (for macOS)

3. **Build failures:**
   - Clear node_modules and reinstall
   - Check electron-builder logs
   - Verify all dependencies are installed

### Debug Commands

```bash
# Clear build cache
rm -rf dist build node_modules
npm install

# Build with verbose output
npm run dist -- --publish=never --verbose

# Test auto-updater locally
npm run electron-dev
```

## 📁 Project Structure

```
rfq-explorer/
├── assets/                  # Application icons
├── build/                   # React build output
├── dist/                    # Electron distributables
├── public/
│   ├── electron.js         # Main Electron process
│   └── preload.js          # Secure IPC bridge
├── src/
│   ├── components/
│   │   └── UpdateNotification.js  # Auto-update UI
│   └── ...
├── .github/
│   └── workflows/
│       └── build-release.yml      # CI/CD pipeline
└── package.json            # Build & publish config
```

## 🔐 Security Considerations

1. **Code Signing:**
   - Windows: Requires certificate for trusted installs
   - macOS: Requires Apple Developer ID
   - Consider GitHub Codespaces for signing

2. **Auto-Updates:**
   - Only works with HTTPS
   - Requires valid signatures
   - Test thoroughly before release

## 📊 Release Checklist

- [ ] Version number updated in package.json
- [ ] Changelog updated
- [ ] All tests passing
- [ ] Icons properly configured
- [ ] GitHub repository configured
- [ ] Auto-updater tested
- [ ] Build pipeline working
- [ ] Tag created and pushed
- [ ] Release notes prepared

## 🎯 Next Steps

1. **Setup GitHub repository**
2. **Configure GitHub secrets**
3. **Create application icons**
4. **Test auto-update functionality**
5. **Create first release**

## 📞 Support

For issues with deployment or releases:
1. Check GitHub Actions logs
2. Review electron-builder documentation
3. Test locally before pushing tags
4. Monitor auto-updater logs in production
