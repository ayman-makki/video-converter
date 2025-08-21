import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron';
import { join } from 'path';
import { pathExists } from 'path-exists';
import Store from 'electron-store';
import { ConversionService } from './services/ConversionService';
import { HardwareService } from './services/HardwareService';
import { FFmpegService } from './services/FFmpegService';

// Enable live reload for development
if (process.env.NODE_ENV === 'development') {
  try {
    require('electron-reload')(__dirname, {
      electron: join(__dirname, '..', '..', 'node_modules', '.bin', 'electron'),
      hardResetMethod: 'exit'
    });
  } catch (error) {
    console.log('Electron reload not available:', error);
  }
}

class VideoConverterApp {
  private mainWindow: BrowserWindow | null = null;
  private store: Store;
  private conversionService: ConversionService;
  private hardwareService: HardwareService;
  private ffmpegService: FFmpegService;

  constructor() {
    this.store = new Store<any>({
      defaults: {
        windowBounds: { width: 1200, height: 800 },
        outputDirectory: app.getPath('downloads'),
        concurrentJobs: 2,
        gpuAcceleration: true,
        autoDetectHardware: true
      }
    });

    this.ffmpegService = new FFmpegService();
    this.hardwareService = new HardwareService();
    this.conversionService = new ConversionService(this.ffmpegService, this.hardwareService);

    this.initializeApp();
  }

  private initializeApp(): void {
    // Handle app events
    app.whenReady().then(() => this.createMainWindow());
    app.on('window-all-closed', this.onWindowAllClosed);
    app.on('activate', this.onActivate);

    // Setup IPC handlers
    this.setupIPCHandlers();
  }

  private createMainWindow(): void {
    const bounds = this.store.get('windowBounds') as any;
    
    this.mainWindow = new BrowserWindow({
      width: bounds.width,
      height: bounds.height,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, 'preload.js'),
        webSecurity: true
      },
      titleBarStyle: 'default',
      icon: this.getIconPath(),
      show: false // Don't show until ready
    });

    // Load the renderer
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.loadURL('http://localhost:3001');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(join(__dirname, 'renderer', 'index.html'));
    }

    // Show when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
      this.initializeServices();
    });

    // Save window bounds on close
    this.mainWindow.on('close', () => {
      if (this.mainWindow) {
        this.store.set('windowBounds', this.mainWindow.getBounds());
      }
    });

    // Create menu
    this.createMenu();
  }

  private getIconPath(): string {
    const platform = process.platform;
    const iconName = platform === 'win32' ? 'icon.ico' : 
                    platform === 'darwin' ? 'icon.icns' : 
                    'icon.png';
    return join(__dirname, '..', '..', 'resources', 'icons', iconName);
  }

  private createMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'Fichier',
        submenu: [
          {
            label: 'Ajouter des Fichiers',
            accelerator: 'CmdOrCtrl+O',
            click: () => this.handleAddFiles()
          },
          {
            label: 'Vider la File',
            accelerator: 'CmdOrCtrl+Shift+C',
            click: () => this.mainWindow?.webContents.send('clear-queue')
          },
          { type: 'separator' },
          {
            label: 'Quitter',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => app.quit()
          }
        ]
      },
      {
        label: 'Conversion',
        submenu: [
          {
            label: 'Démarrer la Conversion',
            accelerator: 'CmdOrCtrl+Enter',
            click: () => this.mainWindow?.webContents.send('start-conversion')
          },
          {
            label: 'Suspendre Tout',
            accelerator: 'CmdOrCtrl+P',
            click: () => this.mainWindow?.webContents.send('pause-conversion')
          },
          {
            label: 'Annuler Tout',
            accelerator: 'CmdOrCtrl+Shift+X',
            click: () => this.mainWindow?.webContents.send('cancel-conversion')
          }
        ]
      },
      {
        label: 'Affichage',
        submenu: [
          { role: 'reload', label: 'Actualiser' },
          { role: 'forceReload', label: 'Forcer l\'Actualisation' },
          { role: 'toggleDevTools', label: 'Basculer les Outils de Développement' },
          { type: 'separator' },
          { role: 'resetZoom', label: 'Réinitialiser le Zoom' },
          { role: 'zoomIn', label: 'Zoom Avant' },
          { role: 'zoomOut', label: 'Zoom Arrière' },
          { type: 'separator' },
          { role: 'togglefullscreen', label: 'Basculer le Plein Écran' }
        ]
      },
      {
        label: 'Aide',
        submenu: [
          {
            label: 'À Propos du Convertisseur Vidéo',
            click: () => this.showAboutDialog()
          },
          {
            label: 'Formats Supportés',
            click: () => this.showSupportedFormats()
          },
          {
            label: 'Signaler un Problème',
            click: () => shell.openExternal('https://github.com/your-repo/issues')
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private async initializeServices(): Promise<void> {
    try {
      await this.ffmpegService.initialize();
      await this.hardwareService.detectHardware();
      
      this.mainWindow?.webContents.send('services-ready', {
        ffmpegAvailable: this.ffmpegService.isAvailable(),
        hardwareInfo: await this.hardwareService.getHardwareInfo()
      });
    } catch (error) {
      console.error('Failed to initialize services:', error);
      this.mainWindow?.webContents.send('services-error', error);
    }
  }

  private setupIPCHandlers(): void {
    // File operations
    ipcMain.handle('select-files', this.handleSelectFiles.bind(this));
    ipcMain.handle('select-output-directory', this.handleSelectOutputDirectory.bind(this));
    ipcMain.handle('get-file-info', this.handleGetFileInfo.bind(this));

    // Conversion operations
    ipcMain.handle('start-conversion', this.handleStartConversion.bind(this));
    ipcMain.handle('pause-conversion', this.handlePauseConversion.bind(this));
    ipcMain.handle('cancel-conversion', this.handleCancelConversion.bind(this));
    ipcMain.handle('remove-from-queue', this.handleRemoveFromQueue.bind(this));

    // Settings
    ipcMain.handle('get-settings', this.handleGetSettings.bind(this));
    ipcMain.handle('save-settings', this.handleSaveSettings.bind(this));
    ipcMain.handle('get-hardware-info', this.handleGetHardwareInfo.bind(this));

    // System operations
    ipcMain.handle('open-file-location', this.handleOpenFileLocation.bind(this));
    ipcMain.handle('check-ffmpeg', this.handleCheckFFmpeg.bind(this));
  }

  private async handleSelectFiles(): Promise<string[]> {
    const result = await dialog.showOpenDialog(this.mainWindow!, {
      title: 'Select Video Files',
      properties: ['openFile', 'multiSelections'],
      filters: [
        {
          name: 'Video Files',
          extensions: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v', '3gp', 'ts', 'mts', 'm2ts']
        },
        {
          name: 'Audio Files',
          extensions: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma']
        },
        {
          name: 'All Files',
          extensions: ['*']
        }
      ]
    });

    return result.canceled ? [] : result.filePaths;
  }

  private async handleSelectOutputDirectory(): Promise<string | null> {
    const result = await dialog.showOpenDialog(this.mainWindow!, {
      title: 'Select Output Directory',
      properties: ['openDirectory']
    });

    return result.canceled ? null : result.filePaths[0];
  }

  private async handleGetFileInfo(event: any, filePath: string): Promise<any> {
    return this.ffmpegService.getVideoInfo(filePath);
  }

  private async handleStartConversion(event: any, tasks: any[]): Promise<void> {
    return this.conversionService.startBatchConversion(tasks, (progress) => {
      this.mainWindow?.webContents.send('conversion-progress', progress);
    });
  }

  private async handlePauseConversion(): Promise<void> {
    return this.conversionService.pauseAll();
  }

  private async handleCancelConversion(): Promise<void> {
    return this.conversionService.cancelAll();
  }

  private async handleRemoveFromQueue(event: any, taskId: string): Promise<void> {
    return this.conversionService.removeFromQueue(taskId);
  }

  private handleGetSettings(): any {
    return this.store.store;
  }

  private handleSaveSettings(event: any, settings: any): void {
    Object.keys(settings).forEach(key => {
      this.store.set(key, settings[key]);
    });
  }

  private async handleGetHardwareInfo(): Promise<any> {
    return this.hardwareService.getHardwareInfo();
  }

  private async handleOpenFileLocation(event: any, filePath: string): Promise<void> {
    shell.showItemInFolder(filePath);
  }

  private async handleCheckFFmpeg(): Promise<boolean> {
    // Ensure FFmpeg service is initialized before checking
    if (!this.ffmpegService.isAvailable()) {
      try {
        await this.ffmpegService.initialize();
      } catch (error) {
        console.error('FFmpeg initialization failed:', error);
        return false;
      }
    }
    return this.ffmpegService.isAvailable();
  }

  private async handleAddFiles(): Promise<void> {
    const files = await this.handleSelectFiles();
    if (files.length > 0) {
      this.mainWindow?.webContents.send('files-selected', files);
    }
  }

  private showAboutDialog(): void {
    dialog.showMessageBox(this.mainWindow!, {
      type: 'info',
      title: 'À Propos du Convertisseur Vidéo',
      message: 'Convertisseur Vidéo v1.0.0',
      detail: 'Convertisseur vidéo multiplateforme alimenté par FFmpeg\n\nCréé avec Electron, React et TypeScript'
    });
  }

  private showSupportedFormats(): void {
    const formats = `
Formats d'Entrée:
• Vidéo: MP4, AVI, MKV, MOV, WMV, FLV, WebM, M4V, 3GP, TS, MTS, M2TS
• Audio: MP3, WAV, FLAC, AAC, OGG, M4A, WMA

Formats de Sortie:
• Vidéo: MP4 (H.264, H.265)
• Audio: MP3, AAC, WAV
    `.trim();

    dialog.showMessageBox(this.mainWindow!, {
      type: 'info',
      title: 'Formats Supportés',
      message: 'Formats de Fichiers Supportés',
      detail: formats
    });
  }

  private onWindowAllClosed(): void {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }

  private onActivate(): void {
    if (BrowserWindow.getAllWindows().length === 0) {
      this.createMainWindow();
    }
  }
}

// Initialize the application
new VideoConverterApp();