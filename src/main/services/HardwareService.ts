import * as si from 'systeminformation';
import { HardwareInfo, FFmpegConfig } from '../../renderer/types';

export class HardwareService {
  private hardwareInfo: HardwareInfo | null = null;
  private isDetected: boolean = false;

  constructor() {}

  public async detectHardware(): Promise<void> {
    try {
      console.log('Detecting hardware capabilities...');
      
      const [cpu, graphics, memory, osInfo] = await Promise.all([
        si.cpu(),
        si.graphics(),
        si.mem(),
        si.osInfo()
      ]);

      this.hardwareInfo = {
        cpu: {
          cores: cpu.physicalCores || cpu.cores,
          threads: cpu.cores,
          model: cpu.manufacturer + ' ' + cpu.brand,
          speed: cpu.speed || 0
        },
        gpu: {
          nvidia: this.detectNvidiaGPU(graphics),
          amd: this.detectAMDGPU(graphics),
          intel: this.detectIntelGPU(graphics)
        },
        memory: {
          total: memory.total,
          available: memory.available
        },
        platform: osInfo.platform
      };

      this.isDetected = true;
      console.log('Hardware detection completed:', this.hardwareInfo);
    } catch (error) {
      console.error('Failed to detect hardware:', error);
      
      // Fallback to basic detection
      this.hardwareInfo = {
        cpu: {
          cores: require('os').cpus().length,
          threads: require('os').cpus().length,
          model: 'Unknown CPU',
          speed: 0
        },
        gpu: {
          nvidia: { available: false },
          amd: { available: false },
          intel: { available: false }
        },
        memory: {
          total: require('os').totalmem(),
          available: require('os').freemem()
        },
        platform: require('os').platform()
      };
      
      this.isDetected = true;
    }
  }

  private detectNvidiaGPU(graphics: si.Systeminformation.GraphicsData): HardwareInfo['gpu']['nvidia'] {
    const nvidiaController = graphics.controllers.find(gpu => 
      gpu.vendor?.toLowerCase().includes('nvidia') ||
      gpu.model?.toLowerCase().includes('nvidia') ||
      gpu.model?.toLowerCase().includes('geforce') ||
      gpu.model?.toLowerCase().includes('quadro') ||
      gpu.model?.toLowerCase().includes('tesla')
    );

    if (nvidiaController) {
      return {
        available: true,
        model: nvidiaController.model || 'NVIDIA GPU',
        memory: nvidiaController.vram || 0
      };
    }

    return { available: false };
  }

  private detectAMDGPU(graphics: si.Systeminformation.GraphicsData): HardwareInfo['gpu']['amd'] {
    const amdController = graphics.controllers.find(gpu => 
      gpu.vendor?.toLowerCase().includes('amd') ||
      gpu.vendor?.toLowerCase().includes('ati') ||
      gpu.model?.toLowerCase().includes('radeon') ||
      gpu.model?.toLowerCase().includes('amd')
    );

    if (amdController) {
      return {
        available: true,
        model: amdController.model || 'AMD GPU',
        memory: amdController.vram || 0
      };
    }

    return { available: false };
  }

  private detectIntelGPU(graphics: si.Systeminformation.GraphicsData): HardwareInfo['gpu']['intel'] {
    const intelController = graphics.controllers.find(gpu => 
      gpu.vendor?.toLowerCase().includes('intel') ||
      gpu.model?.toLowerCase().includes('intel') ||
      gpu.model?.toLowerCase().includes('iris') ||
      gpu.model?.toLowerCase().includes('uhd')
    );

    if (intelController) {
      return {
        available: true,
        model: intelController.model || 'Intel GPU'
      };
    }

    return { available: false };
  }

  public async getHardwareInfo(): Promise<HardwareInfo | null> {
    if (!this.isDetected) {
      await this.detectHardware();
    }
    return this.hardwareInfo;
  }

  public generateOptimalConfig(fileSize: number = 0, targetFormat: string = 'mp4'): FFmpegConfig {
    if (!this.hardwareInfo) {
      return this.getDefaultConfig();
    }

    const config: FFmpegConfig = {
      preset: this.getOptimalPreset(fileSize),
      threads: this.getOptimalThreadCount(),
      enableGPU: this.shouldUseGPU(targetFormat),
      encoder: this.getBestEncoder(targetFormat),
      bufferSize: this.getOptimalBufferSize(fileSize),
      audioCodec: this.getOptimalAudioCodec(targetFormat),
      videoCodec: this.getOptimalVideoCodec(targetFormat)
    };

    console.log('Generated optimal FFmpeg config:', config);
    return config;
  }

  private getOptimalPreset(fileSize: number): string {
    // Adjust preset based on file size and CPU capabilities
    const cpuCores = this.hardwareInfo?.cpu.cores || 4;
    
    if (fileSize > 1024 * 1024 * 1024) { // > 1GB
      return cpuCores >= 8 ? 'medium' : 'fast';
    } else if (fileSize > 100 * 1024 * 1024) { // > 100MB
      return cpuCores >= 4 ? 'medium' : 'fast';
    } else {
      return 'fast'; // Small files
    }
  }

  private getOptimalThreadCount(): number {
    const cpuCores = this.hardwareInfo?.cpu.cores || 4;
    
    // Use 75% of available cores, minimum 1, maximum 16
    const optimalThreads = Math.max(1, Math.min(16, Math.floor(cpuCores * 0.75)));
    
    console.log(`Using ${optimalThreads} threads out of ${cpuCores} CPU cores`);
    return optimalThreads;
  }

  private shouldUseGPU(targetFormat: string): boolean {
    if (!this.hardwareInfo) return false;

    const { nvidia, amd, intel } = this.hardwareInfo.gpu;

    // GPU acceleration is primarily beneficial for video formats
    if (targetFormat === 'mp3' || targetFormat === 'wav' || targetFormat === 'aac') {
      return false;
    }

    // Check for hardware encoder support
    return nvidia?.available || amd?.available || intel?.available || false;
  }

  private getBestEncoder(targetFormat: string): FFmpegConfig['encoder'] {
    if (!this.hardwareInfo || !this.shouldUseGPU(targetFormat)) {
      return 'cpu';
    }

    const { nvidia, amd, intel } = this.hardwareInfo.gpu;

    // Priority order: NVIDIA > AMD > Intel > CPU
    if (nvidia?.available) {
      console.log('Using NVIDIA NVENC encoder');
      return 'nvenc';
    } else if (amd?.available) {
      console.log('Using AMD AMF encoder');
      return 'amf';
    } else if (intel?.available) {
      console.log('Using Intel Quick Sync encoder');
      return 'qsv';
    }

    return 'cpu';
  }

  private getOptimalBufferSize(fileSize: number): string {
    const availableMemory = this.hardwareInfo?.memory.available || 1024 * 1024 * 1024;
    const totalMemory = this.hardwareInfo?.memory.total || 4 * 1024 * 1024 * 1024;

    // Conservative memory usage - use max 25% of available memory
    const maxBufferSize = Math.floor(availableMemory * 0.25);

    // Size-based buffer allocation
    if (fileSize > 2 * 1024 * 1024 * 1024) { // > 2GB
      return Math.min(maxBufferSize, 64 * 1024 * 1024).toString(); // Max 64MB
    } else if (fileSize > 500 * 1024 * 1024) { // > 500MB
      return Math.min(maxBufferSize, 32 * 1024 * 1024).toString(); // Max 32MB
    } else {
      return Math.min(maxBufferSize, 16 * 1024 * 1024).toString(); // Max 16MB
    }
  }

  private getOptimalAudioCodec(targetFormat: string): string {
    switch (targetFormat.toLowerCase()) {
      case 'mp3':
        return 'libmp3lame';
      case 'aac':
      case 'mp4':
        return 'aac';
      case 'wav':
        return 'pcm_s16le';
      default:
        return 'aac';
    }
  }

  private getOptimalVideoCodec(targetFormat: string): string | undefined {
    if (targetFormat === 'mp3' || targetFormat === 'wav' || targetFormat === 'aac') {
      return undefined; // Audio-only formats
    }

    if (!this.shouldUseGPU(targetFormat)) {
      return 'libx264';
    }

    const encoder = this.getBestEncoder(targetFormat);
    switch (encoder) {
      case 'nvenc':
        return 'h264_nvenc';
      case 'amf':
        return 'h264_amf';
      case 'qsv':
        return 'h264_qsv';
      default:
        return 'libx264';
    }
  }

  private getDefaultConfig(): FFmpegConfig {
    return {
      preset: 'fast',
      threads: 2,
      enableGPU: false,
      encoder: 'cpu',
      bufferSize: (16 * 1024 * 1024).toString(), // 16MB
      audioCodec: 'aac',
      videoCodec: 'libx264'
    };
  }

  public async getCurrentSystemLoad(): Promise<{
    cpu: number;
    memory: number;
    gpu?: number;
  }> {
    try {
      const [currentLoad, memory] = await Promise.all([
        si.currentLoad(),
        si.mem()
      ]);

      return {
        cpu: Math.round(currentLoad.currentLoad || 0),
        memory: Math.round(((memory.total - memory.available) / memory.total) * 100),
        gpu: 0 // GPU usage detection is complex and platform-specific
      };
    } catch (error) {
      console.error('Failed to get current system load:', error);
      return {
        cpu: 0,
        memory: 0,
        gpu: 0
      };
    }
  }

  public isHardwareAccelerationAvailable(): boolean {
    if (!this.hardwareInfo) return false;

    const { nvidia, amd, intel } = this.hardwareInfo.gpu;
    return nvidia?.available || amd?.available || intel?.available || false;
  }

  public getRecommendedConcurrentJobs(): number {
    if (!this.hardwareInfo) return 1;

    const cpuCores = this.hardwareInfo.cpu.cores;
    const totalMemoryGB = Math.floor(this.hardwareInfo.memory.total / (1024 * 1024 * 1024));

    // Base concurrent jobs on CPU cores and available memory
    let recommendedJobs = Math.max(1, Math.floor(cpuCores / 2));

    // Adjust based on memory (each job should have at least 2GB available)
    const memoryBasedLimit = Math.floor(totalMemoryGB / 2);
    recommendedJobs = Math.min(recommendedJobs, memoryBasedLimit);

    // Cap at reasonable maximum
    return Math.min(recommendedJobs, 4);
  }
}