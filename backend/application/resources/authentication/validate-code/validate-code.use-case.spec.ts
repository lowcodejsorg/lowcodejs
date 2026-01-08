import { subMinutes } from 'date-fns';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { E_TOKEN_STATUS } from '@application/core/entity.core';
import ValidationTokenInMemoryRepository from '@application/repositories/validation-token/validation-token-in-memory.repository';

import ValidateCodeUseCase from './validate-code.use-case';

let validationTokenInMemoryRepository: ValidationTokenInMemoryRepository;
let sut: ValidateCodeUseCase;

describe('Validate Code Use Case', () => {
  beforeEach(() => {
    validationTokenInMemoryRepository = new ValidationTokenInMemoryRepository();
    sut = new ValidateCodeUseCase(validationTokenInMemoryRepository);
  });

  it('deve validar codigo com sucesso', async () => {
    await validationTokenInMemoryRepository.create({
      code: '123456',
      status: E_TOKEN_STATUS.REQUESTED,
      user: 'user-id',
    });

    const result = await sut.execute({ code: '123456' });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.user._id).toBe('user-id');
    }
  });

  it('deve retornar erro VALIDATION_TOKEN_NOT_FOUND quando codigo nao existir', async () => {
    const result = await sut.execute({ code: 'invalid-code' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(404);
      expect(result.value.cause).toBe('VALIDATION_TOKEN_NOT_FOUND');
    }
  });

  it('deve retornar erro CODE_EXPIRED quando token ja estiver expirado', async () => {
    await validationTokenInMemoryRepository.create({
      code: '123456',
      status: E_TOKEN_STATUS.EXPIRED,
      user: 'user-id',
    });

    const result = await sut.execute({ code: '123456' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(410);
      expect(result.value.cause).toBe('CODE_EXPIRED');
    }
  });

  it('deve retornar erro VALIDATION_TOKEN_EXPIRED quando codigo tiver mais de 10 minutos', async () => {
    const token = await validationTokenInMemoryRepository.create({
      code: '123456',
      status: E_TOKEN_STATUS.REQUESTED,
      user: 'user-id',
    });

    // Simular token criado há 15 minutos
    Object.assign(token, { createdAt: subMinutes(new Date(), 15) });

    const result = await sut.execute({ code: '123456' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(410);
      expect(result.value.cause).toBe('VALIDATION_TOKEN_EXPIRED');
    }
  });

  it('deve retornar erro VALIDATE_CODE_ERROR quando houver falha', async () => {
    vi.spyOn(validationTokenInMemoryRepository, 'findBy').mockRejectedValueOnce(
      new Error('Database error'),
    );

    const result = await sut.execute({ code: '123456' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('VALIDATE_CODE_ERROR');
    }
  });
});
