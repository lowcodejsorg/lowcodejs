/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import StorageInMemoryRepository from '@application/repositories/storage/storage-in-memory.repository';
import StorageService from '@application/services/storage.service';

import StorageUploadUseCase from './upload.use-case';

let storageInMemoryRepository: StorageInMemoryRepository;
let storageService: StorageService;
let sut: StorageUploadUseCase;

describe('Storage Upload Use Case', () => {
  beforeEach(() => {
    storageInMemoryRepository = new StorageInMemoryRepository();
    storageService = {
      upload: vi.fn().mockResolvedValue({
        filename: 'random-name.jpg',
        originalName: 'test.jpg',
        url: '/uploads/random-name.jpg',
        size: 1024,
        type: 'image/jpeg',
      }),
      delete: vi.fn(),
    } as unknown as StorageService;
    sut = new StorageUploadUseCase(storageInMemoryRepository, storageService);
  });

  it('deve fazer upload de arquivos com sucesso', async () => {
    const mockFiles = async function* () {
      yield { filename: 'test.jpg' } as any;
    };

    const result = await sut.execute(mockFiles());

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0].filename).toBe('random-name.jpg');
    }
  });

  it('deve fazer upload de multiplos arquivos', async () => {
    const mockFiles = async function* () {
      yield { filename: 'test1.jpg' } as any;
      yield { filename: 'test2.jpg' } as any;
    };

    const result = await sut.execute(mockFiles());

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value).toHaveLength(2);
    }
  });

  it('deve retornar lista vazia quando nao houver arquivos', async () => {
    const mockFiles = async function* () {
      // sem arquivos
    };

    const result = await sut.execute(mockFiles());

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value).toHaveLength(0);
    }
  });

  it('deve retornar erro STORAGE_UPLOAD_ERROR quando houver falha', async () => {
    vi.spyOn(storageService, 'upload').mockRejectedValueOnce(
      new Error('Upload error'),
    );

    const mockFiles = async function* () {
      yield { filename: 'test.jpg' } as any;
    };

    const result = await sut.execute(mockFiles());

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('STORAGE_UPLOAD_ERROR');
    }
  });
});
