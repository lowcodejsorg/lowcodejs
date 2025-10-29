import { Field, FIELD_TYPE, Optional } from '@core/entity.core';
import { buildCollection, buildSchema } from '@core/util.core';
import { Collection as CollectionModel } from '@model/collection.model';
import { Field as FieldModel } from '@model/field.model';
import { User as UserModel } from '@model/user.model';

type Payload = Optional<
  import('@core/entity.core').Collection,
  '_id' | 'createdAt' | 'updatedAt' | 'trashed' | 'trashedAt'
>;

export default async function Seed(): Promise<void> {
  const slug = 'class-100K';

  const collection = await CollectionModel.findOne({ slug });

  await FieldModel.deleteMany({
    _id: { $in: (collection?.fields as Field[])?.flatMap((c) => [c._id]) },
  });

  await CollectionModel.deleteMany({ slug });

  const owner = await UserModel.findOne({ email: 'master@lowcodejs.org' });

  if (!owner) {
    throw new Error('Owner not found');
  }

  const professor = await CollectionModel.findOne({
    slug: 'professor-100K',
  }).populate([
    {
      path: 'fields',
      model: 'Field',
    },
  ]);

  const student = await CollectionModel.findOne({
    slug: 'student-100K',
  }).populate([
    {
      path: 'fields',
      model: 'Field',
    },
  ]);

  if (!professor || !student) {
    throw new Error('professor or student not found');
  }

  const [professor_field] = (professor?.fields as Field[]) ?? [];
  const [student_field] = (student?.fields as Field[]) ?? [];

  const fields = await FieldModel.insertMany([
    {
      name: 'students',
      type: FIELD_TYPE.RELATIONSHIP,
      slug: 'students',
      configuration: {
        required: true,
        listing: true,
        filtering: true,
        multiple: true,
        format: null,
        group: null,
        dropdown: [],
        default_value: null,
        relationship: {
          collection: {
            _id: student._id?.toString(),
            slug: student.slug?.toString(),
          },
          field: {
            _id: student_field._id?.toString(),
            slug: student_field.slug?.toString(),
          },
          order: 'asc',
        },
      },
      trashed: false,
      trashedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'professor',
      type: FIELD_TYPE.RELATIONSHIP,
      slug: 'professor',
      configuration: {
        required: true,
        listing: true,
        filtering: true,
        multiple: false,
        format: null,
        group: null,
        dropdown: [],
        default_value: null,
        relationship: {
          collection: {
            _id: professor._id?.toString(),
            slug: professor.slug?.toString(),
          },
          field: {
            _id: professor_field._id?.toString(),
            slug: professor_field.slug,
          },
          order: 'asc',
        },
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

  console.info('🌱 \x1b[32m class 100K \x1b[0m');
}
