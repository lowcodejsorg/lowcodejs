import mongoose from 'mongoose';
import supertest from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import {
  E_FIELD_TYPE,
  E_REACTION_TYPE,
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_TYPE,
  E_TABLE_VISIBILITY,
} from '@application/core/entity.core';
import TableMongooseRepository from '@application/repositories/table/table-mongoose.repository';
import { Field } from '@application/model/field.model';
import { Reaction } from '@application/model/reaction.model';
import { Table } from '@application/model/table.model';
import { UserGroup } from '@application/model/user-group.model';
import { User } from '@application/model/user.model';
import { FieldCreatePayload } from '@application/repositories/field/field-contract.repository';
import { TableCreatePayload } from '@application/repositories/table/table-contract.repository';
import { kernel } from '@start/kernel';
import { createAuthenticatedUser } from '@test/helpers/auth.helper';

describe('E2E Table Row Reaction Controller', () => {
  const tableRepo = new TableMongooseRepository();

  beforeEach(async () => {
    await kernel.ready();
    await User.deleteMany({});
    await UserGroup.deleteMany({});
    await Table.deleteMany({});
    await Field.deleteMany({});
    await Reaction.deleteMany({});

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

  describe('POST /tables/:slug/rows/:_id/reaction', () => {
    it('deve adicionar reacao com sucesso', async () => {
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
        name: 'Likes',
        slug: 'likes',
        type: E_FIELD_TYPE.REACTION,
      };

      const reactionField = await Field.create(fieldPayload);

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
        name: 'Posts',
        slug: 'posts',
        fields: [reactionField._id.toString()],
        _schema: tableRepo.buildSchema([
          {
            ...reactionField.toJSON(),
            _id: reactionField._id.toString(),
          },
        ]),
        description: 'Posts table',
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
        .post('/tables/posts/rows')
        .set('Cookie', cookies)
        .send({});

      const rowId = createResponse.body._id;

      const response = await supertest(kernel.server)
        .post(`/tables/${tablePayload.slug}/rows/${rowId}/reaction`)
        .set('Cookie', cookies)
        .send({
          type: E_REACTION_TYPE.LIKE,
          field: reactionField._id.toString(),
          user: user._id.toString(),
        });

      expect(response.statusCode).toBe(200);
    });
  });
});
