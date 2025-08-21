import { EventEmitter } from 'events';
import { FFmpegService } from './FFmpegService';
import { HardwareService } from './HardwareService';
import { ConversionTask, ConversionProgress, ConversionStatus, FFmpegConfig } from '../../renderer/types';
import { v4 as uuidv4 } from 'uuid';

interface ConversionJob {
  task: ConversionTask;
  config: FFmpegConfig;
  startTime: number;
}

export class ConversionService extends EventEmitter {
  private ffmpegService: FFmpegService;
  private hardwareService: HardwareService;
  private conversionQueue: ConversionTask[] = [];
  private activeJobs: Map<string, ConversionJob> = new Map();
  private maxConcurrentJobs: number = 2;
  private isProcessing: boolean = false;
  private isPaused: boolean = false;

  constructor(ffmpegService: FFmpegService, hardwareService: HardwareService) {
    super();
    this.ffmpegService = ffmpegService;
    this.hardwareService = hardwareService;
  }

  public async startBatchConversion(
    tasks: ConversionTask[],
    progressCallback?: (progress: ConversionProgress) => void
  ): Promise<void> {
    console.log(`Starting batch conversion of ${tasks.length} tasks`);
    
    // Set optimal concurrent jobs based on hardware
    await this.updateConcurrentJobsFromHardware();
    
    // Add tasks to queue
    this.conversionQueue.push(...tasks);
    
    // Set up progress callback
    if (progressCallback) {
      this.on('progress', progressCallback);
    }

    // Start processing
    this.isProcessing = true;
    this.isPaused = false;
    
    // Begin processing queue
    this.processQueue();
  }

  private async updateConcurrentJobsFromHardware(): Promise<void> {
    try {
      const hardwareInfo = await this.hardwareService.getHardwareInfo();
      if (hardwareInfo) {
        this.maxConcurrentJobs = this.hardwareService.getRecommendedConcurrentJobs();
        console.log(`Set concurrent jobs to: ${this.maxConcurrentJobs}`);
      }
    } catch (error) {
      console.error('Failed to get hardware info for optimization:', error);
      this.maxConcurrentJobs = 2; // Safe default
    }
  }

  private async processQueue(): Promise<void> {
    while (this.isProcessing && !this.isPaused && (this.conversionQueue.length > 0 || this.activeJobs.size > 0)) {
      // Start new jobs if we have capacity and pending tasks
      while (
        this.activeJobs.size < this.maxConcurrentJobs && 
        this.conversionQueue.length > 0 && 
        !this.isPaused
      ) {
        const task = this.conversionQueue.shift();
        if (task) {
          await this.startConversionJob(task);
        }
      }

      // Wait a bit before checking again
      await this.sleep(100);
    }

    console.log('Queue processing completed');
  }

  private async startConversionJob(task: ConversionTask): Promise<void> {
    try {
      console.log(`Starting conversion job for: ${task.inputFile}`);
      
      // Generate optimal config for this task
      const fileInfo = task.fileInfo;
      const fileSize = fileInfo?.size || 0;
      const config = this.hardwareService.generateOptimalConfig(fileSize, task.outputFormat);

      // Create job record
      const job: ConversionJob = {
        task,
        config,
        startTime: Date.now()
      };

      this.activeJobs.set(task.id, job);

      // Update task status
      this.emitProgress(task.id, {
        taskId: task.id,
        status: 'converting',
        progress: 0
      });

      // Start FFmpeg conversion
      await this.ffmpegService.convertFile(
        task.id,
        task.inputFile,
        task.outputFile,
        task.outputFormat,
        task.quality,
        config,
        (ffmpegProgress) => {
          // Emit progress update
          this.emitProgress(task.id, {
            taskId: task.id,
            status: 'converting',
            progress: ffmpegProgress.progress,
            speed: ffmpegProgress.speed,
            eta: this.calculateETA(ffmpegProgress.progress, job.startTime)
          });
        }
      );

      // Conversion completed successfully
      job.task.endTime = Date.now();
      this.emitProgress(task.id, {
        taskId: task.id,
        status: 'completed',
        progress: 100
      });

      console.log(`Conversion completed: ${task.outputFile}`);
      
    } catch (error) {
      console.error(`Conversion failed for ${task.inputFile}:`, error);
      
      // Emit error status
      this.emitProgress(task.id, {
        taskId: task.id,
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      // Clean up job
      this.activeJobs.delete(task.id);
    }
  }

  private emitProgress(taskId: string, progress: ConversionProgress): void {
    this.emit('progress', progress);
  }

  private calculateETA(progress: number, startTime: number): string {
    if (progress <= 0) return 'Calculating...';
    
    const elapsed = Date.now() - startTime;
    const totalEstimated = (elapsed / progress) * 100;
    const remaining = totalEstimated - elapsed;
    
    if (remaining <= 0) return 'Almost done...';
    
    const seconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async pauseAll(): Promise<void> {
    console.log('Pausing all conversions');
    this.isPaused = true;
    
    // Update status of all active jobs
    for (const [taskId, job] of this.activeJobs.entries()) {
      this.emitProgress(taskId, {
        taskId,
        status: 'paused',
        progress: 0 // We don't have current progress here
      });
    }
  }

  public async resumeAll(): Promise<void> {
    console.log('Resuming all conversions');
    this.isPaused = false;
    
    if (this.isProcessing) {
      this.processQueue();
    }
  }

  public async cancelAll(): Promise<void> {
    console.log('Cancelling all conversions');
    
    // Stop processing
    this.isProcessing = false;
    this.isPaused = false;
    
    // Cancel all active FFmpeg processes
    this.ffmpegService.cancelAllConversions();
    
    // Clear queue and active jobs
    this.conversionQueue.length = 0;
    
    // Update status of all active jobs
    for (const [taskId] of this.activeJobs.entries()) {
      this.emitProgress(taskId, {
        taskId,
        status: 'cancelled',
        progress: 0
      });
    }
    
    this.activeJobs.clear();
    
    // Remove progress listeners
    this.removeAllListeners('progress');
  }

  public async removeFromQueue(taskId: string): Promise<void> {
    // Remove from queue if not started yet
    const queueIndex = this.conversionQueue.findIndex(task => task.id === taskId);
    if (queueIndex !== -1) {
      this.conversionQueue.splice(queueIndex, 1);
      console.log(`Removed task ${taskId} from queue`);
      return;
    }

    // Cancel if currently processing
    const activeJob = this.activeJobs.get(taskId);
    if (activeJob) {
      this.ffmpegService.cancelConversion(taskId);
      this.activeJobs.delete(taskId);
      
      this.emitProgress(taskId, {
        taskId,
        status: 'cancelled',
        progress: 0
      });
      
      console.log(`Cancelled active conversion for task ${taskId}`);
    }
  }

  public getQueueStatus(): {
    totalTasks: number;
    activeTasks: number;
    queuedTasks: number;
    isProcessing: boolean;
    isPaused: boolean;
  } {
    return {
      totalTasks: this.conversionQueue.length + this.activeJobs.size,
      activeTasks: this.activeJobs.size,
      queuedTasks: this.conversionQueue.length,
      isProcessing: this.isProcessing,
      isPaused: this.isPaused
    };
  }

  public setMaxConcurrentJobs(maxJobs: number): void {
    this.maxConcurrentJobs = Math.max(1, Math.min(8, maxJobs));
    console.log(`Set max concurrent jobs to: ${this.maxConcurrentJobs}`);
  }

  public async getConversionEstimate(task: ConversionTask): Promise<{
    estimatedTime: number;
    estimatedSize: number;
    configuration: FFmpegConfig;
  }> {
    const fileSize = task.fileInfo?.size || 0;
    const duration = task.fileInfo?.duration || 0;
    
    const config = this.hardwareService.generateOptimalConfig(fileSize, task.outputFormat);
    
    // Rough estimation based on format and quality
    let conversionSpeedMultiplier = 1;
    
    if (config.enableGPU) {
      conversionSpeedMultiplier = 3; // GPU acceleration
    } else {
      conversionSpeedMultiplier = 1; // CPU only
    }
    
    // Adjust based on preset
    switch (config.preset) {
      case 'ultrafast':
        conversionSpeedMultiplier *= 4;
        break;
      case 'fast':
        conversionSpeedMultiplier *= 2;
        break;
      case 'medium':
        conversionSpeedMultiplier *= 1.5;
        break;
      case 'slow':
        conversionSpeedMultiplier *= 0.8;
        break;
    }
    
    const estimatedTime = duration / conversionSpeedMultiplier;
    
    // Rough output size estimation
    let estimatedSize = fileSize;
    
    if (task.outputFormat === 'mp3') {
      // Audio compression typically reduces size significantly
      estimatedSize = fileSize * 0.1;
    } else if (task.outputFormat === 'mp4') {
      // Video compression varies widely
      switch (task.quality) {
        case 'low':
          estimatedSize = fileSize * 0.3;
          break;
        case 'medium':
          estimatedSize = fileSize * 0.5;
          break;
        case 'high':
          estimatedSize = fileSize * 0.7;
          break;
        case 'ultra':
          estimatedSize = fileSize * 0.9;
          break;
      }
    }
    
    return {
      estimatedTime,
      estimatedSize,
      configuration: config
    };
  }
}