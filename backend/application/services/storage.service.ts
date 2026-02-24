import type { MultipartFile } from '@fastify/multipart';
import { Service } from 'fastify-decorators';
import { access, mkdir, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

import type { IStorage, Optional } from '@application/core/entity.core';
import { Env } from '@start/env';

type Response = Optional<
  IStorage,
  '_id' | 'createdAt' | 'updatedAt' | 'trashedAt' | 'trashed'
>;

@Service()
export default class LocalStorageService {
  private readonly storagePath = join(process.cwd(), '_storage');
  private readonly baseUrl = Env.APP_SERVER_URL;

  private readonly IMAGE_MIMETYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/tiff',
  ];

  private isProcessableImage(mimetype: string): boolean {
    return this.IMAGE_MIMETYPES.includes(mimetype);
  }

  async ensureStorageExists(): Promise<void> {
    try {
      await access(this.storagePath);
    } catch {
      await mkdir(this.storagePath, { recursive: true });
    }
  }

  async upload(part: MultipartFile, staticName?: string): Promise<Response> {
    await this.ensureStorageExists();

    const name = staticName ?? Math.floor(Math.random() * 100000000)?.toString();
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
    const filePath = resolve(this.storagePath, filename);

    await writeFile(filePath, finalBuffer);

    return {
      filename,
      mimetype: finalMimetype,
      url: this.baseUrl.concat('/storage/').concat(filename),
      originalName: part.filename,
      size: finalBuffer.length,
    };
  }

  async delete(filename: string): Promise<boolean> {
    try {
      const filePath = resolve(this.storagePath, filename);
      await unlink(filePath);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  async exists(filename: string): Promise<boolean> {
    try {
      const filePath = resolve(this.storagePath, filename);
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
