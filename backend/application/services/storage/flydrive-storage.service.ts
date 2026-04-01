import type { MultipartFile } from '@fastify/multipart';
import { Service } from 'fastify-decorators';
import { Readable } from 'node:stream';
import sharp from 'sharp';

import { drive } from '@config/storage.config';

import type { StorageUploadResponse } from './storage-contract.service';
import { StorageContractService } from './storage-contract.service';

@Service()
export default class FlyDriveStorageService extends StorageContractService {
  private readonly IMAGE_MIMETYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/tiff',
  ];

  private get disk(): ReturnType<typeof drive.use> {
    const driver = (process.env.STORAGE_DRIVER as 'local' | 's3') || 'local';
    return drive.use(driver);
  }

  private isProcessableImage(mimetype: string): boolean {
    return this.IMAGE_MIMETYPES.includes(mimetype);
  }

  async upload(
    part: MultipartFile,
    staticName?: string,
  ): Promise<StorageUploadResponse> {
    const name =
      staticName ?? Math.floor(Math.random() * 100000000)?.toString();
    const originalExt = part.filename?.split('.').pop();
    const buffer = await part.toBuffer();

    let finalBuffer: Buffer;
    let finalExt: string;
    let finalMimetype: string;

    if (this.isProcessableImage(part.mimetype)) {
      finalBuffer = await sharp(buffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      finalExt = 'webp';
      finalMimetype = 'image/webp';
    } else {
      finalBuffer = buffer;
      finalExt = originalExt!;
      finalMimetype = part.mimetype;
    }

    const filename = name.concat('.').concat(finalExt);

    const stream = Readable.from(finalBuffer);

    await this.disk.putStream(filename, stream, {
      contentType: finalMimetype,
      contentLength: finalBuffer.length,
    });

    return {
      filename,
      mimetype: finalMimetype,
      originalName: part.filename,
      size: finalBuffer.length,
    };
  }

  async delete(filename: string): Promise<boolean> {
    try {
      await this.disk.delete(filename);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  async exists(filename: string): Promise<boolean> {
    return this.disk.exists(filename);
  }
}
