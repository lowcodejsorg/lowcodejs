import { beforeEach, describe, expect, it, vi } from 'vitest';

import StorageInMemoryRepository from '@application/repositories/storage/storage-in-memory.repository';
import StorageService from '@application/services/storage.service';

import StorageDeleteUseCase from './delete.use-case';

let storageInMemoryRepository: StorageInMemoryRepository;
let storageService: StorageService;
let sut: StorageDeleteUseCase;

describe('Storage Delete Use Case', () => {
  beforeEach(() => {
    storageInMemoryRepository = new StorageInMemoryRepository();
    storageService = {
      upload: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
    } as unknown as StorageService;
    sut = new StorageDeleteUseCase(storageInMemoryRepository, storageService);
  });

  it('deve deletar arquivo com sucesso', async () => {
    const storage = await storageInMemoryRepository.create({
      filename: 'random-name.jpg',
      originalName: 'test.jpg',
      url: '/uploads/random-name.jpg',
      size: 1024,
      type: 'image/jpeg',
    });

    const result = await sut.execute({ _id: storage._id });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value).toBeNull();
    }
  });

  it('deve retornar erro STORAGE_NOT_FOUND quando arquivo nao existir', async () => {
    const result = await sut.execute({ _id: 'non-existent-id' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(404);
      expect(result.value.cause).toBe('STORAGE_NOT_FOUND');
    }
  });

  it('deve retornar erro STORAGE_DELETE_ERROR quando houver falha', async () => {
    vi.spyOn(storageInMemoryRepository, 'delete').mockRejectedValueOnce(
      new Error('Database error'),
    );

    const result = await sut.execute({ _id: 'some-id' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('STORAGE_DELETE_ERROR');
    }
  });
});
