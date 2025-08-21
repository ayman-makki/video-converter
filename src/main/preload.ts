import { contextBridge, ipcRenderer } from 'electron';

// Define the API interface
export interface ElectronAPI {
  // File operations
  selectFiles: () => Promise<string[]>;
  selectOutputDirectory: () => Promise<string | null>;
  getFileInfo: (filePath: string) => Promise<any>;
  openFileLocation: (filePath: string) => Promise<void>;

  // Conversion operations
  startConversion: (tasks: any[]) => Promise<void>;
  pauseConversion: () => Promise<void>;
  cancelConversion: () => Promise<void>;
  removeFromQueue: (taskId: string) => Promise<void>;

  // Settings
  getSettings: () => Promise<any>;
  saveSettings: (settings: any) => Promise<void>;
  getHardwareInfo: () => Promise<any>;

  // System
  checkFFmpeg: () => Promise<boolean>;

  // Event listeners
  onServicesReady: (callback: (data: any) => void) => void;
  onServicesError: (callback: (error: any) => void) => void;
  onConversionProgress: (callback: (progress: any) => void) => void;
  onFilesSelected: (callback: (files: string[]) => void) => void;
  onClearQueue: (callback: () => void) => void;
  onStartConversion: (callback: () => void) => void;
  onPauseConversion: (callback: () => void) => void;
  onCancelConversion: (callback: () => void) => void;

  // Remove listeners
  removeAllListeners: (channel: string) => void;
}

const electronAPI: ElectronAPI = {
  // File operations
  selectFiles: () => ipcRenderer.invoke('select-files'),
  selectOutputDirectory: () => ipcRenderer.invoke('select-output-directory'),
  getFileInfo: (filePath: string) => ipcRenderer.invoke('get-file-info', filePath),
  openFileLocation: (filePath: string) => ipcRenderer.invoke('open-file-location', filePath),

  // Conversion operations
  startConversion: (tasks: any[]) => ipcRenderer.invoke('start-conversion', tasks),
  pauseConversion: () => ipcRenderer.invoke('pause-conversion'),
  cancelConversion: () => ipcRenderer.invoke('cancel-conversion'),
  removeFromQueue: (taskId: string) => ipcRenderer.invoke('remove-from-queue', taskId),

  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
  getHardwareInfo: () => ipcRenderer.invoke('get-hardware-info'),

  // System
  checkFFmpeg: () => ipcRenderer.invoke('check-ffmpeg'),

  // Event listeners
  onServicesReady: (callback) => {
    ipcRenderer.on('services-ready', (event, data) => callback(data));
  },
  onServicesError: (callback) => {
    ipcRenderer.on('services-error', (event, error) => callback(error));
  },
  onConversionProgress: (callback) => {
    ipcRenderer.on('conversion-progress', (event, progress) => callback(progress));
  },
  onFilesSelected: (callback) => {
    ipcRenderer.on('files-selected', (event, files) => callback(files));
  },
  onClearQueue: (callback) => {
    ipcRenderer.on('clear-queue', () => callback());
  },
  onStartConversion: (callback) => {
    ipcRenderer.on('start-conversion', () => callback());
  },
  onPauseConversion: (callback) => {
    ipcRenderer.on('pause-conversion', () => callback());
  },
  onCancelConversion: (callback) => {
    ipcRenderer.on('cancel-conversion', () => callback());
  },

  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for global
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}