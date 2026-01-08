import supertest from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { UserGroup } from '@application/model/user-group.model';
import { User } from '@application/model/user.model';
import { kernel } from '@start/kernel';
import { createAuthenticatedUser } from '@test/helpers/auth.helper';

describe('E2E Refresh Token Controller', () => {
  beforeEach(async () => {
    await kernel.ready();
    await User.deleteMany({});
    await UserGroup.deleteMany({});
  });

  afterAll(async () => {
    await kernel.close();
  });

  describe('POST /authentication/refresh-token', () => {
    it('deve renovar tokens com sucesso', async () => {
      const { cookies } = await createAuthenticatedUser();

      const response = await supertest(kernel.server)
        .post('/authentication/refresh-token')
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(200);

      const responseCookies = Array.from<string>(
        response.headers['set-cookie'],
      );

      expect(responseCookies.some((c) => c.includes('accessToken'))).toBe(true);
      expect(responseCookies.some((c) => c.includes('refreshToken'))).toBe(
        true,
      );
    });

    it('deve retornar 401 quando nao autenticado', async () => {
      const response = await supertest(kernel.server).post(
        '/authentication/refresh-token',
      );

      expect(response.statusCode).toBe(401);
    });
  });
});
