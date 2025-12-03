import type { Optional } from '@application/core/entity.core';
import { Permission } from '@application/model/permission.model';
import { PermissionSlugMapper } from '@config/util.config';

type Payload = Optional<
  import('@application/core/entity.core').Permission,
  '_id' | 'createdAt' | 'updatedAt' | 'trashed' | 'trashedAt'
>;

export default async function Seed(): Promise<void> {
  await Permission.deleteMany({});

  const payload: Payload[] = [
    {
      name: 'Create table',
      slug: PermissionSlugMapper['CREATE_TABLE'],
      description: 'Allows creating a new table',
    },
    {
      name: 'Update table',
      slug: PermissionSlugMapper['UPDATE_TABLE'],
      description: 'Allows updating data of an existing table.',
    },
    {
      name: 'Remove table',
      slug: PermissionSlugMapper['REMOVE_TABLE'],
      description: 'Allows removing or deleting existing tables.',
    },
    {
      name: 'View table',
      slug: PermissionSlugMapper['VIEW_TABLE'],
      description: 'Allows viewing and listening existing tables',
    },
    {
      name: 'Create field',
      slug: PermissionSlugMapper['CREATE_FIELD'],
      description: 'Allows creating a field in an existing table',
    },
    {
      name: 'Update field',
      slug: PermissionSlugMapper['UPDATE_FIELD'],
      description: 'Allows updating field data in an existing table',
    },
    {
      name: 'Remove field',
      slug: PermissionSlugMapper['REMOVE_FIELD'],
      description: 'Allows removing or deleting fields from an existing table.',
    },
    {
      name: 'View field',
      slug: PermissionSlugMapper['VIEW_FIELD'],
      description:
        'Allows viewing and listening fields from an existing table.',
    },
    {
      name: 'Create row',
      slug: PermissionSlugMapper['CREATE_ROW'],
      description: 'Allows creating new rows in an existing table',
    },
    {
      name: 'Update row',
      slug: PermissionSlugMapper['UPDATE_ROW'],
      description: 'Allows updating row data in an existing table.',
    },
    {
      name: 'Remove row',
      slug: PermissionSlugMapper['REMOVE_ROW'],
      description: 'Allows removing rows from an existing table.',
    },
    {
      name: 'View row',
      slug: PermissionSlugMapper['VIEW_ROW'],
      description: 'Allows viewing and listening rows from an existing table.',
    },
  ];

  await Permission.insertMany(payload);
  console.info('🌱 \x1b[32m permissions \x1b[0m');
}
