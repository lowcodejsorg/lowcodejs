import type { MultipartFile } from '@fastify/multipart';
import { Service } from 'fastify-decorators';

import { getStorageDriver } from '@config/storage.config';

import LocalStorageService from './local-storage.service';
import S3StorageService from './s3-storage.service';
import type { StorageUploadResponse } from './storage-contract.service';
import { StorageContractService } from './storage-contract.service';

@Service()
export default class StorageService extends StorageContractService {
  private readonly local = new LocalStorageService();
  private readonly s3 = new S3StorageService();

  private get impl(): StorageContractService {
    return getStorageDriver() === 's3' ? this.s3 : this.local;
  }

  async upload(
    part: MultipartFile,
    staticName?: string,
  ): Promise<StorageUploadResponse> {
    return this.impl.upload(part, staticName);
  }

  async delete(filename: string): Promise<boolean> {
    return this.impl.delete(filename);
  }

  async exists(filename: string): Promise<boolean> {
    return this.impl.exists(filename);
  }

  async ensureBucket(): Promise<void> {
    return this.impl.ensureBucket();
  }
}
