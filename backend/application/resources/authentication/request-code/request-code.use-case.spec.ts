import { beforeEach, describe, expect, it, vi } from 'vitest';

import UserInMemoryRepository from '@application/repositories/user/user-in-memory.repository';
import ValidationTokenInMemoryRepository from '@application/repositories/validation-token/validation-token-in-memory.repository';

import RequestCodeUseCase from './request-code.use-case';

let userInMemoryRepository: UserInMemoryRepository;
let validationTokenInMemoryRepository: ValidationTokenInMemoryRepository;
let sut: RequestCodeUseCase;

describe('Request Code Use Case', () => {
  beforeEach(() => {
    userInMemoryRepository = new UserInMemoryRepository();
    validationTokenInMemoryRepository = new ValidationTokenInMemoryRepository();
    sut = new RequestCodeUseCase(
      userInMemoryRepository,
      validationTokenInMemoryRepository,
    );
  });

  it('deve criar codigo de validacao com sucesso', async () => {
    await userInMemoryRepository.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password',
      group: 'group-id',
    });

    const result = await sut.execute({ email: 'john@example.com' });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value).toBeNull();
    }
  });

  it('deve retornar erro EMAIL_NOT_FOUND quando email nao existir', async () => {
    const result = await sut.execute({ email: 'nonexistent@example.com' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(404);
      expect(result.value.cause).toBe('EMAIL_NOT_FOUND');
    }
  });

  it('deve retornar erro REQUEST_CODE_ERROR quando houver falha', async () => {
    vi.spyOn(userInMemoryRepository, 'findBy').mockRejectedValueOnce(
      new Error('Database error'),
    );

    const result = await sut.execute({ email: 'john@example.com' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('REQUEST_CODE_ERROR');
    }
  });
});
