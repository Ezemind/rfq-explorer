# RFQ Explorer Icons

## Required Icon Files

To complete the installer setup, you need to add the following icon files to this directory:

### Windows
- **icon.ico** (256x256 pixels, ICO format)
  - Used for the Windows installer and application

### macOS  
- **icon.icns** (ICNS format with multiple sizes)
  - Used for the macOS application bundle

### Linux
- **icon.png** (512x512 pixels, PNG format)
  - Used for the Linux AppImage

## Creating Icons

### From Existing Logo
If you have a company logo:
1. Resize to 512x512 pixels
2. Save as PNG (for Linux)
3. Convert to ICO (for Windows) using online tools
4. Convert to ICNS (for macOS) using online tools

### Online Tools
- **ICO Converter**: https://icoconvert.com/
- **ICNS Converter**: https://cloudconvert.com/png-to-icns
- **Image Resizer**: https://imageresizer.com/

### Design Tips
- Use simple, recognizable symbols
- Ensure clarity at small sizes (16x16, 32x32)
- Use contrasting colors
- Avoid fine details that won't be visible when small

## Temporary Icons
Until you add custom icons, the application will use default Electron icons.

## File Structure
```
assets/
├── icon.ico     # Windows (256x256)
├── icon.icns    # macOS (multiple sizes)
├── icon.png     # Linux (512x512)
└── README.md    # This file
```
