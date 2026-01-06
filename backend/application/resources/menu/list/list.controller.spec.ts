import supertest from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { Menu } from '@application/model/menu.model';
import { kernel } from '@start/kernel';

describe('E2E Menu List Controller', () => {
  beforeEach(async () => {
    await kernel.ready();
    await Menu.deleteMany({});
  });

  afterAll(async () => {
    await kernel.close();
  });

  describe('GET /menu', () => {
    it('deve retornar 401 quando nao autenticado', async () => {
      const response = await supertest(kernel.server).get('/menu');

      expect(response.statusCode).toBe(401);
      expect(response.body.message).toBe('Authentication required');
      expect(response.body.cause).toBe('AUTHENTICATION_REQUIRED');
    });
  });
});
