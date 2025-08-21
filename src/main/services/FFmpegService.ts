import { spawn, ChildProcess } from 'child_process';
import { join, basename, extname } from 'path';
import { pathExists } from 'path-exists';
import { app } from 'electron';
import * as os from 'os';
import { VideoInfo, FFmpegConfig, QualityLevel, OutputFormat } from '../../renderer/types';

interface FFmpegProgress {
  frames: number;
  fps: number;
  bitrate: string;
  totalSize: string;
  outTimeMs: number;
  outTime: string;
  dupFrames: number;
  dropFrames: number;
  speed: number;
  progress: number;
}

export class FFmpegService {
  private ffmpegPath: string = '';
  private ffprobePath: string = '';
  private isInitialized: boolean = false;
  private activeProcesses: Map<string, ChildProcess> = new Map();

  constructor() {
    this.initializePaths();
  }

  private initializePaths(): void {
    const platform = os.platform();
    const architecture = os.arch();
    
    let binaryDir: string;
    
    if (app.isPackaged) {
      // Production: binaries are in resources/ffmpeg
      binaryDir = join(process.resourcesPath, 'ffmpeg', this.getPlatformFolder(platform, architecture));
    } else {
      // Development: binaries are in resources/ffmpeg
      binaryDir = join(__dirname, '..', '..', '..', 'resources', 'ffmpeg', this.getPlatformFolder(platform, architecture));
    }

    this.ffmpegPath = join(binaryDir, platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
    this.ffprobePath = join(binaryDir, platform === 'win32' ? 'ffprobe.exe' : 'ffprobe');
  }

  private getPlatformFolder(platform: string, arch: string): string {
    switch (platform) {
      case 'win32':
        return arch === 'x64' ? 'win32-x64' : 'win32-ia32';
      case 'darwin':
        return arch === 'arm64' ? 'darwin-arm64' : 'darwin-x64';
      case 'linux':
        return arch === 'x64' ? 'linux-x64' : 'linux-ia32';
      default:
        return 'linux-x64';
    }
  }

  public async initialize(): Promise<void> {
    try {
      console.log('FFmpeg paths:', {
        ffmpegPath: this.ffmpegPath,
        ffprobePath: this.ffprobePath,
        resourcesPath: process.resourcesPath,
        isPackaged: app.isPackaged,
        platform: os.platform(),
        arch: os.arch()
      });

      const ffmpegExists = await pathExists(this.ffmpegPath);
      const ffprobeExists = await pathExists(this.ffprobePath);

      console.log('FFmpeg binary existence check:', {
        ffmpegExists,
        ffprobeExists
      });

      if (!ffmpegExists || !ffprobeExists) {
        throw new Error(`FFmpeg binaries not found. FFmpeg: ${ffmpegExists}, FFprobe: ${ffprobeExists}`);
      }

      // Test FFmpeg execution
      await this.testFFmpeg();
      
      this.isInitialized = true;
      console.log('FFmpeg service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize FFmpeg service:', error);
      throw error;
    }
  }

  private async testFFmpeg(): Promise<void> {
    return new Promise((resolve, reject) => {
      const process = spawn(this.ffmpegPath, ['-version'], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      process.stdout?.on('data', (data) => {
        output += data.toString();
      });

      process.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          console.log('FFmpeg test successful');
          resolve();
        } else {
          reject(new Error(`FFmpeg test failed with code ${code}: ${errorOutput}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Failed to spawn FFmpeg: ${error.message}`));
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!process.killed) {
          process.kill();
          reject(new Error('FFmpeg test timed out'));
        }
      }, 10000);
    });
  }

  public isAvailable(): boolean {
    return this.isInitialized;
  }

  public async getVideoInfo(filePath: string): Promise<VideoInfo> {
    if (!this.isInitialized) {
      throw new Error('FFmpeg service not initialized');
    }

    return new Promise((resolve, reject) => {
      const args = [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        filePath
      ];

      const process = spawn(this.ffprobePath, args, {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      process.stdout?.on('data', (data) => {
        output += data.toString();
      });

      process.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          try {
            const data = JSON.parse(output);
            const videoInfo = this.parseVideoInfo(data);
            resolve(videoInfo);
          } catch (error) {
            reject(new Error(`Failed to parse video info: ${error}`));
          }
        } else {
          reject(new Error(`FFprobe failed with code ${code}: ${errorOutput}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Failed to get video info: ${error.message}`));
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!process.killed) {
          process.kill();
          reject(new Error('Video info extraction timed out'));
        }
      }, 30000);
    });
  }

  private parseVideoInfo(data: any): VideoInfo {
    const format = data.format || {};
    const streams = data.streams || [];
    
    const videoStream = streams.find((s: any) => s.codec_type === 'video');
    const audioStream = streams.find((s: any) => s.codec_type === 'audio');

    return {
      duration: parseFloat(format.duration || 0),
      format: format.format_name || 'unknown',
      size: parseInt(format.size || 0),
      resolution: {
        width: videoStream?.width || 0,
        height: videoStream?.height || 0
      },
      bitrate: parseInt(format.bit_rate || 0),
      fps: videoStream ? this.parseFps(videoStream.r_frame_rate) : 0,
      hasAudio: !!audioStream,
      hasVideo: !!videoStream,
      codec: {
        video: videoStream?.codec_name,
        audio: audioStream?.codec_name
      }
    };
  }

  private parseFps(rFrameRate: string): number {
    if (!rFrameRate) return 0;
    
    const parts = rFrameRate.split('/');
    if (parts.length === 2) {
      const numerator = parseFloat(parts[0]);
      const denominator = parseFloat(parts[1]);
      return denominator !== 0 ? numerator / denominator : 0;
    }
    
    return parseFloat(rFrameRate) || 0;
  }

  public async convertFile(
    taskId: string,
    inputPath: string,
    outputPath: string,
    outputFormat: OutputFormat,
    quality: QualityLevel,
    config: FFmpegConfig,
    onProgress?: (progress: FFmpegProgress) => void
  ): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('FFmpeg service not initialized');
    }

    return new Promise((resolve, reject) => {
      const args = this.buildFFmpegArgs(inputPath, outputPath, outputFormat, quality, config);
      
      console.log(`Starting conversion: ${basename(inputPath)} -> ${basename(outputPath)}`);
      console.log(`FFmpeg args: ${args.join(' ')}`);

      const process = spawn(this.ffmpegPath, args, {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      this.activeProcesses.set(taskId, process);

      let errorOutput = '';
      let totalDuration = 0;

      // FFmpeg writes progress to stderr
      process.stderr?.on('data', (data) => {
        const output = data.toString();
        errorOutput += output;

        // Extract duration from initial output
        if (totalDuration === 0) {
          const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
          if (durationMatch) {
            const hours = parseInt(durationMatch[1]);
            const minutes = parseInt(durationMatch[2]);
            const seconds = parseFloat(durationMatch[3]);
            totalDuration = hours * 3600 + minutes * 60 + seconds;
          }
        }

        // Parse progress information
        const progressMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2}).+speed=\s*(\d+\.?\d*)x/);
        if (progressMatch && totalDuration > 0 && onProgress) {
          const hours = parseInt(progressMatch[1]);
          const minutes = parseInt(progressMatch[2]);
          const seconds = parseFloat(progressMatch[3]);
          const currentTime = hours * 3600 + minutes * 60 + seconds;
          const progress = Math.min((currentTime / totalDuration) * 100, 100);
          const speed = parseFloat(progressMatch[4]);

          onProgress({
            frames: 0,
            fps: 0,
            bitrate: '',
            totalSize: '',
            outTimeMs: currentTime * 1000,
            outTime: progressMatch[0],
            dupFrames: 0,
            dropFrames: 0,
            speed,
            progress
          });
        }
      });

      process.on('close', (code) => {
        this.activeProcesses.delete(taskId);
        
        if (code === 0) {
          console.log(`Conversion completed: ${basename(outputPath)}`);
          resolve();
        } else if (code === null) {
          // Process was killed
          reject(new Error('Conversion cancelled'));
        } else {
          const errorMessage = this.parseFFmpegError(errorOutput);
          console.error(`Conversion failed: ${errorMessage}`);
          reject(new Error(errorMessage));
        }
      });

      process.on('error', (error) => {
        this.activeProcesses.delete(taskId);
        reject(new Error(`FFmpeg process error: ${error.message}`));
      });
    });
  }

  private buildFFmpegArgs(
    inputPath: string,
    outputPath: string,
    outputFormat: OutputFormat,
    quality: QualityLevel,
    config: FFmpegConfig
  ): string[] {
    const args: string[] = [
      '-i', inputPath,
      '-y', // Overwrite output files
      '-progress', 'pipe:2', // Send progress to stderr
    ];

    // Add hardware acceleration if enabled
    if (config.enableGPU && config.encoder !== 'cpu') {
      switch (config.encoder) {
        case 'nvenc':
          args.push('-hwaccel', 'cuda', '-hwaccel_output_format', 'cuda');
          break;
        case 'qsv':
          args.push('-hwaccel', 'qsv');
          break;
        case 'vaapi':
          args.push('-hwaccel', 'vaapi');
          break;
        case 'amf':
          args.push('-hwaccel', 'd3d11va');
          break;
      }
    }

    // Set thread count
    args.push('-threads', config.threads.toString());

    // Format-specific arguments
    if (outputFormat === 'mp3') {
      args.push(
        '-vn', // No video
        '-acodec', config.audioCodec || 'libmp3lame',
        '-ab', this.getAudioBitrate(quality),
        '-ar', '44100',
        '-ac', '2'
      );
    } else if (outputFormat === 'mp4') {
      // Video codec
      if (config.enableGPU && config.videoCodec) {
        args.push('-c:v', config.videoCodec);
      } else {
        args.push('-c:v', 'libx264', '-preset', config.preset);
      }

      // Audio codec
      args.push('-c:a', config.audioCodec || 'aac');
      
      // Quality settings
      const videoBitrate = this.getVideoBitrate(quality);
      const audioBitrate = this.getAudioBitrate(quality);
      
      args.push('-b:v', videoBitrate, '-b:a', audioBitrate);
      
      // Additional quality settings
      if (quality === 'ultra') {
        args.push('-crf', '18');
      } else if (quality === 'high') {
        args.push('-crf', '23');
      }
    } else if (outputFormat === 'wav') {
      args.push('-vn', '-acodec', 'pcm_s16le', '-ar', '44100', '-ac', '2');
    } else if (outputFormat === 'aac') {
      args.push('-vn', '-acodec', 'aac', '-ab', this.getAudioBitrate(quality));
    }

    // Output file
    args.push(outputPath);

    return args;
  }

  private getAudioBitrate(quality: QualityLevel): string {
    switch (quality) {
      case 'low': return '128k';
      case 'medium': return '192k';
      case 'high': return '256k';
      case 'ultra': return '320k';
      default: return '192k';
    }
  }

  private getVideoBitrate(quality: QualityLevel): string {
    switch (quality) {
      case 'low': return '1000k';
      case 'medium': return '2500k';
      case 'high': return '5000k';
      case 'ultra': return '8000k';
      default: return '2500k';
    }
  }

  private parseFFmpegError(errorOutput: string): string {
    // Common FFmpeg error patterns
    if (errorOutput.includes('No such file or directory')) {
      return 'Input file not found';
    } else if (errorOutput.includes('Invalid data found')) {
      return 'Invalid or corrupted input file';
    } else if (errorOutput.includes('Permission denied')) {
      return 'Permission denied - check file permissions';
    } else if (errorOutput.includes('Disk full')) {
      return 'Not enough disk space';
    } else if (errorOutput.includes('codec not currently supported')) {
      return 'Unsupported codec in input file';
    }

    // Return last meaningful line from error output
    const lines = errorOutput.trim().split('\n');
    const meaningfulLines = lines.filter(line => 
      !line.startsWith('ffmpeg version') && 
      !line.startsWith('  built') &&
      !line.startsWith('  configuration') &&
      !line.startsWith('  lib') &&
      line.trim().length > 0
    );

    return meaningfulLines.length > 0 
      ? meaningfulLines[meaningfulLines.length - 1]
      : 'Unknown conversion error';
  }

  public cancelConversion(taskId: string): void {
    const process = this.activeProcesses.get(taskId);
    if (process && !process.killed) {
      process.kill('SIGTERM');
      this.activeProcesses.delete(taskId);
      console.log(`Cancelled conversion for task: ${taskId}`);
    }
  }

  public cancelAllConversions(): void {
    for (const [taskId, process] of this.activeProcesses.entries()) {
      if (!process.killed) {
        process.kill('SIGTERM');
      }
    }
    this.activeProcesses.clear();
    console.log('Cancelled all active conversions');
  }

  public getActiveConversions(): string[] {
    return Array.from(this.activeProcesses.keys());
  }
}