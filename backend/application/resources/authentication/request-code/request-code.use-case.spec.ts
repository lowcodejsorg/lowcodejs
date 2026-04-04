import { beforeEach, describe, expect, it, vi } from 'vitest';

import UserInMemoryRepository from '@application/repositories/user/user-in-memory.repository';
import ValidationTokenInMemoryRepository from '@application/repositories/validation-token/validation-token-in-memory.repository';
import InMemoryEmailService from '@application/services/email/in-memory-email.service';

import RequestCodeUseCase from './request-code.use-case';

let userInMemoryRepository: UserInMemoryRepository;
let validationTokenInMemoryRepository: ValidationTokenInMemoryRepository;
let emailInMemoryService: InMemoryEmailService;
let sut: RequestCodeUseCase;

describe('Request Code Use Case', () => {
  beforeEach(() => {
    userInMemoryRepository = new UserInMemoryRepository();
    validationTokenInMemoryRepository = new ValidationTokenInMemoryRepository();
    emailInMemoryService = new InMemoryEmailService();
    sut = new RequestCodeUseCase(
      userInMemoryRepository,
      validationTokenInMemoryRepository,
      emailInMemoryService,
    );
  });

  it('deve criar codigo de validacao com sucesso', async () => {
    const findByEmailSpy = vi.spyOn(userInMemoryRepository, 'findByEmail');
    const createTokenSpy = vi.spyOn(
      validationTokenInMemoryRepository,
      'create',
    );
    const buildTemplateSpy = vi.spyOn(emailInMemoryService, 'buildTemplate');
    const sendEmailSpy = vi.spyOn(emailInMemoryService, 'sendEmail');

    await userInMemoryRepository.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password',
      group: 'group-id',
    });

    const result = await sut.execute({ email: 'john@example.com' });

    expect(result.isRight()).toBe(true);
    if (!result.isRight()) throw new Error('Expected right');
    expect(result.value).toBeNull();

    expect(findByEmailSpy).toHaveBeenCalledTimes(1);
    expect(findByEmailSpy).toHaveBeenCalledWith('john@example.com');
    expect(createTokenSpy).toHaveBeenCalledTimes(1);
    expect(buildTemplateSpy).toHaveBeenCalledTimes(1);
    expect(sendEmailSpy).toHaveBeenCalledTimes(1);
  });

  it('deve gerar codigo numerico de 6 digitos', async () => {
    const createTokenSpy = vi.spyOn(
      validationTokenInMemoryRepository,
      'create',
    );

    await userInMemoryRepository.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password',
      group: 'group-id',
    });

    await sut.execute({ email: 'john@example.com' });

    expect(createTokenSpy).toHaveBeenCalledTimes(1);
    const callArg = createTokenSpy.mock.calls[0][0];
    expect(callArg.code).toMatch(/^\d{6}$/);
    expect(Number(callArg.code)).toBeGreaterThanOrEqual(100000);
    expect(Number(callArg.code)).toBeLessThanOrEqual(999999);
  });

  it('deve retornar erro EMAIL_NOT_FOUND quando email nao existir', async () => {
    const findByEmailSpy = vi.spyOn(userInMemoryRepository, 'findByEmail');
    const createTokenSpy = vi.spyOn(
      validationTokenInMemoryRepository,
      'create',
    );

    const result = await sut.execute({ email: 'nonexistent@example.com' });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(404);
    expect(result.value.cause).toBe('EMAIL_NOT_FOUND');
    expect(result.value.message).toBe('E-mail não encontrado');

    expect(findByEmailSpy).toHaveBeenCalledTimes(1);
    expect(createTokenSpy).not.toHaveBeenCalled();
  });

  it('deve retornar erro REQUEST_CODE_ERROR quando houver falha', async () => {
    const findByEmailSpy = vi
      .spyOn(userInMemoryRepository, 'findByEmail')
      .mockRejectedValueOnce(new Error('Database error'));

    const result = await sut.execute({ email: 'john@example.com' });

    expect(result.isLeft()).toBe(true);
    if (!result.isLeft()) throw new Error('Expected left');
    expect(result.value.code).toBe(500);
    expect(result.value.cause).toBe('REQUEST_CODE_ERROR');
    expect(result.value.message).toBe('Erro interno do servidor');

    expect(findByEmailSpy).toHaveBeenCalledTimes(1);
  });
});
