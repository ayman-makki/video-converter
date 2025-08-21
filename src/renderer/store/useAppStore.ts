import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { ConversionTask, ConversionProgress, AppSettings } from '../types';

interface AppState {
  // Tasks and queue
  tasks: ConversionTask[];
  isConverting: boolean;
  overallProgress: number;
  
  // Settings
  settings: AppSettings;
  
  // Actions
  addFiles: (newTasks: ConversionTask[]) => void;
  removeTask: (taskId: string) => void;
  clearQueue: () => void;
  updateTaskProgress: (taskId: string, progress: ConversionProgress) => void;
  startConversion: () => void;
  pauseConversion: () => void;
  cancelConversion: () => void;
  setSettings: (settings: Partial<AppSettings>) => void;
  updateTaskFormat: (taskId: string, format: string) => void;
  updateTaskQuality: (taskId: string, quality: string) => void;
}

const defaultSettings: AppSettings = {
  outputDirectory: '',
  concurrentJobs: 2,
  gpuAcceleration: true,
  autoDetectHardware: true,
  outputFormat: 'mp3',
  audioQuality: 'high',
  videoQuality: 'high',
  preserveMetadata: true,
  autoStartConversion: false,
  notifications: true
};

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    tasks: [],
    isConverting: false,
    overallProgress: 0,
    settings: defaultSettings,

    // Actions
    addFiles: (newTasks: ConversionTask[]) => {
      set((state) => {
        // Generate output file names
        const tasksWithOutput = newTasks.map(task => ({
          ...task,
          outputFile: generateOutputFileName(task.inputFile, task.outputFormat, state.settings.outputDirectory)
        }));

        return {
          tasks: [...state.tasks, ...tasksWithOutput]
        };
      });
    },

    removeTask: (taskId: string) => {
      set((state) => ({
        tasks: state.tasks.filter(task => task.id !== taskId)
      }));
    },

    clearQueue: () => {
      set({
        tasks: [],
        overallProgress: 0
      });
    },

    updateTaskProgress: (taskId: string, progress: ConversionProgress) => {
      set((state) => {
        const updatedTasks = state.tasks.map(task => {
          if (task.id === taskId) {
            return {
              ...task,
              progress: progress.progress,
              status: progress.status,
              speed: progress.speed,
              eta: progress.eta,
              error: progress.error
            };
          }
          return task;
        });

        // Calculate overall progress
        const totalProgress = updatedTasks.reduce((sum, task) => sum + task.progress, 0);
        const overallProgress = updatedTasks.length > 0 ? Math.round(totalProgress / updatedTasks.length) : 0;

        return {
          tasks: updatedTasks,
          overallProgress,
          isConverting: updatedTasks.some(task => task.status === 'converting')
        };
      });
    },

    startConversion: () => {
      set((state) => ({
        isConverting: true,
        tasks: state.tasks.map(task => 
          task.status === 'pending' ? { ...task, status: 'queued' } : task
        )
      }));
    },

    pauseConversion: () => {
      set((state) => ({
        isConverting: false,
        tasks: state.tasks.map(task => 
          task.status === 'converting' || task.status === 'queued' 
            ? { ...task, status: 'paused' } 
            : task
        )
      }));
    },

    cancelConversion: () => {
      set((state) => ({
        isConverting: false,
        overallProgress: 0,
        tasks: state.tasks.map(task => ({
          ...task,
          status: task.status === 'completed' ? 'completed' : 'pending',
          progress: task.status === 'completed' ? 100 : 0
        }))
      }));
    },

    setSettings: (newSettings: Partial<AppSettings>) => {
      set((state) => ({
        settings: { ...state.settings, ...newSettings }
      }));
    },

    updateTaskFormat: (taskId: string, format: string) => {
      set((state) => ({
        tasks: state.tasks.map(task => {
          if (task.id === taskId) {
            return {
              ...task,
              outputFormat: format as any,
              outputFile: generateOutputFileName(task.inputFile, format, state.settings.outputDirectory)
            };
          }
          return task;
        })
      }));
    },

    updateTaskQuality: (taskId: string, quality: string) => {
      set((state) => ({
        tasks: state.tasks.map(task => 
          task.id === taskId ? { ...task, quality: quality as any } : task
        )
      }));
    }
  }))
);

// Helper function to generate output file name
function generateOutputFileName(inputFile: string, outputFormat: string, outputDir: string): string {
  // Extract file name without extension
  const lastSlash = Math.max(inputFile.lastIndexOf('/'), inputFile.lastIndexOf('\\'));
  const fileName = inputFile.substring(lastSlash + 1);
  const lastDot = fileName.lastIndexOf('.');
  const inputName = lastDot > 0 ? fileName.substring(0, lastDot) : fileName;
  const outputName = `${inputName}.${outputFormat}`;
  
  if (outputDir) {
    return `${outputDir}/${outputName}`;
  }
  
  // Use the same directory as input file if no output directory specified
  const inputDir = inputFile.substring(0, lastSlash);
  return `${inputDir}/${outputName}`;
}

// Subscribe to settings changes and persist them
useAppStore.subscribe(
  (state) => state.settings,
  (settings) => {
    // Save settings to electron store
    if (window.electronAPI) {
      window.electronAPI.saveSettings(settings).catch(console.error);
    }
  },
  {
    equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b)
  }
);