import supertest from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import {
  E_FIELD_TYPE,
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_TYPE,
  E_TABLE_VISIBILITY,
} from '@application/core/entity.core';
import TableMongooseRepository from '@application/repositories/table/table-mongoose.repository';
import { Field } from '@application/model/field.model';
import { Table } from '@application/model/table.model';
import { UserGroup } from '@application/model/user-group.model';
import { User } from '@application/model/user.model';
import { FieldCreatePayload } from '@application/repositories/field/field-contract.repository';
import { TableCreatePayload } from '@application/repositories/table/table-contract.repository';
import { kernel } from '@start/kernel';
import { createAuthenticatedUser } from '@test/helpers/auth.helper';

describe('E2E Table Field Create Controller', () => {
  const tableRepo = new TableMongooseRepository();

  beforeEach(async () => {
    await kernel.ready();
    await User.deleteMany({});
    await UserGroup.deleteMany({});
    await Table.deleteMany({});
    await Field.deleteMany({});
  });

  afterAll(async () => {
    await kernel.close();
  });

  describe('POST /tables/:slug/fields', () => {
    it('deve criar campo com sucesso', async () => {
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
        name: 'Existing Field',
        slug: 'existing-field',
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
        name: 'My Table',
        slug: 'my-table',
        fields: [field._id.toString()],
        _schema: tableRepo.buildSchema([
          {
            ...field.toJSON(),
            _id: field._id.toString(),
          },
        ]),
        description: 'My description',
        logo: null,
        methods: {
          beforeSave: { code: null },
          afterSave: { code: null },
          onLoad: { code: null },
        },
        type: E_TABLE_TYPE.TABLE,
      };

      const table = await Table.create(tablePayload);

      const newFieldPayload: FieldCreatePayload = {
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
        name: 'My Field',
        slug: 'my-field',
        type: E_FIELD_TYPE.TEXT_SHORT,
      };

      const response = await supertest(kernel.server)
        .post(`/tables/${table.slug}/fields`)
        .set('Cookie', cookies)
        .send(newFieldPayload);

      expect(response.statusCode).toBe(201);
      expect(response.body.name).toBe('My Field');
      expect(response.body.type).toBe(E_FIELD_TYPE.TEXT_SHORT);
    });
  });
});
