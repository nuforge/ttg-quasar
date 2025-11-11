/**
 * Image Storage Service
 *
 * Handles uploading, downloading, and managing game images in Firebase Storage
 */

import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from 'firebase/storage';
import { storage } from 'src/boot/firebase';

export interface ImageUploadResult {
  downloadURL: string;
  path: string;
  filename: string;
}

export interface ImageMigrationStatus {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  errors: Array<{ filename: string; error: string }>;
}

class ImageStorageService {
  private readonly GAMES_FOLDER = 'games';
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  /**
   * Upload a game image file to Firebase Storage
   */
  async uploadGameImage(file: File, gameId: string): Promise<ImageUploadResult> {
    // Validate file
    this.validateImageFile(file);

    const filename = this.generateImageFilename(file.name, gameId);
    const imagePath = `${this.GAMES_FOLDER}/${filename}`;
    const imageRef = storageRef(storage, imagePath);

    try {
      // Upload file
      const snapshot = await uploadBytes(imageRef, file);

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      return {
        downloadURL,
        path: imagePath,
        filename,
      };
    } catch (error) {
      throw new Error(
        `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Upload image from URL (for migration)
   */
  async uploadGameImageFromUrl(
    imageUrl: string,
    gameId: string,
    originalFilename?: string,
  ): Promise<ImageUploadResult> {
    try {
      // Fetch image from URL
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      // Get content type and validate
      const contentType = response.headers.get('content-type');
      if (!contentType || !this.ALLOWED_TYPES.includes(contentType)) {
        throw new Error(`Unsupported image type: ${contentType}`);
      }

      // Convert to blob
      const blob = await response.blob();

      // Check file size
      if (blob.size > this.MAX_FILE_SIZE) {
        throw new Error(`Image too large: ${blob.size} bytes`);
      }

      const filename = this.generateImageFilename(originalFilename || 'image', gameId);
      const imagePath = `${this.GAMES_FOLDER}/${filename}`;
      const imageRef = storageRef(storage, imagePath);

      // Upload blob
      const snapshot = await uploadBytes(imageRef, blob, {
        contentType,
      });

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      return {
        downloadURL,
        path: imagePath,
        filename,
      };
    } catch (error) {
      throw new Error(
        `Failed to upload image from URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Delete a game image from Firebase Storage
   */
  async deleteGameImage(imagePath: string): Promise<void> {
    try {
      const imageRef = storageRef(storage, imagePath);
      await deleteObject(imageRef);
    } catch (error) {
      throw new Error(
        `Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get download URL for an existing image
   */
  async getImageUrl(imagePath: string): Promise<string> {
    try {
      const imageRef = storageRef(storage, imagePath);
      return await getDownloadURL(imageRef);
    } catch (error) {
      throw new Error(
        `Failed to get image URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Migrate local images to Firebase Storage
   */
  async migrateLocalImages(
    localImageMap: Record<string, string>, // gameId -> local image filename
    progressCallback?: (status: ImageMigrationStatus) => void,
  ): Promise<ImageMigrationStatus> {
    const games = Object.entries(localImageMap);
    const status: ImageMigrationStatus = {
      total: games.length,
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [],
    };

    for (const [gameId, imageFilename] of games) {
      try {
        // Construct local image URL (assuming they're in public/images/games/)
        const localImageUrl = `/images/games/${imageFilename}`;

        // Upload to Firebase Storage
        await this.uploadGameImageFromUrl(localImageUrl, gameId, imageFilename);

        status.successful++;
      } catch (error) {
        status.failed++;
        status.errors.push({
          filename: imageFilename,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      status.processed++;

      // Call progress callback if provided
      if (progressCallback) {
        progressCallback({ ...status });
      }
    }

    return status;
  }

  /**
   * List all game images in storage
   */
  async listGameImages(): Promise<string[]> {
    try {
      const gamesRef = storageRef(storage, this.GAMES_FOLDER);
      const result = await listAll(gamesRef);
      return result.items.map((item) => item.fullPath);
    } catch (error) {
      throw new Error(
        `Failed to list images: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Test Firebase Storage connectivity and permissions
   */
  async testStorageConnectivity(): Promise<{ success: boolean; error?: string }> {
    try {
      // Try to list files in the games folder to test connectivity
      const gamesRef = storageRef(storage, this.GAMES_FOLDER);
      await listAll(gamesRef);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Storage connectivity test failed:', errorMessage);

      // Check for common Storage errors
      if (errorMessage.includes('storage/unauthorized')) {
        return {
          success: false,
          error: 'Firebase Storage access denied. Check Firebase Storage rules.',
        };
      } else if (errorMessage.includes('storage/bucket-not-found')) {
        return {
          success: false,
          error: 'Firebase Storage bucket not found. Check VITE_FIREBASE_STORAGE_BUCKET in .env file.',
        };
      } else if (errorMessage.includes('network')) {
        return {
          success: false,
          error: 'Network error accessing Firebase Storage. Check internet connection.',
        };
      } else {
        return {
          success: false,
          error: `Storage error: ${errorMessage}`,
        };
      }
    }
  }

  /**
   * Validate image file
   */
  private validateImageFile(file: File): void {
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error(
        `Unsupported file type: ${file.type}. Allowed: ${this.ALLOWED_TYPES.join(', ')}`,
      );
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File too large: ${file.size} bytes. Maximum: ${this.MAX_FILE_SIZE} bytes`);
    }
  }

  /**
   * Generate a unique filename for an image
   */
  private generateImageFilename(originalName: string, gameId: string): string {
    const timestamp = Date.now();
    const extension = this.getFileExtension(originalName);
    return `${gameId}_${timestamp}.${extension}`;
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    if (parts.length > 1) {
      const extension = parts[parts.length - 1];
      return extension ? extension.toLowerCase() : 'jpg';
    }
    return 'jpg';
  }
}

// Export singleton instance
export const imageStorageService = new ImageStorageService();
