const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// FFmpeg download URLs for different platforms
const FFMPEG_URLS = {
  'win32-x64': {
    url: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip',
    binaries: ['ffmpeg.exe', 'ffprobe.exe']
  },
  'darwin-x64': {
    url: 'https://evermeet.cx/ffmpeg/ffmpeg-5.1.2.zip',
    binaries: ['ffmpeg']
  },
  'darwin-arm64': {
    url: 'https://evermeet.cx/ffmpeg/ffmpeg-5.1.2.zip',
    binaries: ['ffmpeg']
  },
  'linux-x64': {
    url: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz',
    binaries: ['ffmpeg', 'ffprobe']
  }
};

class FFmpegDownloader {
  constructor() {
    this.platform = os.platform();
    this.arch = os.arch();
    this.platformKey = this.getPlatformKey();
    this.resourcesDir = path.join(__dirname, '..', 'resources');
    this.ffmpegDir = path.join(this.resourcesDir, 'ffmpeg');
    this.platformDir = path.join(this.ffmpegDir, this.platformKey);
  }

  getPlatformKey() {
    const platform = this.platform;
    const arch = this.arch;

    if (platform === 'win32') {
      return arch === 'x64' ? 'win32-x64' : 'win32-ia32';
    } else if (platform === 'darwin') {
      return arch === 'arm64' ? 'darwin-arm64' : 'darwin-x64';
    } else if (platform === 'linux') {
      return arch === 'x64' ? 'linux-x64' : 'linux-ia32';
    }

    return 'linux-x64'; // Default fallback
  }

  async ensureDirectories() {
    const dirs = [this.resourcesDir, this.ffmpegDir, this.platformDir];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      }
    }
  }

  async checkExistingBinaries() {
    const config = FFMPEG_URLS[this.platformKey];
    if (!config) {
      console.log(`No FFmpeg configuration for platform: ${this.platformKey}`);
      return false;
    }

    const allExist = config.binaries.every(binary => {
      const binaryPath = path.join(this.platformDir, binary);
      return fs.existsSync(binaryPath);
    });

    if (allExist) {
      console.log('FFmpeg binaries already exist, skipping download');
      return true;
    }

    return false;
  }

  async downloadFile(url, outputPath) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      
      console.log(`Downloading: ${url}`);
      console.log(`To: ${outputPath}`);

      const request = client.get(url, (response) => {
        // Handle redirects
        if (response.statusCode === 302 || response.statusCode === 301) {
          return this.downloadFile(response.headers.location, outputPath)
            .then(resolve)
            .catch(reject);
        }

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }

        const totalSize = parseInt(response.headers['content-length'] || '0');
        let downloadedSize = 0;
        let lastProgress = 0;

        const fileStream = fs.createWriteStream(outputPath);

        response.on('data', (chunk) => {
          downloadedSize += chunk.length;
          const progress = Math.floor((downloadedSize / totalSize) * 100);
          
          if (progress > lastProgress + 5) { // Show progress every 5%
            console.log(`Download progress: ${progress}%`);
            lastProgress = progress;
          }
        });

        response.pipe(fileStream);

        fileStream.on('finish', () => {
          console.log('Download completed');
          resolve();
        });

        fileStream.on('error', (error) => {
          fs.unlinkSync(outputPath); // Clean up partial download
          reject(error);
        });
      });

      request.on('error', reject);
      request.setTimeout(300000); // 5 minute timeout
    });
  }

  async extractArchive(archivePath, extractDir) {
    const extension = path.extname(archivePath).toLowerCase();
    
    try {
      if (extension === '.zip') {
        console.log('Extracting ZIP archive...');
        // Try using unzip command
        try {
          execSync(`unzip -q "${archivePath}" -d "${extractDir}"`, { stdio: 'inherit' });
        } catch (error) {
          // Fallback: try using PowerShell on Windows
          if (this.platform === 'win32') {
            execSync(`powershell -command "Expand-Archive -Path '${archivePath}' -DestinationPath '${extractDir}'"`, { stdio: 'inherit' });
          } else {
            throw error;
          }
        }
      } else if (extension === '.xz' || archivePath.includes('.tar.xz')) {
        console.log('Extracting TAR.XZ archive...');
        execSync(`tar -xf "${archivePath}" -C "${extractDir}"`, { stdio: 'inherit' });
      } else if (extension === '.gz' || archivePath.includes('.tar.gz')) {
        console.log('Extracting TAR.GZ archive...');
        execSync(`tar -xzf "${archivePath}" -C "${extractDir}"`, { stdio: 'inherit' });
      } else {
        throw new Error(`Unsupported archive format: ${extension}`);
      }

      console.log('Extraction completed');
    } catch (error) {
      console.error('Extraction failed:', error.message);
      throw error;
    }
  }

  async findAndMoveBinaries(extractDir) {
    const config = FFMPEG_URLS[this.platformKey];
    const binariesMoved = [];

    // Recursively search for binaries
    const findBinaries = (dir, depth = 0) => {
      if (depth > 3) return; // Limit search depth

      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
          findBinaries(itemPath, depth + 1);
        } else if (config.binaries.includes(item)) {
          const targetPath = path.join(this.platformDir, item);
          
          // Copy binary to platform directory
          fs.copyFileSync(itemPath, targetPath);
          
          // Make executable on Unix systems
          if (this.platform !== 'win32') {
            fs.chmodSync(targetPath, 0o755);
          }

          console.log(`Moved binary: ${item}`);
          binariesMoved.push(item);
        }
      }
    };

    findBinaries(extractDir);

    // Verify all required binaries were found
    const missingBinaries = config.binaries.filter(binary => !binariesMoved.includes(binary));
    
    if (missingBinaries.length > 0) {
      throw new Error(`Missing binaries after extraction: ${missingBinaries.join(', ')}`);
    }

    console.log(`Successfully moved all binaries: ${binariesMoved.join(', ')}`);
  }

  async downloadAndInstall() {
    const config = FFMPEG_URLS[this.platformKey];
    
    if (!config) {
      console.log(`FFmpeg not available for platform: ${this.platformKey}`);
      return;
    }

    await this.ensureDirectories();

    // Check if binaries already exist
    if (await this.checkExistingBinaries()) {
      return;
    }

    const tempDir = path.join(os.tmpdir(), 'ffmpeg-download');
    const archiveUrl = config.url;
    const archiveName = path.basename(archiveUrl.split('?')[0]); // Remove query parameters
    const archivePath = path.join(tempDir, archiveName);
    const extractDir = path.join(tempDir, 'extracted');

    try {
      // Create temp directory
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
      fs.mkdirSync(tempDir, { recursive: true });
      fs.mkdirSync(extractDir, { recursive: true });

      // Download archive
      await this.downloadFile(archiveUrl, archivePath);

      // Extract archive
      await this.extractArchive(archivePath, extractDir);

      // Find and move binaries
      await this.findAndMoveBinaries(extractDir);

      console.log('FFmpeg installation completed successfully!');

    } catch (error) {
      console.error('FFmpeg installation failed:', error);
      throw error;
    } finally {
      // Clean up temp directory
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  }

  async createLicenseFiles() {
    const licensePath = path.join(this.platformDir, 'LICENSE.txt');
    const licenseContent = `
FFmpeg License Information
==========================

This application includes FFmpeg binaries, which are licensed under the GPL v2.1 or later.

FFmpeg is a free software project that produces libraries and programs for handling multimedia data.

For more information about FFmpeg licensing, visit:
https://www.ffmpeg.org/legal.html

Source code for FFmpeg is available at:
https://github.com/FFmpeg/FFmpeg

GPL License text is available at:
https://www.gnu.org/licenses/gpl-2.1.html
`.trim();

    fs.writeFileSync(licensePath, licenseContent);
    console.log('Created license file');
  }
}

// Main execution
async function main() {
  console.log('Starting FFmpeg download and installation...');
  
  const downloader = new FFmpegDownloader();
  
  try {
    await downloader.downloadAndInstall();
    await downloader.createLicenseFiles();
    console.log('✅ FFmpeg setup completed successfully!');
  } catch (error) {
    console.error('❌ FFmpeg setup failed:', error);
    
    // Don't fail the build, just warn
    console.warn('⚠️  The application will attempt to use system FFmpeg if available');
  }
}

// Only run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = FFmpegDownloader;