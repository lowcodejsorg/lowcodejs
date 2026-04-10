import { beforeEach, describe, expect, it, vi } from 'vitest';

import UserInMemoryRepository from '@application/repositories/user/user-in-memory.repository';
import InMemoryPasswordService from '@application/services/password/in-memory-password.service';

import ProfileUpdateUseCase from './update.use-case';

let userInMemoryRepository: UserInMemoryRepository;
let passwordService: InMemoryPasswordService;
let sut: ProfileUpdateUseCase;

describe('Profile Update Use Case', () => {
  beforeEach(() => {
    userInMemoryRepository = new UserInMemoryRepository();
    passwordService = new InMemoryPasswordService();
    sut = new ProfileUpdateUseCase(userInMemoryRepository, passwordService);
  });

  it('deve atualizar o perfil do usuario sem alterar senha', async () => {
    const findByIdSpy = vi.spyOn(userInMemoryRepository, 'findById');
    const updateSpy = vi.spyOn(userInMemoryRepository, 'update');

    const created = await userInMemoryRepository.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashed_password',
      group: 'group-id',
    });

    const result = await sut.execute({
      _id: created._id,
      name: 'John Updated',
      email: 'john.updated@example.com',
      allowPasswordChange: false,
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');

    expect(result.value.name).toBe('John Updated');
    expect(result.value.email).toBe('john.updated@example.com');
    expect(findByIdSpy).toHaveBeenCalledWith(created._id);
    expect(updateSpy).toHaveBeenCalledOnce();
  });

  it('deve atualizar o perfil e senha quando senha atual estiver correta', async () => {
    const hashedPassword = await passwordService.hash('old_password');
    const compareSpy = vi.spyOn(passwordService, 'compare');
    const hashSpy = vi.spyOn(passwordService, 'hash');

    const created = await userInMemoryRepository.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: hashedPassword,
      group: 'group-id',
    });

    const result = await sut.execute({
      _id: created._id,
      name: 'John Updated',
      email: 'john.updated@example.com',
      allowPasswordChange: true,
      currentPassword: 'old_password',
      newPassword: 'new_password',
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');

    expect(result.value.name).toBe('John Updated');
    expect(result.value.password).not.toBe(hashedPassword);
    expect(compareSpy).toHaveBeenCalledWith('old_password', hashedPassword);
    expect(hashSpy).toHaveBeenCalledWith('new_password');
  });

  it('deve retornar erro INVALID_CREDENTIALS quando senha atual estiver incorreta', async () => {
    const hashedPassword = await passwordService.hash('correct_password');
    const created = await userInMemoryRepository.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: hashedPassword,
      group: 'group-id',
    });

    const result = await sut.execute({
      _id: created._id,
      name: 'John Updated',
      email: 'john.updated@example.com',
      allowPasswordChange: true,
      currentPassword: 'wrong_password',
      newPassword: 'new_password',
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');

    expect(result.value.code).toBe(401);
    expect(result.value.cause).toBe('INVALID_CREDENTIALS');
    expect(result.value.message).toBe('Senha atual incorreta');
  });

  it('deve retornar erro USER_NOT_FOUND quando usuario nao existe', async () => {
    const result = await sut.execute({
      _id: 'non-existent-id',
      name: 'John',
      email: 'john@example.com',
      allowPasswordChange: false,
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');

    expect(result.value.code).toBe(404);
    expect(result.value.cause).toBe('USER_NOT_FOUND');
    expect(result.value.message).toBe('Usuário não encontrado');
  });

  it('deve retornar erro UPDATE_USER_PROFILE_ERROR quando houver falha', async () => {
    userInMemoryRepository.simulateError(
      'findById',
      new Error('Database error'),
    );

    const result = await sut.execute({
      _id: 'some-id',
      name: 'John',
      email: 'john@example.com',
      allowPasswordChange: false,
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');

    expect(result.value.code).toBe(500);
    expect(result.value.cause).toBe('UPDATE_USER_PROFILE_ERROR');
    expect(result.value.message).toBe('Erro interno do servidor');
  });
});
