import supertest from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { UserGroup } from '@application/model/user-group.model';
import { User } from '@application/model/user.model';
import { kernel } from '@start/kernel';
import { createAuthenticatedUser } from '@test/helpers/auth.helper';

describe('E2E UserGroup Show Controller', () => {
  beforeEach(async () => {
    await kernel.ready();
    await User.deleteMany({});
    await UserGroup.deleteMany({});
  });

  afterAll(async () => {
    await kernel.close();
  });

  describe('GET /user-group/:_id', () => {
    it('deve retornar grupo com sucesso', async () => {
      const { cookies, permissions } = await createAuthenticatedUser();
      const group = await UserGroup.create({
        name: 'Owner',
        slug: 'owner',
        permissions,
      });

      const response = await supertest(kernel.server)
        .get(`/user-group/${group!._id}`)
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(200);
      expect(response.body._id).toBe(group!._id.toString());
      expect(response.body.name).toBe('Owner');
    });

    it('deve retornar 401 quando nao autenticado', async () => {
      const response = await supertest(kernel.server).get(
        '/user-group/507f1f77bcf86cd799439011',
      );

      expect(response.statusCode).toBe(401);
      expect(response.body.message).toBe('Authentication required');
      expect(response.body.cause).toBe('AUTHENTICATION_REQUIRED');
    });

    it('deve retornar 404 quando grupo nao existe', async () => {
      const { cookies } = await createAuthenticatedUser();

      const response = await supertest(kernel.server)
        .get('/user-group/507f1f77bcf86cd799439011')
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(404);
      expect(response.body.cause).toBe('USER_GROUP_NOT_FOUND');
    });
  });
});
