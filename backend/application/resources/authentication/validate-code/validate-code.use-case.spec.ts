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
    const findByCodeSpy = vi.spyOn(
      validationTokenInMemoryRepository,
      'findByCode',
    );
    const updateSpy = vi.spyOn(validationTokenInMemoryRepository, 'update');

    await validationTokenInMemoryRepository.create({
      code: '123456',
      status: E_TOKEN_STATUS.REQUESTED,
      user: 'user-id',
    });

    const result = await sut.execute({ code: '123456' });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.user._id).toBe('user-id');

    expect(findByCodeSpy).toHaveBeenCalledTimes(1);
    expect(findByCodeSpy).toHaveBeenCalledWith('123456');
    expect(updateSpy).toHaveBeenCalledTimes(1);
  });

  it('deve marcar token como VALIDATED apos validacao bem-sucedida', async () => {
    const updateSpy = vi.spyOn(validationTokenInMemoryRepository, 'update');

    const token = await validationTokenInMemoryRepository.create({
      code: '123456',
      status: E_TOKEN_STATUS.REQUESTED,
      user: 'user-id',
    });

    await sut.execute({ code: '123456' });

    expect(updateSpy).toHaveBeenCalledWith({
      _id: token._id,
      status: E_TOKEN_STATUS.VALIDATED,
    });
  });

  it('deve retornar erro VALIDATION_TOKEN_NOT_FOUND quando codigo nao existir', async () => {
    const findByCodeSpy = vi.spyOn(
      validationTokenInMemoryRepository,
      'findByCode',
    );

    const result = await sut.execute({ code: 'invalid-code' });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(404);
    expect(result.value.cause).toBe('VALIDATION_TOKEN_NOT_FOUND');
    expect(result.value.message).toBe('Token de validação não encontrado');

    expect(findByCodeSpy).toHaveBeenCalledTimes(1);
    expect(findByCodeSpy).toHaveBeenCalledWith('invalid-code');
  });

  it('deve retornar erro VALIDATION_TOKEN_EXPIRED quando token ja estiver expirado', async () => {
    await validationTokenInMemoryRepository.create({
      code: '123456',
      status: E_TOKEN_STATUS.EXPIRED,
      user: 'user-id',
    });

    const result = await sut.execute({ code: '123456' });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(410);
    expect(result.value.cause).toBe('VALIDATION_TOKEN_EXPIRED');
    expect(result.value.message).toBe('Código expirado');
  });

  it('deve retornar erro VALIDATION_TOKEN_EXPIRED quando codigo tiver mais de 10 minutos', async () => {
    const updateSpy = vi.spyOn(validationTokenInMemoryRepository, 'update');

    const token = await validationTokenInMemoryRepository.create({
      code: '123456',
      status: E_TOKEN_STATUS.REQUESTED,
      user: 'user-id',
    });

    // Simular token criado ha 15 minutos
    Object.assign(token, { createdAt: subMinutes(new Date(), 15) });

    const result = await sut.execute({ code: '123456' });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(410);
    expect(result.value.cause).toBe('VALIDATION_TOKEN_EXPIRED');
    expect(result.value.message).toBe('Código expirado');

    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy).toHaveBeenCalledWith({
      _id: token._id,
      status: E_TOKEN_STATUS.EXPIRED,
    });
  });

  it('nao deve chamar update quando token nao e encontrado', async () => {
    const updateSpy = vi.spyOn(validationTokenInMemoryRepository, 'update');

    await sut.execute({ code: 'invalid-code' });

    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('deve retornar erro VALIDATE_CODE_ERROR quando houver falha', async () => {
    const findByCodeSpy = vi
      .spyOn(validationTokenInMemoryRepository, 'findByCode')
      .mockRejectedValueOnce(new Error('Database error'));

    const result = await sut.execute({ code: '123456' });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(500);
    expect(result.value.cause).toBe('VALIDATE_CODE_ERROR');
    expect(result.value.message).toBe('Erro interno do servidor');

    expect(findByCodeSpy).toHaveBeenCalledTimes(1);
  });
});
