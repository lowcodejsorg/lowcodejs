import supertest from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { User } from '@application/model/user.model';
import { kernel } from '@start/kernel';

describe('E2E User Update Controller', () => {
  beforeEach(async () => {
    await kernel.ready();
    await User.deleteMany({});
  });

  afterAll(async () => {
    await kernel.close();
  });

  describe('PATCH /users/:_id', () => {
    it('deve retornar 401 quando nao autenticado', async () => {
      const response = await supertest(kernel.server)
        .patch('/users/507f1f77bcf86cd799439011')
        .send({
          name: 'Updated Name',
          email: 'updated@example.com',
          group: '507f1f77bcf86cd799439012',
          status: 'active',
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.message).toBe('Authentication required');
      expect(response.body.cause).toBe('AUTHENTICATION_REQUIRED');
    });
  });
});
