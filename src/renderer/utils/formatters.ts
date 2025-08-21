import { ConversionStatus } from '../types';

/**
 * Format file size in bytes to human readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format duration in seconds to HH:MM:SS or MM:SS format
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

/**
 * Format bitrate in bps to human readable string
 */
export function formatBitrate(bitrate: number): string {
  if (!bitrate) return 'Unknown';
  
  if (bitrate >= 1000000) {
    return `${(bitrate / 1000000).toFixed(1)} Mbps`;
  } else if (bitrate >= 1000) {
    return `${(bitrate / 1000).toFixed(0)} Kbps`;
  } else {
    return `${bitrate} bps`;
  }
}

/**
 * Get color for conversion status
 */
export function getStatusColor(status: ConversionStatus): string {
  switch (status) {
    case 'pending':
      return 'default';
    case 'queued':
      return 'processing';
    case 'converting':
      return 'success';
    case 'completed':
      return 'success';
    case 'error':
      return 'error';
    case 'paused':
      return 'warning';
    case 'cancelled':
      return 'default';
    default:
      return 'default';
  }
}

/**
 * Get display text for conversion status
 */
export function getStatusText(status: ConversionStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'queued':
      return 'Queued';
    case 'converting':
      return 'Converting';
    case 'completed':
      return 'Completed';
    case 'error':
      return 'Error';
    case 'paused':
      return 'Paused';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Unknown';
  }
}

/**
 * Format conversion speed (e.g., 2.1x)
 */
export function formatSpeed(speed: number): string {
  if (!speed || speed <= 0) return '';
  return `${speed.toFixed(1)}x`;
}

/**
 * Format ETA (estimated time remaining)
 */
export function formatETA(seconds: number): string {
  if (!seconds || seconds <= 0) return '';
  
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
}

/**
 * Format percentage with optional decimal places
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Parse file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Get filename without extension
 */
export function getFilenameWithoutExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
}

/**
 * Truncate filename for display
 */
export function truncateFilename(filename: string, maxLength: number = 40): string {
  if (filename.length <= maxLength) return filename;
  
  const extension = getFileExtension(filename);
  const nameWithoutExt = getFilenameWithoutExtension(filename);
  const availableLength = maxLength - extension.length - 4; // Account for "..." and "."
  
  if (availableLength <= 0) return filename;
  
  return `${nameWithoutExt.substring(0, availableLength)}...${extension ? '.' + extension : ''}`;
}

/**
 * Format timestamp to readable date/time
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  if (diffHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

/**
 * Calculate conversion efficiency (output size / input size)
 */
export function calculateCompressionRatio(inputSize: number, outputSize: number): string {
  if (!inputSize || !outputSize) return '';
  
  const ratio = (outputSize / inputSize) * 100;
  const compression = 100 - ratio;
  
  if (compression > 0) {
    return `${compression.toFixed(1)}% smaller`;
  } else {
    return `${Math.abs(compression).toFixed(1)}% larger`;
  }
}

/**
 * Validate if file extension is supported
 */
export function isSupportedFormat(filename: string): boolean {
  const supportedFormats = [
    'mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v',
    '3gp', 'ts', 'mts', 'm2ts', 'mp3', 'wav', 'flac', 'aac',
    'ogg', 'm4a', 'wma'
  ];
  
  const extension = getFileExtension(filename);
  return supportedFormats.includes(extension);
}

/**
 * Get human readable file type description
 */
export function getFileTypeDescription(extension: string): string {
  const descriptions: Record<string, string> = {
    'mp4': 'MP4 Video',
    'avi': 'AVI Video',
    'mkv': 'Matroska Video',
    'mov': 'QuickTime Video',
    'wmv': 'Windows Media Video',
    'flv': 'Flash Video',
    'webm': 'WebM Video',
    'm4v': 'MPEG-4 Video',
    '3gp': '3GP Video',
    'ts': 'MPEG Transport Stream',
    'mts': 'AVCHD Video',
    'm2ts': 'Blu-ray Video',
    'mp3': 'MP3 Audio',
    'wav': 'WAV Audio',
    'flac': 'FLAC Audio',
    'aac': 'AAC Audio',
    'ogg': 'OGG Audio',
    'm4a': 'M4A Audio',
    'wma': 'Windows Media Audio'
  };
  
  return descriptions[extension.toLowerCase()] || `${extension.toUpperCase()} File`;
}