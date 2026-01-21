import mongoose from 'mongoose';
import supertest from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import {
  E_FIELD_TYPE,
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_TYPE,
  E_TABLE_VISIBILITY,
} from '@application/core/entity.core';
import { Field } from '@application/model/field.model';
import { Table } from '@application/model/table.model';
import { UserGroup } from '@application/model/user-group.model';
import { User } from '@application/model/user.model';
import { FieldCreatePayload } from '@application/repositories/field/field-contract.repository';
import { TableCreatePayload } from '@application/repositories/table/table-contract.repository';
import TableMongooseRepository from '@application/repositories/table/table-mongoose.repository';
import { kernel } from '@start/kernel';
import { createAuthenticatedUser } from '@test/helpers/auth.helper';

describe('E2E Table Row Remove From Trash Controller', () => {
  const tableRepo = new TableMongooseRepository();

  beforeEach(async () => {
    await kernel.ready();
    await User.deleteMany({});
    await UserGroup.deleteMany({});
    await Table.deleteMany({});
    await Field.deleteMany({});

    // Cleanup dynamic collections
    const collections = await mongoose.connection.db
      ?.listCollections()
      .toArray();
    for (const collection of collections || []) {
      if (collection.name.startsWith('table_')) {
        await mongoose.connection.db?.dropCollection(collection.name);
      }
    }
  });

  afterAll(async () => {
    await kernel.close();
  });

  describe('PATCH /tables/:slug/rows/:_id/restore', () => {
    it('deve restaurar linha da lixeira com sucesso', async () => {
      const { cookies, user } = await createAuthenticatedUser();

      const fieldPayload: FieldCreatePayload = {
        configuration: {
          category: [],
          dropdown: [],
          defaultValue: null,
          filtering: false,
          format: null,
          group: null,
          listing: true,
          multiple: false,
          required: false,
          relationship: null,
        },
        name: 'Name',
        slug: 'name',
        type: E_FIELD_TYPE.TEXT_SHORT,
      };

      const field = await Field.create(fieldPayload);

      const tablePayload: TableCreatePayload = {
        configuration: {
          owner: user._id,
          administrators: [],
          collaboration: E_TABLE_COLLABORATION.OPEN,
          fields: {
            orderForm: [],
            orderList: [],
          },
          style: E_TABLE_STYLE.LIST,
          visibility: E_TABLE_VISIBILITY.PUBLIC,
        },
        name: 'Products',
        slug: 'products',
        fields: [field._id.toString()],
        _schema: tableRepo.buildSchema([
          {
            ...field.toJSON(),
            _id: field._id.toString(),
          },
        ]),
        description: 'Products table',
        logo: null,
        methods: {
          beforeSave: { code: null },
          afterSave: { code: null },
          onLoad: { code: null },
        },
        type: E_TABLE_TYPE.TABLE,
      };

      await Table.create(tablePayload);

      // Create a row first
      const createResponse = await supertest(kernel.server)
        .post('/tables/products/rows')
        .set('Cookie', cookies)
        .send({ name: 'Product 1' });

      const rowId = createResponse.body._id;

      // Send to trash first
      await supertest(kernel.server)
        .patch(`/tables/products/rows/${rowId}/trash`)
        .set('Cookie', cookies);

      // Restore from trash
      const response = await supertest(kernel.server)
        .patch(`/tables/products/rows/${rowId}/restore`)
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(200);
      expect(response.body.trashed).toBe(false);
      expect(response.body.trashedAt).toBeNull();
    });
  });
});
