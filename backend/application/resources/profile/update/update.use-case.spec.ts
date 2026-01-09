import { hash } from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import UserInMemoryRepository from '@application/repositories/user/user-in-memory.repository';

import ProfileUpdateUseCase from './update.use-case';

let userInMemoryRepository: UserInMemoryRepository;
let sut: ProfileUpdateUseCase;

describe('Profile Update Use Case', () => {
  beforeEach(() => {
    userInMemoryRepository = new UserInMemoryRepository();
    sut = new ProfileUpdateUseCase(userInMemoryRepository);
  });

  it('deve atualizar o perfil do usuario sem alterar senha', async () => {
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
      group: 'group-id',
      allowPasswordChange: false,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.name).toBe('John Updated');
      expect(result.value.email).toBe('john.updated@example.com');
    }
  });

  it('deve atualizar o perfil e senha quando senha atual estiver correta', async () => {
    const hashedPassword = await hash('old_password', 6);
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
      group: 'group-id',
      allowPasswordChange: true,
      currentPassword: 'old_password',
      newPassword: 'new_password',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.name).toBe('John Updated');
      expect(result.value.password).not.toBe(hashedPassword);
    }
  });

  it('deve retornar erro INVALID_CREDENTIALS quando senha atual estiver incorreta', async () => {
    const hashedPassword = await hash('correct_password', 6);
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
      group: 'group-id',
      allowPasswordChange: true,
      currentPassword: 'wrong_password',
      newPassword: 'new_password',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(401);
      expect(result.value.cause).toBe('INVALID_CREDENTIALS');
    }
  });

  it('deve retornar erro GROUP_NOT_INFORMED quando grupo nao for informado', async () => {
    const result = await sut.execute({
      _id: 'some-id',
      name: 'John',
      email: 'john@example.com',
      group: '',
      allowPasswordChange: false,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(400);
      expect(result.value.cause).toBe('GROUP_NOT_INFORMED');
    }
  });

  it('deve retornar erro USER_NOT_FOUND quando usuario nao existe', async () => {
    const result = await sut.execute({
      _id: 'non-existent-id',
      name: 'John',
      email: 'john@example.com',
      group: 'group-id',
      allowPasswordChange: false,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(404);
      expect(result.value.cause).toBe('USER_NOT_FOUND');
    }
  });

  it('deve retornar erro UPDATE_USER_PROFILE_ERROR quando houver falha', async () => {
    vi.spyOn(userInMemoryRepository, 'findBy').mockRejectedValueOnce(
      new Error('Database error'),
    );

    const result = await sut.execute({
      _id: 'some-id',
      name: 'John',
      email: 'john@example.com',
      group: 'group-id',
      allowPasswordChange: false,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('UPDATE_USER_PROFILE_ERROR');
    }
  });
});
