import supertest from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { E_MENU_ITEM_TYPE } from '@application/core/entity.core';
import { Menu } from '@application/model/menu.model';
import { UserGroup } from '@application/model/user-group.model';
import { User } from '@application/model/user.model';
import { kernel } from '@start/kernel';
import { createAuthenticatedUser } from '@test/helpers/auth.helper';

describe('E2E Pages Show Controller', () => {
  beforeEach(async () => {
    await kernel.ready();
    await User.deleteMany({});
    await UserGroup.deleteMany({});
    await Menu.deleteMany({});
  });

  afterAll(async () => {
    await kernel.close();
  });

  describe('GET /pages/:slug', () => {
    it('deve retornar pagina com sucesso', async () => {
      const { cookies } = await createAuthenticatedUser();

      await Menu.create({
        name: 'Dashboard',
        slug: 'dashboard',
        type: E_MENU_ITEM_TYPE.PAGE,
        html: '<h1>Dashboard Page</h1>',
        parent: null,
        table: null,
        url: null,
      });

      const response = await supertest(kernel.server)
        .get('/pages/dashboard')
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(200);
      expect(response.body.name).toBe('Dashboard');
      expect(response.body.html).toBe('<h1>Dashboard Page</h1>');
    });

    it('deve retornar 401 quando nao autenticado', async () => {
      const response = await supertest(kernel.server).get('/pages/dashboard');

      expect(response.statusCode).toBe(401);
      expect(response.body.message).toBe('Authentication required');
      expect(response.body.cause).toBe('AUTHENTICATION_REQUIRED');
    });

    it('deve retornar 404 quando pagina nao existe', async () => {
      const { cookies } = await createAuthenticatedUser();

      const response = await supertest(kernel.server)
        .get('/pages/non-existent-page')
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(404);
      expect(response.body.cause).toBe('PAGE_NOT_FOUND');
    });
  });
});
