import bcrypt from 'bcryptjs';
import supertest from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { E_TOKEN_STATUS, E_USER_STATUS } from '@application/core/entity.core';
import { UserGroup } from '@application/model/user-group.model';
import { User } from '@application/model/user.model';
import { ValidationToken } from '@application/model/validation-token.model';
import { kernel } from '@start/kernel';

describe('E2E Validate Code Controller', () => {
  beforeEach(async () => {
    await kernel.ready();
    await User.deleteMany({});
    await UserGroup.deleteMany({});
    await ValidationToken.deleteMany({});
  });

  afterAll(async () => {
    await kernel.close();
  });

  describe('POST /authentication/recovery/validate-code', () => {
    it('deve validar codigo com sucesso', async () => {
      const hashedPassword = await bcrypt.hash('senha123', 10);

      const group = await UserGroup.create({
        name: 'Owner',
        slug: 'owner',
        permissions: [],
      });

      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        status: E_USER_STATUS.ACTIVE,
        group: group._id,
      });

      await ValidationToken.create({
        code: '123456',
        status: E_TOKEN_STATUS.REQUESTED,
        user: user._id,
      });

      const response = await supertest(kernel.server)
        .post('/authentication/recovery/validate-code')
        .send({
          code: '123456',
        });

      expect(response.statusCode).toBe(200);
    });

    it('deve retornar 404 quando codigo nao existe', async () => {
      const response = await supertest(kernel.server)
        .post('/authentication/recovery/validate-code')
        .send({
          code: 'invalid-code',
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.cause).toBe('VALIDATION_TOKEN_NOT_FOUND');
    });

    it('deve retornar 410 quando codigo esta expirado', async () => {
      const hashedPassword = await bcrypt.hash('senha123', 10);

      const group = await UserGroup.create({
        name: 'Owner',
        slug: 'owner',
        permissions: [],
      });

      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        status: E_USER_STATUS.ACTIVE,
        group: group._id,
      });

      await ValidationToken.create({
        code: '123456',
        status: E_TOKEN_STATUS.EXPIRED,
        user: user._id,
      });

      const response = await supertest(kernel.server)
        .post('/authentication/recovery/validate-code')
        .send({
          code: '123456',
        });

      expect(response.statusCode).toBe(410);
      expect(response.body.cause).toBe('VALIDATION_TOKEN_EXPIRED');
    });
  });
});
