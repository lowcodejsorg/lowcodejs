import type { Optional } from '@application/core/entity.core';
import { Permission } from '@application/model/permission.model';

type Payload = Optional<
  import('@application/core/entity.core').Permission,
  '_id' | 'createdAt' | 'updatedAt' | 'trashed' | 'trashedAt'
>;

export default async function Seed(): Promise<void> {
  await Permission.deleteMany({});

  const payload: Payload[] = [
    {
      name: 'Create table',
      slug: 'create-table',
      description: 'Allows creating a new table',
    },
    {
      name: 'Remove table',
      slug: 'remove-table',
      description: 'Allows removing or deleting existing tables.',
    },
    {
      name: 'Update table',
      slug: 'update-table',
      description: 'Allows updating data of an existing table.',
    },
    {
      name: 'View table',
      slug: 'view-table',
      description: 'Allows viewing and listening existing tables',
    },
    {
      name: 'Create field',
      slug: 'create-field',
      description: 'Allows creating a field in an existing table',
    },
    {
      name: 'Update field',
      slug: 'update-field',
      description: 'Allows updating field data in an existing table',
    },
    {
      name: 'Remove field',
      slug: 'remove-field',
      description: 'Allows removing or deleting fields from an existing table.',
    },
    {
      name: 'View field',
      slug: 'view-field',
      description:
        'Allows viewing and listening fields from an existing table.',
    },
    {
      name: 'Create row',
      slug: 'create-row',
      description: 'Allows creating new rows in an existing table',
    },
    {
      name: 'Update row',
      slug: 'update-row',
      description: 'Allows updating row data in an existing table.',
    },
    {
      name: 'Remove row',
      slug: 'remove-row',
      description: 'Allows removing rows from an existing table.',
    },
    {
      name: 'View row',
      slug: 'view-row',
      description: 'Allows viewing and listening rows from an existing table.',
    },
  ];

  await Permission.insertMany(payload);
  console.info('🌱 \x1b[32m permissions \x1b[0m');
}
