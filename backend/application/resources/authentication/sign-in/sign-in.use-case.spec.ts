import { hash } from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { E_USER_STATUS } from '@application/core/entity.core';
import UserInMemoryRepository from '@application/repositories/user/user-in-memory.repository';

import SignInUseCase from './sign-in.use-case';

let userInMemoryRepository: UserInMemoryRepository;
let sut: SignInUseCase;

describe('Sign In Use Case', () => {
  beforeEach(() => {
    userInMemoryRepository = new UserInMemoryRepository();
    sut = new SignInUseCase(userInMemoryRepository);
  });

  it('deve autenticar usuario com credenciais validas', async () => {
    const hashedPassword = await hash('password123', 6);
    await userInMemoryRepository.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: hashedPassword,
      group: 'group-id',
    });

    const result = await sut.execute({
      email: 'john@example.com',
      password: 'password123',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.email).toBe('john@example.com');
    }
  });

  it('deve retornar erro 401 quando email nao existir', async () => {
    const result = await sut.execute({
      email: 'nonexistent@example.com',
      password: 'password123',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(401);
    }
  });

  it('deve retornar erro 401 quando senha estiver incorreta', async () => {
    const hashedPassword = await hash('correct_password', 6);
    await userInMemoryRepository.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: hashedPassword,
      group: 'group-id',
    });

    const result = await sut.execute({
      email: 'john@example.com',
      password: 'wrong_password',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(401);
    }
  });

  it('deve retornar erro 401 quando usuario estiver inativo', async () => {
    const hashedPassword = await hash('password123', 6);
    const user = await userInMemoryRepository.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: hashedPassword,
      group: 'group-id',
    });

    await userInMemoryRepository.update({
      _id: user._id,
      status: E_USER_STATUS.INACTIVE,
    });

    const result = await sut.execute({
      email: 'john@example.com',
      password: 'password123',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(401);
    }
  });

  it('deve retornar erro SIGN_IN_ERROR quando houver falha', async () => {
    vi.spyOn(userInMemoryRepository, 'findBy').mockRejectedValueOnce(
      new Error('Database error'),
    );

    const result = await sut.execute({
      email: 'john@example.com',
      password: 'password123',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('SIGN_IN_ERROR');
    }
  });
});
