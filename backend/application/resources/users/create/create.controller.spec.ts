import supertest from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { UserGroup } from '@application/model/user-group.model';
import { User } from '@application/model/user.model';
import { kernel } from '@start/kernel';
import { createAuthenticatedUser } from '@test/helpers/auth.helper';

describe('E2E User Create Controller', () => {
  beforeEach(async () => {
    await kernel.ready();
    await User.deleteMany({});
    await UserGroup.deleteMany({});
  });

  afterAll(async () => {
    await kernel.close();
  });

  describe('POST /users', () => {
    it('deve criar usuario com sucesso', async () => {
      const { cookies, permissions } = await createAuthenticatedUser();

      const group = await UserGroup.create({
        name: 'Customer',
        slug: 'customer',
        permissions,
      });

      const response = await supertest(kernel.server)
        .post('/users')
        .set('Cookie', cookies)
        .send({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123',
          group: group._id.toString(),
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.name).toBe('New User');
      expect(response.body.email).toBe('newuser@example.com');
    });

    it('deve retornar 401 quando nao autenticado', async () => {
      const response = await supertest(kernel.server).post('/users').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        group: '507f1f77bcf86cd799439011',
      });

      expect(response.statusCode).toBe(401);
      expect(response.body.message).toBe('Authentication required');
      expect(response.body.cause).toBe('AUTHENTICATION_REQUIRED');
    });

    it('deve retornar 409 quando email ja existe', async () => {
      const { cookies, user } = await createAuthenticatedUser({
        email: 'existing@example.com',
      });

      const group = await UserGroup.findOne({ slug: 'master' });

      const response = await supertest(kernel.server)
        .post('/users')
        .set('Cookie', cookies)
        .send({
          name: 'Another User',
          email: user.email,
          password: 'password123',
          group: group!._id.toString(),
        });

      expect(response.statusCode).toBe(409);
      expect(response.body.cause).toBe('USER_ALREADY_EXISTS');
    });
  });
});
