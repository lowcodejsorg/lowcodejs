import supertest from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { E_USER_STATUS } from '@application/core/entity.core';
import { UserGroup } from '@application/model/user-group.model';
import { User } from '@application/model/user.model';
import { kernel } from '@start/kernel';
import { createAuthenticatedUser } from '@test/helpers/auth.helper';

describe('E2E User Update Controller', () => {
  beforeEach(async () => {
    await kernel.ready();
    await User.deleteMany({});
    await UserGroup.deleteMany({});
  });

  afterAll(async () => {
    await kernel.close();
  });

  describe('PATCH /users/:_id', () => {
    it('deve atualizar usuario com sucesso', async () => {
      const { cookies, user, permissions } = await createAuthenticatedUser();
      const group = await UserGroup.create({
        name: 'Customer',
        slug: 'customer',
        permissions,
      });

      const response = await supertest(kernel.server)
        .patch(`/users/${user._id}`)
        .set('Cookie', cookies)
        .send({
          name: 'Updated Name',
          email: user.email,
          group: group._id.toString(),
          password: 'password123',
          status: E_USER_STATUS.ACTIVE,
        });

      console.log(JSON.stringify(response.body, null, 2));

      expect(response.statusCode).toBe(200);
      expect(response.body.name).toBe('Updated Name');
    });

    it('deve retornar 401 quando nao autenticado', async () => {
      const response = await supertest(kernel.server)
        .patch('/users/507f1f77bcf86cd799439011')
        .send({
          name: 'Updated Name',
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.message).toBe('Authentication required');
      expect(response.body.cause).toBe('AUTHENTICATION_REQUIRED');
    });

    it('deve retornar 404 quando usuario nao existe', async () => {
      const { cookies, permissions } = await createAuthenticatedUser();
      const group = await UserGroup.create({
        name: 'Customer',
        slug: 'customer',
        permissions,
      });

      const response = await supertest(kernel.server)
        .patch('/users/507f1f77bcf86cd799439011')
        .set('Cookie', cookies)
        .send({
          name: 'Updated Name',
          email: 'newuser@example.com',
          group: group._id.toString(),
          password: 'password123',
          status: E_USER_STATUS.ACTIVE,
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.cause).toBe('USER_NOT_FOUND');
    });
  });
});
