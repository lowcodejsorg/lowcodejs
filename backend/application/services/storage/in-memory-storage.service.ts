import type { MultipartFile } from '@fastify/multipart';

import type { StorageUploadResponse } from './storage-contract.service';
import { StorageContractService } from './storage-contract.service';

export default class InMemoryStorageService extends StorageContractService {
  private files: Map<string, StorageUploadResponse> = new Map();

  async upload(
    part: MultipartFile,
    staticName?: string,
  ): Promise<StorageUploadResponse> {
    const name =
      staticName ?? Math.floor(Math.random() * 100000000)?.toString();
    const originalExt = part.filename?.split('.').pop() ?? 'bin';
    const filename = `${name}.${originalExt}`;

    const result: StorageUploadResponse = {
      filename,
      mimetype: part.mimetype,
      originalName: part.filename,
      size: 0,
    };

    this.files.set(filename, result);
    return result;
  }

  async delete(filename: string): Promise<boolean> {
    return this.files.delete(filename);
  }

  async exists(filename: string): Promise<boolean> {
    return this.files.has(filename);
  }

  async ensureBucket(): Promise<void> {
    // noop para testes
  }
}
