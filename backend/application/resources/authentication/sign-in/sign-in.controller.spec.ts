import bcrypt from 'bcryptjs';
import supertest from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { E_USER_STATUS } from '@application/core/entity.core';
import { UserGroup } from '@application/model/user-group.model';
import { User } from '@application/model/user.model';
import { kernel } from '@start/kernel';

describe('E2E Sign In Controller', () => {
  beforeEach(async () => {
    await kernel.ready();
    await User.deleteMany({});
    await UserGroup.deleteMany({});
  });

  afterAll(async () => {
    await kernel.close();
  });

  describe('POST /authentication/sign-in', () => {
    it('deve retornar 200 e setar cookies com credenciais validas', async () => {
      const hashedPassword = await bcrypt.hash('senha123', 10);

      const group = await UserGroup.create({
        name: 'Owner',
        slug: 'owner',
        permissions: [],
      });

      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        status: E_USER_STATUS.ACTIVE,
        group: group._id,
      });

      const response = await supertest(kernel.server)
        .post('/authentication/sign-in')
        .send({
          email: 'test@example.com',
          password: 'senha123',
        });

      expect(response.statusCode).toBe(200);
      expect(response.headers['set-cookie']).toBeDefined();

      const cookies = Array.from<string>(response.headers['set-cookie']);
      expect(cookies.some((c) => c.includes('accessToken'))).toBe(true);
      expect(cookies.some((c) => c.includes('refreshToken'))).toBe(true);
    });
  });
});
