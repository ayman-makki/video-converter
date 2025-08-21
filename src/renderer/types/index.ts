// File and media types
export interface VideoInfo {
  duration: number;
  format: string;
  size: number;
  resolution: {
    width: number;
    height: number;
  };
  bitrate: number;
  fps: number;
  hasAudio: boolean;
  hasVideo: boolean;
  codec: {
    video?: string;
    audio?: string;
  };
}

// Conversion task types
export type ConversionStatus = 
  | 'pending' 
  | 'queued' 
  | 'converting' 
  | 'completed' 
  | 'error' 
  | 'paused' 
  | 'cancelled';

export type OutputFormat = 'mp3' | 'mp4' | 'wav' | 'aac';

export type QualityLevel = 'low' | 'medium' | 'high' | 'ultra';

export interface ConversionTask {
  id: string;
  inputFile: string;
  outputFile: string;
  outputFormat: OutputFormat;
  quality: QualityLevel;
  status: ConversionStatus;
  progress: number;
  speed?: number; // conversion speed multiplier (e.g., 2.1x)
  eta?: string; // estimated time remaining
  error?: string;
  fileInfo?: VideoInfo;
  startTime?: number;
  endTime?: number;
}

export interface ConversionProgress {
  taskId: string;
  status: ConversionStatus;
  progress: number; // 0-100
  speed?: number;
  eta?: string;
  currentTime?: number;
  totalTime?: number;
  error?: string;
}

// Hardware information
export interface HardwareInfo {
  cpu: {
    cores: number;
    threads: number;
    model: string;
    speed: number;
  };
  gpu: {
    nvidia?: {
      available: boolean;
      model?: string;
      memory?: number;
    };
    amd?: {
      available: boolean;
      model?: string;
      memory?: number;
    };
    intel?: {
      available: boolean;
      model?: string;
    };
  };
  memory: {
    total: number;
    available: number;
  };
  platform: string;
}

// Application settings
export interface AppSettings {
  outputDirectory: string;
  concurrentJobs: number;
  gpuAcceleration: boolean;
  autoDetectHardware: boolean;
  outputFormat: OutputFormat;
  audioQuality: QualityLevel;
  videoQuality: QualityLevel;
  preserveMetadata: boolean;
  autoStartConversion: boolean;
  notifications: boolean;
}

// FFmpeg configuration
export interface FFmpegConfig {
  preset: string;
  threads: number;
  enableGPU: boolean;
  encoder: 'cpu' | 'nvenc' | 'qsv' | 'vaapi' | 'amf';
  bufferSize: string;
  audioCodec?: string;
  videoCodec?: string;
  audioBitrate?: string;
  videoBitrate?: string;
}

// Quality presets
export interface QualityPreset {
  name: string;
  label: string;
  audio: {
    bitrate: string;
    codec: string;
    sampleRate?: number;
  };
  video?: {
    bitrate: string;
    codec: string;
    preset: string;
    crf?: number;
  };
}

// System performance metrics
export interface PerformanceMetrics {
  cpuUsage: number;
  gpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  temperature?: {
    cpu?: number;
    gpu?: number;
  };
}

// Conversion statistics
export interface ConversionStats {
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  totalTime: number;
  averageSpeed: number;
  totalInputSize: number;
  totalOutputSize: number;
}

// Batch operation types
export interface BatchOperation {
  id: string;
  name: string;
  tasks: ConversionTask[];
  status: ConversionStatus;
  progress: number;
  startTime?: number;
  endTime?: number;
}

// Error types
export interface ConversionError {
  code: string;
  message: string;
  details?: any;
  taskId?: string;
  timestamp: number;
}

// File validation result
export interface ValidationResult {
  valid: boolean;
  format?: string;
  issues?: string[];
  warnings?: string[];
}

// Export all commonly used types
export type {
  ConversionTask as Task,
  ConversionProgress as Progress,
  HardwareInfo as Hardware,
  AppSettings as Settings,
  VideoInfo as MediaInfo
};