import { Field, FIELD_FORMAT, FIELD_TYPE, Optional } from '@core/entity.core';
import { buildCollection, buildSchema } from '@core/util.core';
import { Collection as CollectionModel } from '@model/collection.model';
import { Field as FieldModel } from '@model/field.model';
import { User as UserModel } from '@model/user.model';

type Payload = Optional<
  import('@core/entity.core').Collection,
  '_id' | 'createdAt' | 'updatedAt' | 'trashed' | 'trashedAt'
>;

export default async function Seed(): Promise<void> {
  const slug = 'student-1M';

  const collection = await CollectionModel.findOne({ slug });

  await FieldModel.deleteMany({
    _id: { $in: (collection?.fields as Field[])?.flatMap((c) => [c._id]) },
  });

  await CollectionModel.deleteMany({ slug });

  const owner = await UserModel.findOne({ email: 'master@lowcodejs.org' });

  if (!owner) {
    throw new Error('Owner not found');
  }

  const fields = await FieldModel.insertMany([
    {
      name: 'name',
      type: FIELD_TYPE.TEXT_SHORT,
      slug: 'name',
      configuration: {
        required: true,
        listing: true,
        filtering: true,
        multiple: false,
        format: FIELD_FORMAT.ALPHA_NUMERIC,
        group: null,
        dropdown: [],
        default_value: null,
        relationship: null,
        category: [],
      },
      trashed: false,
      trashedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'e-mail',
      type: FIELD_TYPE.TEXT_SHORT,
      slug: 'e-mail',
      configuration: {
        required: true,
        listing: true,
        filtering: true,
        multiple: false,
        format: FIELD_FORMAT.ALPHA_NUMERIC,
        group: null,
        dropdown: [],
        default_value: null,
        relationship: null,
      },
      trashed: false,
      trashedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const payload: Payload = {
    _schema: buildSchema(
      fields.map((c) => ({
        ...c.toJSON({
          flattenObjectIds: true,
        }),
        _id: c._id?.toString(),
      })),
    ),
    name: slug,
    slug: slug,
    type: 'collection',
    fields: fields?.flatMap((c) => [c._id?.toString()]),
    description: null,
    logo: null,
    configuration: {
      style: 'list',
      visibility: 'restricted',
      collaboration: 'restricted',
      owner: owner._id?.toString(),
      administrators: [],
      fields: {
        orderList: [],
        orderForm: [],
      },
    },
    trashed: false,
    trashedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await CollectionModel.create(payload);

  await buildCollection(payload);

  console.info('🌱 \x1b[32m student 1M \x1b[0m');
}
