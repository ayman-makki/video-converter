# Video Converter

Un convertisseur vidéo multi-plateforme puissant avec interface française, accélération GPU et optimisation intelligente.

![Video Converter](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Electron](https://img.shields.io/badge/Electron-27.x-9feaf9)
![React](https://img.shields.io/badge/React-18.x-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6)

## ✨ Features

- **Interface Française Complète**: Interface utilisateur entièrement localisée en français
- **Support Multi-Formats**: Formats d'entrée MP4, AVI, MKV, MOV, WMV, FLV, WebM, et plus
- **Sortie Haute Qualité**: Conversion vers MP3, MP4, WAV, ou AAC avec qualité personnalisable
- **Traitement par Lots**: Conversion simultanée de multiples fichiers avec gestion intelligente
- **Accélération GPU**: Détection automatique et optimisation matérielle (NVIDIA, AMD, Intel)
- **Multi-Plateforme**: Versions natives pour Windows, macOS, et Linux
- **Progression Temps Réel**: Suivi en direct avec vitesse et temps estimé
- **Interface Glisser-Déposer**: Gestion intuitive des fichiers
- **Optimisation Performance**: Traitement multi-thread utilisant les cœurs CPU disponibles
- **Détection Matérielle Intelligente**: Détection et optimisation automatique du système

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tomp3
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

### Building for Production

Build for current platform:
```bash
npm run build
npm run package
```

Build for specific platforms:
```bash
# Windows
npm run package:win

# macOS
npm run package:mac

# Linux
npm run package:linux
```

## 🖥️ System Requirements

### Minimum Requirements
- **Windows**: Windows 10 (64-bit)
- **macOS**: macOS 10.15 (Catalina) or later
- **Linux**: Ubuntu 18.04 LTS or equivalent
- **RAM**: 4 GB
- **Storage**: 1 GB free space

### Recommended Requirements
- **RAM**: 8 GB or more
- **CPU**: Multi-core processor (4+ cores recommended)
- **GPU**: Dedicated graphics card for hardware acceleration
- **Storage**: SSD for faster file operations

## 🎯 Usage

1. **Launch the application**
2. **Add files**: Drag and drop video files or click "Browse Files"
3. **Configure settings**: Choose output format and quality
4. **Start conversion**: Click "Start Conversion" to begin processing
5. **Monitor progress**: Track conversion progress and system usage
6. **Access results**: Converted files are saved to your chosen output directory

### Supported Input Formats

**Video**: MP4, AVI, MKV, MOV, WMV, FLV, WebM, M4V, 3GP, TS, MTS, M2TS
**Audio**: MP3, WAV, FLAC, AAC, OGG, M4A, WMA

### Output Formats

- **MP3**: High-quality audio with customizable bitrates
- **MP4**: H.264/H.265 video with AAC audio
- **WAV**: Uncompressed audio
- **AAC**: Advanced audio codec

## ⚙️ Configuration

### Performance Settings

- **Concurrent Jobs**: Number of simultaneous conversions (1-8)
- **GPU Acceleration**: Enable hardware-accelerated encoding
- **Auto-detect Hardware**: Automatic system optimization

### Quality Settings

- **Low**: Faster conversion, smaller file size
- **Medium**: Balanced quality and size
- **High**: Better quality, larger file size
- **Ultra**: Maximum quality, largest file size

## 🔧 Advanced Features

### Hardware Acceleration

The application automatically detects and utilizes:
- **NVIDIA GPUs**: NVENC encoder
- **AMD GPUs**: AMF encoder  
- **Intel GPUs**: Quick Sync encoder
- **CPU Fallback**: Software encoding when GPU unavailable

### Intelligent Optimization

- **Dynamic thread allocation** based on CPU cores
- **Memory management** for large file processing
- **Automatic quality selection** based on input characteristics
- **Efficient queue management** with priority handling

## 📁 Project Structure

```
tomp3/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── main.ts          # Application entry point
│   │   ├── preload.ts       # IPC bridge
│   │   └── services/        # Core services
│   │       ├── FFmpegService.ts
│   │       ├── HardwareService.ts
│   │       └── ConversionService.ts
│   └── renderer/            # React frontend
│       ├── App.tsx          # Main application component
│       ├── components/      # UI components
│       ├── store/           # State management
│       ├── types/           # TypeScript definitions
│       └── utils/           # Utility functions
├── resources/               # Static resources
├── scripts/                 # Build scripts
└── dist/                    # Build output
```

## 🛠️ Development

### Tech Stack

- **Framework**: Electron 27.x
- **Frontend**: React 18.x with TypeScript
- **UI Library**: Ant Design
- **State Management**: Zustand
- **Build System**: Webpack
- **Video Processing**: FFmpeg

### Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run dev:main         # Build main process in watch mode
npm run dev:renderer     # Start renderer development server

# Building
npm run build            # Build for production
npm run build:main       # Build main process
npm run build:renderer   # Build renderer

# Packaging
npm run package          # Package for current platform
npm run package:win      # Package for Windows
npm run package:mac      # Package for macOS
npm run package:linux    # Package for Linux
```

### Adding New Features

1. Create feature branch
2. Implement changes in appropriate service/component
3. Add TypeScript types if needed
4. Update UI components
5. Test across platforms
6. Submit pull request

## 🐛 Troubleshooting

### Common Issues

**FFmpeg not found**
- Ensure FFmpeg binaries are downloaded during `npm install`
- Check `resources/ffmpeg/` directory for platform-specific binaries

**Conversion fails**
- Verify input file is not corrupted
- Check available disk space
- Ensure file permissions allow read/write access

**Performance issues**
- Reduce concurrent jobs in settings
- Disable GPU acceleration if causing problems
- Close other resource-intensive applications

**UI not loading**
- Clear application cache
- Restart the application
- Check console for JavaScript errors

### Debug Mode

Enable debug output by setting environment variable:
```bash
DEBUG=* npm run dev
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Documentation**: See [docs](docs/) folder
- **Community**: [Discussions](https://github.com/your-repo/discussions)

## 🙏 Acknowledgments

- [FFmpeg](https://ffmpeg.org/) - Video processing engine
- [Electron](https://electronjs.org/) - Cross-platform desktop framework
- [React](https://reactjs.org/) - UI library
- [Ant Design](https://ant.design/) - UI component library

---

**Built with ❤️ for the community**