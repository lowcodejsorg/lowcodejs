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
import { buildSchema, buildTable } from '@application/core/util.core';
import { Field } from '@application/model/field.model';
import { Table } from '@application/model/table.model';
import { UserGroup } from '@application/model/user-group.model';
import { User } from '@application/model/user.model';
import { FieldCreatePayload } from '@application/repositories/field/field-contract.repository';
import { TableCreatePayload } from '@application/repositories/table/table-contract.repository';
import { kernel } from '@start/kernel';
import { createAuthenticatedUser } from '@test/helpers/auth.helper';

describe('E2E Table Update Controller', () => {
  beforeEach(async () => {
    await kernel.ready();
    await User.deleteMany({});
    await UserGroup.deleteMany({});
    await Table.deleteMany({});
    await Field.deleteMany({});

    // Limpar coleções dinâmicas que possam ter ficado de testes anteriores
    const db = mongoose.connection.db!;
    for (const slug of ['my-table', 'updated-table']) {
      const exists = await db.listCollections({ name: slug }).toArray();
      if (exists.length > 0) {
        await db.dropCollection(slug);
      }
      if (mongoose.models[slug]) {
        delete mongoose.models[slug];
      }
    }
  });

  afterAll(async () => {
    await kernel.close();
  });

  describe('PUT /tables/:slug', () => {
    it('deve atualizar tabela com sucesso', async () => {
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
        collaboration: E_TABLE_COLLABORATION.RESTRICTED,
        fieldOrderForm: [],
        fieldOrderList: [],
        style: E_TABLE_STYLE.LIST,
        visibility: E_TABLE_VISIBILITY.RESTRICTED,
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

      // Criar a coleção dinâmica para que o rename funcione
      await buildTable({
        ...table.toJSON(),
        _id: table._id.toString(),
        fields: [{ ...field.toJSON(), _id: field._id.toString() }],
      });

      const response = await supertest(kernel.server)
        .put(`/tables/${table.slug}`)
        .set('Cookie', cookies)
        .send({
          name: 'Updated Table',
          description: 'Updated description',
          logo: null,
          style: E_TABLE_STYLE.LIST,
          visibility: E_TABLE_VISIBILITY.PUBLIC,
          collaboration: E_TABLE_COLLABORATION.OPEN,
          administrators: [],
          fieldOrderList: [],
          fieldOrderForm: [],
          methods: {
            beforeSave: { code: null },
            afterSave: { code: null },
            onLoad: { code: null },
          },
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.name).toBe('Updated Table');
      expect(response.body.description).toBe('Updated description');
    });
  });
});
