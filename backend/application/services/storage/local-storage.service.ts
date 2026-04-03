import type { MultipartFile } from '@fastify/multipart';
import { Service } from 'fastify-decorators';
import { existsSync } from 'node:fs';
import { access, mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { getLocalStoragePath } from '@config/storage.config';

import { processFile } from './process-file';
import type { StorageUploadResponse } from './storage-contract.service';
import { StorageContractService } from './storage-contract.service';

@Service()
export default class LocalStorageService extends StorageContractService {
  async ensureBucket(): Promise<void> {
    const storagePath = getLocalStoragePath();
    if (!existsSync(storagePath)) {
      await mkdir(storagePath, { recursive: true });
    }
  }

  async upload(
    part: MultipartFile,
    staticName?: string,
  ): Promise<StorageUploadResponse> {
    await this.ensureBucket();

    const file = await processFile(part, staticName);

    await writeFile(join(getLocalStoragePath(), file.filename), file.buffer);

    return {
      filename: file.filename,
      mimetype: file.mimetype,
      originalName: file.originalName,
      size: file.size,
    };
  }

  async delete(filename: string): Promise<boolean> {
    try {
      await unlink(join(getLocalStoragePath(), filename));
      return true;
    } catch (error) {
      console.error('[Storage Local] Erro ao deletar arquivo:', error);
      return false;
    }
  }

  async exists(filename: string): Promise<boolean> {
    try {
      await access(join(getLocalStoragePath(), filename));
      return true;
    } catch {
      return false;
    }
  }
}
