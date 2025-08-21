import React, { useEffect, useState } from 'react';
import { Layout, message, Spin, Alert } from 'antd';
import { FileDropZone } from './components/FileDropZone';
import { ConversionQueue } from './components/ConversionQueue';
import { ConversionControls } from './components/ConversionControls';
import { ProgressDisplay } from './components/ProgressDisplay';
import { SettingsPanel } from './components/SettingsPanel';
import { HeaderBar } from './components/HeaderBar';
import { useAppStore } from './store/useAppStore';
import { ConversionTask, ConversionProgress, HardwareInfo } from './types';
import { useTranslation } from './hooks/useTranslation';
import './App.css';

const { Content } = Layout;

const App: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [servicesReady, setServicesReady] = useState(false);
  const [hardwareInfo, setHardwareInfo] = useState<HardwareInfo | null>(null);
  
  const {
    tasks,
    isConverting,
    overallProgress,
    addFiles,
    updateTaskProgress,
    clearQueue,
    startConversion,
    pauseConversion,
    cancelConversion,
    removeTask,
    setSettings,
    settings
  } = useAppStore();

  useEffect(() => {
    initializeApp();
    setupEventListeners();
    
    return () => {
      // Cleanup event listeners
      window.electronAPI.removeAllListeners('services-ready');
      window.electronAPI.removeAllListeners('services-error');
      window.electronAPI.removeAllListeners('conversion-progress');
      window.electronAPI.removeAllListeners('files-selected');
      window.electronAPI.removeAllListeners('clear-queue');
      window.electronAPI.removeAllListeners('start-conversion');
      window.electronAPI.removeAllListeners('pause-conversion');
      window.electronAPI.removeAllListeners('cancel-conversion');
    };
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Initializing app...');
      console.log('window.electronAPI:', window.electronAPI);
      
      if (!window.electronAPI) {
        console.error('electronAPI not available');
        message.error(t('errors.electronApiNotAvailable'));
        setLoading(false);
        return;
      }
      
      // Load settings
      const savedSettings = await window.electronAPI.getSettings();
      console.log('Settings loaded:', savedSettings);
      setSettings(savedSettings);
      
      // Check FFmpeg availability
      const ffmpegAvailable = await window.electronAPI.checkFFmpeg();
      console.log('FFmpeg available:', ffmpegAvailable);
      if (!ffmpegAvailable) {
        message.warning(t('messages.ffmpegNotFound'));
      }

      console.log('App initialization complete');
      setLoading(false);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      message.error(t('errors.initializationFailed') + ': ' + (error instanceof Error ? error.message : String(error)));
      setLoading(false);
    }
  };

  const setupEventListeners = () => {
    // Services ready
    window.electronAPI.onServicesReady((data) => {
      setServicesReady(data.ffmpegAvailable);
      setHardwareInfo(data.hardwareInfo);
      
      if (data.ffmpegAvailable) {
        message.success(t('app.ready'));
      } else {
        message.error(t('messages.ffmpegNotAvailable'));
      }
    });

    // Services error
    window.electronAPI.onServicesError((error) => {
      console.error('Services error:', error);
      message.error(t('messages.servicesInitializationFailed'));
    });

    // Conversion progress
    window.electronAPI.onConversionProgress((progress: ConversionProgress) => {
      updateTaskProgress(progress.taskId, progress);
    });

    // File selection from menu
    window.electronAPI.onFilesSelected(async (filePaths: string[]) => {
      await handleFilesSelected(filePaths);
    });

    // Menu commands
    window.electronAPI.onClearQueue(() => {
      clearQueue();
      message.info(t('messages.queueCleared'));
    });

    window.electronAPI.onStartConversion(() => {
      if (tasks.length > 0) {
        handleStartConversion();
      } else {
        message.warning(t('messages.noFilesInQueue'));
      }
    });

    window.electronAPI.onPauseConversion(() => {
      handlePauseConversion();
    });

    window.electronAPI.onCancelConversion(() => {
      handleCancelConversion();
    });
  };

  const handleFilesSelected = async (filePaths: string[]) => {
    try {
      const newTasks: ConversionTask[] = [];
      
      for (const filePath of filePaths) {
        try {
          const fileInfo = await window.electronAPI.getFileInfo(filePath);
          newTasks.push({
            id: `task-${Date.now()}-${Math.random()}`,
            inputFile: filePath,
            outputFile: '',
            outputFormat: 'mp3',
            quality: 'high',
            status: 'pending',
            progress: 0,
            fileInfo
          });
        } catch (error) {
          console.error(`Failed to get info for ${filePath}:`, error);
          message.error(`Failed to process ${filePath}`);
        }
      }

      if (newTasks.length > 0) {
        addFiles(newTasks);
        message.success(`${newTasks.length} ${t('messages.filesAdded')}`);
      }
    } catch (error) {
      console.error('Failed to process selected files:', error);
      message.error(t('messages.selectedFilesProcessingFailed'));
    }
  };

  const handleStartConversion = async () => {
    if (tasks.length === 0) {
      message.warning(t('messages.noFilesToConvert'));
      return;
    }

    const pendingTasks = tasks.filter(task => task.status === 'pending');
    if (pendingTasks.length === 0) {
      message.warning(t('messages.noPendingTasks'));
      return;
    }

    try {
      startConversion();
      await window.electronAPI.startConversion(pendingTasks);
      message.info(t('messages.conversionStarted'));
    } catch (error) {
      console.error('Failed to start conversion:', error);
      message.error(t('errors.conversionStartFailed'));
    }
  };

  const handlePauseConversion = async () => {
    try {
      pauseConversion();
      await window.electronAPI.pauseConversion();
      message.info(t('messages.conversionPaused'));
    } catch (error) {
      console.error('Failed to pause conversion:', error);
      message.error(t('errors.conversionPauseFailed'));
    }
  };

  const handleCancelConversion = async () => {
    try {
      cancelConversion();
      await window.electronAPI.cancelConversion();
      message.info(t('messages.conversionCancelled'));
    } catch (error) {
      console.error('Failed to cancel conversion:', error);
      message.error(t('errors.conversionCancelFailed'));
    }
  };

  const handleRemoveTask = async (taskId: string) => {
    try {
      await window.electronAPI.removeFromQueue(taskId);
      removeTask(taskId);
    } catch (error) {
      console.error('Failed to remove task:', error);
      message.error(t('messages.taskRemovalFailed'));
    }
  };

  const handleSettingsChange = async (newSettings: any) => {
    try {
      await window.electronAPI.saveSettings(newSettings);
      setSettings(newSettings);
      message.success(t('settings.saved'));
    } catch (error) {
      console.error('Failed to save settings:', error);
      message.error(t('errors.settingsSaveFailed'));
    }
  };

  if (loading) {
    return (
      <Layout className="app-layout">
        <Content className="app-content">
          <div className="loading-container">
            <Spin size="large" />
            <p>{t('app.initializing')}</p>
          </div>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout className="app-layout">
      <HeaderBar 
        hardwareInfo={hardwareInfo}
        servicesReady={servicesReady}
      />
      
      <Content className="app-content">
        {!servicesReady && (
          <Alert
            message={t('messages.ffmpegNotAvailable')}
            description={t('messages.servicesInitializationFailed')}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <div className="main-container">
          <div className="left-panel">
            <FileDropZone 
              onFilesSelected={handleFilesSelected}
              disabled={!servicesReady}
            />
            
            <ConversionControls
              onStartConversion={handleStartConversion}
              onPauseConversion={handlePauseConversion}
              onCancelConversion={handleCancelConversion}
              isConverting={isConverting}
              hasFiles={tasks.length > 0}
              disabled={!servicesReady}
            />

            <ProgressDisplay 
              progress={overallProgress}
              isConverting={isConverting}
            />
          </div>

          <div className="right-panel">
            <ConversionQueue
              tasks={tasks}
              onRemoveTask={handleRemoveTask}
              onOpenFileLocation={window.electronAPI.openFileLocation}
            />
          </div>
        </div>

        <SettingsPanel
          settings={settings}
          onSettingsChange={handleSettingsChange}
          hardwareInfo={hardwareInfo}
        />
      </Content>
    </Layout>
  );
};

export default App;