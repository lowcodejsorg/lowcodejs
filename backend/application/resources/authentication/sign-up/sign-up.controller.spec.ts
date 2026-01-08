import supertest from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { UserGroup } from '@application/model/user-group.model';
import { User } from '@application/model/user.model';
import { kernel } from '@start/kernel';

describe('E2E Sign Up Controller', () => {
  beforeEach(async () => {
    await kernel.ready();
    await User.deleteMany({});
    await UserGroup.deleteMany({});

    // Create the REGISTERED group required by sign-up use-case
    await UserGroup.create({
      name: 'Registered',
      slug: 'REGISTERED',
      permissions: [],
    });
  });

  afterAll(async () => {
    await kernel.close();
  });

  describe('POST /authentication/sign-up', () => {
    it('deve criar usuario com sucesso', async () => {
      const response = await supertest(kernel.server)
        .post('/authentication/sign-up')
        .send({
          name: 'Novo Usuario',
          email: 'novo@example.com',
          password: 'senha12345',
        });

      expect(response.statusCode).toBe(201);
    });

    it('deve retornar 409 quando email ja existe', async () => {
      const group = await UserGroup.findOne({ slug: 'REGISTERED' });
      await User.create({
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'hashedpassword',
        group: group!._id,
      });

      const response = await supertest(kernel.server)
        .post('/authentication/sign-up')
        .send({
          name: 'Novo Usuario',
          email: 'existing@example.com',
          password: 'senha12345',
        });

      expect(response.statusCode).toBe(409);
      expect(response.body.cause).toBe('USER_ALREADY_EXISTS');
    });

    it('deve retornar 400 quando senha e muito curta', async () => {
      const response = await supertest(kernel.server)
        .post('/authentication/sign-up')
        .send({
          name: 'Novo Usuario',
          email: 'novo@example.com',
          password: '123',
        });

      expect(response.statusCode).toBe(400);
    });
  });
});
