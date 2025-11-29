const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);

class VideoEncoder {
  constructor() {
    this.videosDir = path.join(__dirname, '../../videos');
    this.uploadsDir = path.join(this.videosDir, 'uploads');
    this.hlsDir = path.join(this.videosDir, 'hls');
    this.thumbnailsDir = path.join(this.videosDir, 'thumbnails');
  }

  /**
   * Convert video to HLS format
   */
  async encodeToHLS(inputPath, outputId, onProgress) {
    try {
      const outputDir = path.join(this.hlsDir, outputId);
      await mkdir(outputDir, { recursive: true });

      const outputPath = path.join(outputDir, 'playlist.m3u8');
      
      return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .outputOptions([
            '-codec: copy',
            '-start_number 0',
            '-hls_time 10',
            '-hls_list_size 0',
            '-f hls',
            '-hls_segment_filename ' + path.join(outputDir, 'segment%d.ts')
          ])
          .output(outputPath)
          .on('start', (commandLine) => {
            console.log('FFmpeg started:', commandLine);
          })
          .on('progress', (progress) => {
            if (onProgress && progress.percent) {
              onProgress(Math.round(progress.percent));
            }
          })
          .on('end', () => {
            console.log('HLS encoding completed for:', outputId);
            resolve({
              success: true,
              hlsPath: `/videos/hls/${outputId}/playlist.m3u8`,
              localPath: outputPath
            });
          })
          .on('error', (err) => {
            console.error('FFmpeg error:', err);
            reject(err);
          })
          .run();
      });
    } catch (error) {
      console.error('Encoding error:', error);
      throw error;
    }
  }

  /**
   * Generate thumbnail from video
   */
  async generateThumbnail(inputPath, outputId) {
    try {
      const thumbnailPath = path.join(this.thumbnailsDir, `${outputId}.jpg`);

      return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .screenshots({
            timestamps: ['10%'],
            filename: `${outputId}.jpg`,
            folder: this.thumbnailsDir,
            size: '1280x720'
          })
          .on('end', () => {
            console.log('Thumbnail generated:', thumbnailPath);
            resolve(`/videos/thumbnails/${outputId}.jpg`);
          })
          .on('error', (err) => {
            console.error('Thumbnail error:', err);
            reject(err);
          });
      });
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      throw error;
    }
  }

  /**
   * Get video metadata
   */
  async getMetadata(inputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          console.error('Metadata error:', err);
          return reject(err);
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        
        resolve({
          duration: metadata.format.duration || 0,
          resolution: videoStream ? `${videoStream.width}x${videoStream.height}` : '',
          bitrate: metadata.format.bit_rate || 0,
          size: metadata.format.size || 0
        });
      });
    });
  }

  /**
   * Delete video files
   */
  async deleteVideo(hlsPath, thumbnailPath, originalPath) {
    try {
      // Delete HLS directory
      if (hlsPath) {
        const hlsDir = path.join(this.videosDir, hlsPath.replace('/videos/', ''));
        const dir = path.dirname(hlsDir);
        if (fs.existsSync(dir)) {
          fs.rmSync(dir, { recursive: true, force: true });
        }
      }

      // Delete thumbnail
      if (thumbnailPath) {
        const thumbPath = path.join(this.videosDir, thumbnailPath.replace('/videos/', ''));
        if (fs.existsSync(thumbPath)) {
          await unlink(thumbPath);
        }
      }

      // Delete original
      if (originalPath && fs.existsSync(originalPath)) {
        await unlink(originalPath);
      }

      return { success: true };
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  }
}

module.exports = new VideoEncoder();
