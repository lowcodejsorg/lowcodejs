import type { MultipartFile } from '@fastify/multipart';
import { Service } from 'fastify-decorators';
import { access, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import type { Optional, Storage } from '@core/entity.core';
import { Env } from '@start/env';

type Response = Optional<
  Storage,
  '_id' | 'createdAt' | 'updatedAt' | 'trashedAt' | 'trashed'
>;
@Service()
export default class StorageService {
  private readonly storagePath = join(process.cwd(), '_storage');

  private readonly baseUrl = Env.APP_SERVER_URL || 'http://localhost:3000';

  async upload(part: MultipartFile): Promise<Response> {
    const name = Math.floor(Math.random() * 100000000)?.toString();
    const ext = part.filename?.split('.').pop();
    const filename = name.concat('.').concat(ext!);

    const filePath = resolve(this.storagePath, filename);

    const buffer = await part.toBuffer();
    await writeFile(filePath, buffer);

    return {
      filename,
      type: part.mimetype,
      url: this.baseUrl.concat('/storage/').concat(filename),
      originalName: part.filename,
      size: buffer.length ?? part.file.bytesRead,
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
