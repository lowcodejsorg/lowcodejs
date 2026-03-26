import supertest from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import {
  E_FIELD_TYPE,
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_TYPE,
  E_TABLE_VISIBILITY,
} from '@application/core/entity.core';
import { buildSchema } from '@application/core/util.core';
import { Field } from '@application/model/field.model';
import { Table } from '@application/model/table.model';
import { UserGroup } from '@application/model/user-group.model';
import { User } from '@application/model/user.model';
import { FieldCreatePayload } from '@application/repositories/field/field-contract.repository';
import { TableCreatePayload } from '@application/repositories/table/table-contract.repository';
import { kernel } from '@start/kernel';
import { createAuthenticatedUser } from '@test/helpers/auth.helper';

describe('E2E Table Field Update Controller', () => {
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

  describe('PUT /tables/:slug/fields/:_id', () => {
    it('deve atualizar campo com sucesso', async () => {
      const { cookies, user } = await createAuthenticatedUser();

      const fieldPayload: FieldCreatePayload = {
        category: [],
        dropdown: [],
        defaultValue: null,
        showInFilter: false,
        showInForm: true,
        showInDetail: true,
        format: null,
        group: null,
        showInList: true,
        locked: false,
        multiple: false,
        required: false,
        relationship: null,
        name: 'My Field',
        slug: 'my-field',
        type: E_FIELD_TYPE.TEXT_SHORT,
        widthInForm: null,
        widthInList: null,
        widthInDetail: null,
      };

      const field = await Field.create(fieldPayload);

      const tablePayload: TableCreatePayload = {
        owner: user._id,
        administrators: [],
        collaboration: E_TABLE_COLLABORATION.OPEN,
        fieldOrderForm: [],
        fieldOrderList: [],
        style: E_TABLE_STYLE.LIST,
        visibility: E_TABLE_VISIBILITY.PUBLIC,
        name: 'My Table',
        slug: 'my-table',
        fields: [field._id.toString()],
        _schema: buildSchema([
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

      const updatePayload: FieldCreatePayload = {
        category: [],
        dropdown: [],
        defaultValue: null,
        showInFilter: true,
        showInForm: true,
        showInDetail: true,
        format: null,
        group: null,
        showInList: true,
        locked: false,
        multiple: false,
        required: true,
        relationship: null,
        name: 'Updated Field',
        slug: 'updated-field',
        type: E_FIELD_TYPE.TEXT_SHORT,
        widthInForm: 75,
        widthInList: 30,
        widthInDetail: null,
      };

      const response = await supertest(kernel.server)
        .put(`/tables/${table.slug}/fields/${field._id}`)
        .set('Cookie', cookies)
        .send(updatePayload);

      expect(response.statusCode).toBe(200);
      expect(response.body.name).toBe('Updated Field');
      expect(response.body.required).toBe(true);
      expect(response.body.showInFilter).toBe(true);
      expect(response.body.widthInForm).toBe(75);
      expect(response.body.widthInList).toBe(30);
    });
  });
});
