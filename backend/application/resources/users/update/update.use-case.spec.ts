import { beforeEach, describe, expect, it, vi } from 'vitest';

import { E_USER_STATUS } from '@application/core/entity.core';
import UserInMemoryRepository from '@application/repositories/user/user-in-memory.repository';
import InMemoryPasswordService from '@application/services/password/in-memory-password.service';

import UserUpdateUseCase from './update.use-case';

let userInMemoryRepository: UserInMemoryRepository;
let passwordService: InMemoryPasswordService;
let sut: UserUpdateUseCase;

describe('User Update Use Case', () => {
  beforeEach(() => {
    userInMemoryRepository = new UserInMemoryRepository();
    passwordService = new InMemoryPasswordService();
    sut = new UserUpdateUseCase(userInMemoryRepository, passwordService);
  });

  it('deve atualizar usuario com sucesso (sem password)', async () => {
    const created = await userInMemoryRepository.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      groups: ['group-id'],
    });

    const result = await sut.execute({
      _id: created._id,
      name: 'John Updated',
      email: 'john.updated@example.com',
      groups: ['new-group-id'],
      status: E_USER_STATUS.ACTIVE,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.name).toBe('John Updated');
    expect(result.value.email).toBe('john.updated@example.com');
    expect(result.value.password).toBe('password123');
  });

  it('deve atualizar usuario com nova senha (hasheada)', async () => {
    const created = await userInMemoryRepository.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'oldpassword',
      groups: ['group-id'],
    });

    const result = await sut.execute({
      _id: created._id,
      name: 'John Doe',
      email: 'john@example.com',
      groups: ['group-id'],
      status: E_USER_STATUS.ACTIVE,
      password: 'newpassword',
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.password).not.toBe('newpassword');
    expect(result.value.password).not.toBe('oldpassword');
    expect(result.value.password).toBe('hashed_newpassword');
  });

  it('deve permitir alterar status do usuario', async () => {
    const created = await userInMemoryRepository.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      groups: ['group-id'],
    });

    const result = await sut.execute({
      _id: created._id,
      name: 'John Doe',
      email: 'john@example.com',
      groups: ['group-id'],
      status: E_USER_STATUS.INACTIVE,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.status).toBe(E_USER_STATUS.INACTIVE);
  });

  it('deve retornar erro USER_NOT_FOUND (404) quando usuario nao existe', async () => {
    const result = await sut.execute({
      _id: 'non-existent-id',
      name: 'John Doe',
      email: 'john@example.com',
      groups: ['group-id'],
      status: E_USER_STATUS.ACTIVE,
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(404);
    expect(result.value.cause).toBe('USER_NOT_FOUND');
    expect(result.value.message).toBe('Usuário não encontrado');
  });

  it('deve retornar erro UPDATE_USER_ERROR (500) em falha de DB', async () => {
    const findByIdSpy = vi
      .spyOn(userInMemoryRepository, 'findById')
      .mockRejectedValueOnce(new Error('Database error'));

    const result = await sut.execute({
      _id: 'any-id',
      name: 'John Doe',
      email: 'john@example.com',
      groups: ['group-id'],
      status: E_USER_STATUS.ACTIVE,
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(500);
    expect(result.value.cause).toBe('UPDATE_USER_ERROR');
    expect(result.value.message).toBe('Erro interno do servidor');

    expect(findByIdSpy).toHaveBeenCalledTimes(1);
  });
});
