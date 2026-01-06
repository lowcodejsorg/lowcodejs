import supertest from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { UserGroup } from '@application/model/user-group.model';
import { kernel } from '@start/kernel';

describe('E2E UserGroup List Controller', () => {
  beforeEach(async () => {
    await kernel.ready();
    await UserGroup.deleteMany({});
  });

  afterAll(async () => {
    await kernel.close();
  });

  describe('GET /user-group', () => {
    it('deve retornar 401 quando nao autenticado', async () => {
      const response = await supertest(kernel.server).get('/user-group');

      expect(response.statusCode).toBe(401);
      expect(response.body.message).toBe('Authentication required');
      expect(response.body.cause).toBe('AUTHENTICATION_REQUIRED');
    });
  });
});
