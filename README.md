# RFQ Explorer v1.0.3

![RFQ Explorer](https://img.shields.io/badge/version-1.0.3-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

> Professional CRM solution for managing quotes and customer communications

## 🚀 Features

- **Customer Management**: Comprehensive customer database with communication history
- **Quote Management**: Create, track, and manage RFQs (Request for Quotes)
- **WhatsApp Integration**: Direct messaging and media sharing
- **Email System**: Automated follow-ups and campaign management
- **Real-time Notifications**: Stay updated with customer interactions
- **Media Support**: Handle images, audio, and documents seamlessly
- **Auto-Updates**: Automatic application updates via GitHub releases
- **Cross-Platform**: Available for Windows, macOS, and Linux

## 📋 System Requirements

### Minimum Requirements
- **OS**: Windows 10+, macOS 10.14+, or Ubuntu 18.04+
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 500MB free space
- **Network**: Internet connection required

### Development Requirements
- Node.js 18+
- npm or yarn
- Git

## 🔧 Installation

### For End Users

1. **Download the latest installer:**
   - Visit the [Releases page](https://github.com/yourusername/rfq-explorer/releases)
   - Download the appropriate installer for your platform:
     - Windows: `RFQ-Explorer-Setup-1.0.3.exe`
     - macOS: `RFQ-Explorer-1.0.3.dmg`
     - Linux: `RFQ-Explorer-1.0.3.AppImage`

2. **Install the application:**
   - Windows: Run the .exe installer
   - macOS: Open the .dmg and drag to Applications
   - Linux: Make the .AppImage executable and run

3. **First Launch:**
   - The application will check for updates automatically
   - Login with your credentials
   - Start managing your RFQs!

### For Developers

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/rfq-explorer.git
   cd rfq-explorer
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run electron-dev
   ```

4. **Build for production:**
   ```bash
   npm run dist
   ```

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18, Tailwind CSS, Framer Motion
- **Backend**: Electron, Node.js
- **Database**: PostgreSQL
- **APIs**: WhatsApp Business API, Google Drive API
- **Updates**: electron-updater, GitHub Releases

### Project Structure
```
rfq-explorer/
├── public/
│   ├── electron.js         # Main Electron process
│   └── preload.js          # IPC bridge
├── src/
│   ├── components/         # Reusable UI components
│   ├── features/           # Feature-specific modules
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API services
│   └── utils/              # Utility functions
├── assets/                 # Application icons
├── .github/workflows/      # CI/CD pipeline
└── dist/                   # Build output
```

## 🔄 Auto-Updates

RFQ Explorer includes automatic update functionality:

- **Automatic Checking**: Checks for updates on startup
- **Background Downloads**: Updates download in the background
- **User Control**: Users choose when to install updates
- **Rollback Safety**: Previous version backup maintained

### Update Process
1. Application checks GitHub releases for new versions
2. If update available, downloads in background
3. User receives notification when download complete
4. User can restart to install or continue working
5. Installation happens on next restart

## 📁 Configuration

### Database Connection
Configure your PostgreSQL connection in the main process:
```javascript
const dbConfig = {
  user: 'your_user',
  host: 'your_host',
  database: 'your_database',
  password: 'your_password',
  port: 5432,
  ssl: { rejectUnauthorized: false }
};
```

### WhatsApp API
Set up your WhatsApp Business API credentials:
- Business phone number ID
- Access token
- Webhook verification token

### Email Configuration
Configure SMTP settings for email functionality:
- SMTP server details
- Authentication credentials
- Default sender information

## 🚀 Deployment

### Quick Build (Local)
```bash
# Run the quick installer script
./build-installer.bat    # Windows
./build-installer.sh     # macOS/Linux
```

### Automated Deployment (GitHub Actions)

1. **Setup Repository:**
   ```bash
   git remote add origin https://github.com/yourusername/rfq-explorer.git
   git push -u origin main
   ```

2. **Configure Secrets:**
   - Add `GITHUB_TOKEN` to repository secrets
   - Configure any signing certificates

3. **Create Release:**
   ```bash
   # Update version in package.json
   git add .
   git commit -m "Release v1.0.3"
   git tag v1.0.3
   git push origin v1.0.3
   ```

4. **Automatic Build:**
   - GitHub Actions builds for all platforms
   - Creates release with installers
   - Publishes to GitHub Releases

## 🔐 Security

### Code Signing
- **Windows**: Requires Authenticode certificate
- **macOS**: Requires Apple Developer ID
- **Linux**: Optional GPG signing

### Data Protection
- Database connections use SSL
- API tokens encrypted at rest
- No sensitive data in logs
- Secure IPC communication

## 🧪 Testing

### Manual Testing
```bash
# Start development environment
npm run electron-dev

# Build and test installer
npm run dist

# Test auto-updater (requires release)
npm start
```

### Test Checklist
- [ ] Application starts correctly
- [ ] Database connection works
- [ ] WhatsApp messaging functions
- [ ] Email system operational
- [ ] File uploads/downloads work
- [ ] Auto-updater notifications appear
- [ ] Cross-platform compatibility

## 📝 Changelog

### v1.0.3 (Current)
- Renamed from "Bob Explorer" to "RFQ Explorer"
- Added auto-update functionality
- Improved installer configuration
- Enhanced cross-platform support
- Updated documentation

### v1.0.2
- Email system improvements
- Better media handling
- UI/UX enhancements

### v1.0.1
- Initial stable release
- Core CRM functionality
- WhatsApp integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Use conventional commit messages
- Follow ESLint configuration
- Add tests for new features
- Update documentation
- Test on multiple platforms

## 📞 Support

### Getting Help
- **Documentation**: See `DEPLOYMENT_GUIDE.md`
- **Issues**: Create GitHub issue with bug report
- **Features**: Request features via GitHub discussions

### Common Issues
- **Installation Problems**: Check system requirements
- **Database Errors**: Verify connection settings
- **Update Failures**: Check internet connection and permissions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Electron team for the amazing framework
- React community for excellent libraries
- GitHub for free CI/CD and releases
- Contributors and testers

---

**RFQ Explorer** - Streamlining customer relationship management, one quote at a time.
