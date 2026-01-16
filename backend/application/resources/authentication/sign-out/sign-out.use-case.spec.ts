import { beforeEach, describe, expect, it } from 'vitest';

import SignOutUseCase from './sign-out.use-case';

let sut: SignOutUseCase;

describe('Sign Out Use Case', () => {
  beforeEach(() => {
    sut = new SignOutUseCase();
  });

  it('deve retornar sucesso ao fazer sign out', async () => {
    const result = await sut.execute();

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.message).toBe('Successfully signed out');
    }
  });
});
