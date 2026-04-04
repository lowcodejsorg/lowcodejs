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

  it('deve autenticar usuário via magic link com sucesso', async () => {
    const findByCodeSpy = vi.spyOn(
      validationTokenInMemoryRepository,
      'findByCode',
    );
    const tokenUpdateSpy = vi.spyOn(
      validationTokenInMemoryRepository,
      'update',
    );
    const findByIdSpy = vi.spyOn(userInMemoryRepository, 'findById');

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
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.email).toBe('john@example.com');
    expect(result.value.name).toBe('John Doe');

    expect(findByCodeSpy).toHaveBeenCalledTimes(1);
    expect(findByCodeSpy).toHaveBeenCalledWith('magic-link-code');
    expect(tokenUpdateSpy).toHaveBeenCalledTimes(1);
    expect(findByIdSpy).toHaveBeenCalledTimes(1);
    expect(findByIdSpy).toHaveBeenCalledWith(user._id);
  });

  it('deve marcar token como VALIDATED apos uso bem-sucedido', async () => {
    const tokenUpdateSpy = vi.spyOn(
      validationTokenInMemoryRepository,
      'update',
    );

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

    await sut.execute({ code: 'magic-link-code' });

    expect(tokenUpdateSpy).toHaveBeenCalledWith({
      _id: token._id,
      status: E_TOKEN_STATUS.VALIDATED,
    });
  });

  it('deve ativar usuario inativo ao usar magic link', async () => {
    const userUpdateSpy = vi.spyOn(userInMemoryRepository, 'update');

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

    userUpdateSpy.mockClear();

    await validationTokenInMemoryRepository.create({
      code: 'magic-link-code',
      status: E_TOKEN_STATUS.REQUESTED,
      user: user._id,
    });

    const result = await sut.execute({ code: 'magic-link-code' });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');

    expect(userUpdateSpy).toHaveBeenCalledTimes(1);
    expect(userUpdateSpy).toHaveBeenCalledWith({
      _id: user._id,
      status: E_USER_STATUS.ACTIVE,
    });
  });

  it('nao deve chamar userRepository.update quando usuario ja esta ativo', async () => {
    const userUpdateSpy = vi.spyOn(userInMemoryRepository, 'update');

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

    await sut.execute({ code: 'magic-link-code' });

    // update is called once for the token status, but not for user activation
    const userUpdateCalls = userUpdateSpy.mock.calls.filter(
      (call) => call[0]._id === user._id && 'status' in call[0],
    );
    expect(userUpdateCalls).toHaveLength(0);
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
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(409);
    expect(result.value.cause).toBe('VALIDATION_TOKEN_ALREADY_USED');
    expect(result.value.message).toBe('Token de validação já utilizado');
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
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(410);
    expect(result.value.cause).toBe('VALIDATION_TOKEN_EXPIRED');
    expect(result.value.message).toBe('Código expirado');
  });

  it('deve retornar erro VALIDATION_TOKEN_EXPIRED quando codigo tiver mais de 10 minutos', async () => {
    const tokenUpdateSpy = vi.spyOn(
      validationTokenInMemoryRepository,
      'update',
    );

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
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(410);
    expect(result.value.cause).toBe('VALIDATION_TOKEN_EXPIRED');
    expect(result.value.message).toBe('Código expirado');

    expect(tokenUpdateSpy).toHaveBeenCalledTimes(1);
    expect(tokenUpdateSpy).toHaveBeenCalledWith({
      _id: token._id,
      status: E_TOKEN_STATUS.EXPIRED,
    });
  });

  it('deve retornar erro USER_NOT_FOUND quando usuario do token nao existir', async () => {
    const findByIdSpy = vi.spyOn(userInMemoryRepository, 'findById');

    await validationTokenInMemoryRepository.create({
      code: 'magic-link-code',
      status: E_TOKEN_STATUS.REQUESTED,
      user: 'non-existent-user',
    });

    const result = await sut.execute({ code: 'magic-link-code' });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(404);
    expect(result.value.cause).toBe('USER_NOT_FOUND');
    expect(result.value.message).toBe('Usuário não encontrado');

    expect(findByIdSpy).toHaveBeenCalledTimes(1);
  });

  it('deve retornar erro MAGIC_LINK_ERROR quando houver falha', async () => {
    const findByCodeSpy = vi
      .spyOn(validationTokenInMemoryRepository, 'findByCode')
      .mockRejectedValueOnce(new Error('Database error'));

    const result = await sut.execute({ code: 'some-code' });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(500);
    expect(result.value.cause).toBe('MAGIC_LINK_ERROR');
    expect(result.value.message).toBe('Erro interno do servidor');

    expect(findByCodeSpy).toHaveBeenCalledTimes(1);
  });
});
