import supertest from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { UserGroup } from '@application/model/user-group.model';
import { User } from '@application/model/user.model';
import { kernel } from '@start/kernel';
import { createAuthenticatedUser } from '@test/helpers/auth.helper';

describe('E2E Sign Out Controller', () => {
  beforeEach(async () => {
    await kernel.ready();
    await User.deleteMany({});
    await UserGroup.deleteMany({});
  });

  afterAll(async () => {
    await kernel.close();
  });

  describe('POST /authentication/sign-out', () => {
    it('deve fazer logout com sucesso e limpar cookies', async () => {
      const { cookies } = await createAuthenticatedUser();

      const response = await supertest(kernel.server)
        .post('/authentication/sign-out')
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe('Successfully signed out');

      const responseCookies = Array.from<string>(
        response.headers['set-cookie'],
      );
      expect(responseCookies.some((c) => c.includes('accessToken=;'))).toBe(
        true,
      );
      expect(responseCookies.some((c) => c.includes('refreshToken=;'))).toBe(
        true,
      );
    });
  });
});
