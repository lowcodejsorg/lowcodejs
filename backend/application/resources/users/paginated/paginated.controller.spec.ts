import supertest from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { User } from '@application/model/user.model';
import { kernel } from '@start/kernel';

describe('E2E User Paginated Controller', () => {
  beforeEach(async () => {
    await kernel.ready();
    await User.deleteMany({});
  });

  afterAll(async () => {
    await kernel.close();
  });

  describe('GET /users/paginated', () => {
    it('deve retornar 401 quando nao autenticado', async () => {
      const response = await supertest(kernel.server).get('/users/paginated');

      expect(response.statusCode).toBe(401);
      expect(response.body.message).toBe('Authentication required');
      expect(response.body.cause).toBe('AUTHENTICATION_REQUIRED');
    });
  });
});
