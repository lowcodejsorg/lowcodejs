import { subMinutes } from 'date-fns';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { E_TOKEN_STATUS, E_USER_STATUS } from '@application/core/entity.core';
import UserInMemoryRepository from '@application/repositories/user/user-in-memory.repository';
import ValidationTokenInMemoryRepository from '@application/repositories/validation-token/validation-token-in-memory.repository';

import MagicLinkUseCase from './magic-link.use-case';

let userInMemoryRepository: UserInMemoryRepository;
let validationTokenInMemoryRepository: ValidationTokenInMemoryRepository;
let sut: MagicLinkUseCase;

describe('Magic Link Use Case', () => {
  beforeEach(() => {
    userInMemoryRepository = new UserInMemoryRepository();
    validationTokenInMemoryRepository = new ValidationTokenInMemoryRepository();
    sut = new MagicLinkUseCase(
      userInMemoryRepository,
      validationTokenInMemoryRepository,
    );
  });

  it('deve autenticar usuario via magic link com sucesso', async () => {
    const user = await userInMemoryRepository.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password',
      group: 'group-id',
    });

    await validationTokenInMemoryRepository.create({
      code: 'magic-link-code',
      status: E_TOKEN_STATUS.REQUESTED,
      user: user._id,
    });

    const result = await sut.execute({ code: 'magic-link-code' });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.email).toBe('john@example.com');
    }
  });

  it('deve ativar usuario inativo ao usar magic link', async () => {
    const user = await userInMemoryRepository.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password',
      group: 'group-id',
    });

    await userInMemoryRepository.update({
      _id: user._id,
      status: E_USER_STATUS.INACTIVE,
    });

    await validationTokenInMemoryRepository.create({
      code: 'magic-link-code',
      status: E_TOKEN_STATUS.REQUESTED,
      user: user._id,
    });

    const result = await sut.execute({ code: 'magic-link-code' });

    expect(result.isRight()).toBe(true);
  });

  it('deve retornar erro VALIDATION_TOKEN_NOT_FOUND quando codigo nao existir', async () => {
    const result = await sut.execute({ code: 'invalid-code' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(404);
      expect(result.value.cause).toBe('VALIDATION_TOKEN_NOT_FOUND');
    }
  });

  it('deve retornar erro VALIDATION_TOKEN_ALREADY_USED quando codigo ja foi usado', async () => {
    const user = await userInMemoryRepository.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password',
      group: 'group-id',
    });

    await validationTokenInMemoryRepository.create({
      code: 'magic-link-code',
      status: E_TOKEN_STATUS.VALIDATED,
      user: user._id,
    });

    const result = await sut.execute({ code: 'magic-link-code' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(409);
      expect(result.value.cause).toBe('VALIDATION_TOKEN_ALREADY_USED');
    }
  });

  it('deve retornar erro VALIDATION_TOKEN_EXPIRED quando codigo estiver expirado', async () => {
    const user = await userInMemoryRepository.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password',
      group: 'group-id',
    });

    await validationTokenInMemoryRepository.create({
      code: 'magic-link-code',
      status: E_TOKEN_STATUS.EXPIRED,
      user: user._id,
    });

    const result = await sut.execute({ code: 'magic-link-code' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(410);
      expect(result.value.cause).toBe('VALIDATION_TOKEN_EXPIRED');
    }
  });

  it('deve retornar erro VALIDATION_TOKEN_EXPIRED quando codigo tiver mais de 10 minutos', async () => {
    const user = await userInMemoryRepository.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password',
      group: 'group-id',
    });

    const token = await validationTokenInMemoryRepository.create({
      code: 'magic-link-code',
      status: E_TOKEN_STATUS.REQUESTED,
      user: user._id,
    });

    Object.assign(token, { createdAt: subMinutes(new Date(), 15) });

    const result = await sut.execute({ code: 'magic-link-code' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(410);
      expect(result.value.cause).toBe('VALIDATION_TOKEN_EXPIRED');
    }
  });

  it('deve retornar erro USER_NOT_FOUND quando usuario do token nao existir', async () => {
    await validationTokenInMemoryRepository.create({
      code: 'magic-link-code',
      status: E_TOKEN_STATUS.REQUESTED,
      user: 'non-existent-user',
    });

    const result = await sut.execute({ code: 'magic-link-code' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(404);
      expect(result.value.cause).toBe('USER_NOT_FOUND');
    }
  });

  it('deve retornar erro MAGIC_LINK_ERROR quando houver falha', async () => {
    vi.spyOn(validationTokenInMemoryRepository, 'findBy').mockRejectedValueOnce(
      new Error('Database error'),
    );

    const result = await sut.execute({ code: 'some-code' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('MAGIC_LINK_ERROR');
    }
  });
});
