import { beforeEach, describe, expect, it, vi } from 'vitest';

import { E_ROLE, E_USER_STATUS } from '@application/core/entity.core';
import UserInMemoryRepository from '@application/repositories/user/user-in-memory.repository';
import UserGroupInMemoryRepository from '@application/repositories/user-group/user-group-in-memory.repository';
import InMemoryEmailService from '@application/services/email/in-memory-email.service';
import InMemoryPasswordService from '@application/services/password/in-memory-password.service';

import SignUpUseCase from './sign-up.use-case';

let userInMemoryRepository: UserInMemoryRepository;
let userGroupInMemoryRepository: UserGroupInMemoryRepository;
let emailService: InMemoryEmailService;
let passwordService: InMemoryPasswordService;
let sut: SignUpUseCase;

describe('Sign Up Use Case', () => {
  beforeEach(async () => {
    userInMemoryRepository = new UserInMemoryRepository();
    userGroupInMemoryRepository = new UserGroupInMemoryRepository();
    emailService = new InMemoryEmailService();
    passwordService = new InMemoryPasswordService();
    sut = new SignUpUseCase(
      userInMemoryRepository,
      userGroupInMemoryRepository,
      emailService,
      passwordService,
    );

    await userGroupInMemoryRepository.create({
      name: 'Registered',
      slug: E_ROLE.REGISTERED,
      permissions: [],
    });
  });

  it('deve registrar usuario com sucesso', async () => {
    const findByEmailSpy = vi.spyOn(userInMemoryRepository, 'findByEmail');
    const findBySlugSpy = vi.spyOn(userGroupInMemoryRepository, 'findBySlug');
    const createSpy = vi.spyOn(userInMemoryRepository, 'create');
    const hashSpy = vi.spyOn(passwordService, 'hash');

    const result = await sut.execute({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value.name).toBe('John Doe');
    expect(result.value.email).toBe('john@example.com');
    expect(result.value.status).toBe(E_USER_STATUS.ACTIVE);
    expect(result.value.password).toBe('hashed_password123');

    expect(findByEmailSpy).toHaveBeenCalledTimes(1);
    expect(findByEmailSpy).toHaveBeenCalledWith('john@example.com');
    expect(findBySlugSpy).toHaveBeenCalledTimes(1);
    expect(findBySlugSpy).toHaveBeenCalledWith(E_ROLE.REGISTERED);
    expect(hashSpy).toHaveBeenCalledTimes(1);
    expect(hashSpy).toHaveBeenCalledWith('password123');
    expect(createSpy).toHaveBeenCalledTimes(1);
  });

  it('deve disparar envio de email de boas-vindas apos registro', async () => {
    const buildTemplateSpy = vi.spyOn(emailService, 'buildTemplate');

    await sut.execute({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });

    // Email is fire-and-forget, wait for the promise chain
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(buildTemplateSpy).toHaveBeenCalledTimes(1);
    expect(buildTemplateSpy).toHaveBeenCalledWith({
      template: 'sign-up',
      data: { name: 'John Doe', email: 'john@example.com' },
    });
  });

  it('deve retornar erro USER_ALREADY_EXISTS quando email ja existir', async () => {
    const findByEmailSpy = vi.spyOn(userInMemoryRepository, 'findByEmail');

    await userInMemoryRepository.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      group: 'group-id',
    });

    const result = await sut.execute({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(409);
    expect(result.value.cause).toBe('USER_ALREADY_EXISTS');
    expect(result.value.message).toBe('Usuário já existe');

    expect(findByEmailSpy).toHaveBeenCalledTimes(1);
  });

  it('deve retornar erro GROUP_NOT_FOUND quando grupo REGISTERED nao existir', async () => {
    const newUserRepo = new UserInMemoryRepository();
    const newGroupRepo = new UserGroupInMemoryRepository();
    const newEmailService = new InMemoryEmailService();
    const newPasswordService = new InMemoryPasswordService();
    const newSut = new SignUpUseCase(
      newUserRepo,
      newGroupRepo,
      newEmailService,
      newPasswordService,
    );

    const findBySlugSpy = vi.spyOn(newGroupRepo, 'findBySlug');

    const result = await newSut.execute({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(409);
    expect(result.value.cause).toBe('GROUP_NOT_FOUND');
    expect(result.value.message).toBe('Grupo não encontrado');

    expect(findBySlugSpy).toHaveBeenCalledTimes(1);
    expect(findBySlugSpy).toHaveBeenCalledWith(E_ROLE.REGISTERED);
  });

  it('nao deve chamar create quando email ja existe', async () => {
    const createSpy = vi.spyOn(userInMemoryRepository, 'create');

    await userInMemoryRepository.create({
      name: 'Existing User',
      email: 'john@example.com',
      password: 'password123',
      group: 'group-id',
    });

    createSpy.mockClear();

    await sut.execute({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });

    expect(createSpy).not.toHaveBeenCalled();
  });

  it('deve retornar erro SIGN_UP_ERROR quando houver falha', async () => {
    const findByEmailSpy = vi
      .spyOn(userInMemoryRepository, 'findByEmail')
      .mockRejectedValueOnce(new Error('Database error'));

    const result = await sut.execute({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(500);
    expect(result.value.cause).toBe('SIGN_UP_ERROR');
    expect(result.value.message).toBe('Erro interno do servidor');

    expect(findByEmailSpy).toHaveBeenCalledTimes(1);
  });
});
