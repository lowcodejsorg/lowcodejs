import supertest from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { Storage } from '@application/model/storage.model';
import { UserGroup } from '@application/model/user-group.model';
import { User } from '@application/model/user.model';
import { kernel } from '@start/kernel';
import { createAuthenticatedUser } from '@test/helpers/auth.helper';

describe('E2E Storage Delete Controller', () => {
  beforeEach(async () => {
    await kernel.ready();
    await User.deleteMany({});
    await UserGroup.deleteMany({});
    await Storage.deleteMany({});
  });

  afterAll(async () => {
    await kernel.close();
  });

  describe('DELETE /storage/:_id', () => {
    it('deve deletar arquivo com sucesso', async () => {
      const { cookies } = await createAuthenticatedUser();

      const storage = await Storage.create({
        url: '/uploads/test.txt',
        filename: 'test.txt',
        type: 'text/plain',
        size: 100,
        originalName: 'test.txt',
      });

      const response = await supertest(kernel.server)
        .delete(`/storage/${storage._id}`)
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe('File deleted successfully');
    });

    it('deve retornar 401 quando nao autenticado', async () => {
      const response = await supertest(kernel.server).delete(
        '/storage/507f1f77bcf86cd799439011',
      );

      expect(response.statusCode).toBe(401);
      expect(response.body.message).toBe('Authentication required');
      expect(response.body.cause).toBe('AUTHENTICATION_REQUIRED');
    });

    it('deve retornar 404 quando arquivo nao existe', async () => {
      const { cookies } = await createAuthenticatedUser();

      const response = await supertest(kernel.server)
        .delete('/storage/507f1f77bcf86cd799439011')
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(404);
      expect(response.body.cause).toBe('STORAGE_NOT_FOUND');
    });
  });
});
