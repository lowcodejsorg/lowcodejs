/* eslint-disable @typescript-eslint/consistent-type-imports */
import type { Optional } from '@core/entity.core';
import { Permission } from '@model/permission.model';

type Payload = Optional<
  import('@core/entity.core').Permission,
  '_id' | 'createdAt' | 'updatedAt' | 'trashed' | 'trashedAt'
>;

export default async function Seed(): Promise<void> {
  await Permission.deleteMany({});

  const payload: Payload[] = [
    {
      name: 'Create collection',
      slug: 'create-collection',
      description: 'Allows creating a new collection',
    },
    {
      name: 'Remove collection',
      slug: 'remove-collection',
      description: 'Allows removing or deleting existing collections.',
    },
    {
      name: 'Update collection',
      slug: 'update-collection',
      description: 'Allows updating data of an existing collection.',
    },
    {
      name: 'View collection',
      slug: 'view-collection',
      description: 'Allows viewing and listening existing collections',
    },
    {
      name: 'Create field',
      slug: 'create-field',
      description: 'Allows creating a field in an existing collection',
    },
    {
      name: 'Update field',
      slug: 'update-field',
      description: 'Allows updating field data in an existing collection',
    },
    {
      name: 'Remove field',
      slug: 'remove-field',
      description:
        'Allows removing or deleting fields from an existing collection.',
    },
    {
      name: 'View field',
      slug: 'view-field',
      description:
        'Allows viewing and listening fields from an existing collection.',
    },
    {
      name: 'Create row',
      slug: 'create-row',
      description: 'Allows creating new rows in an existing collection',
    },
    {
      name: 'Update row',
      slug: 'update-row',
      description: 'Allows updating row data in an existing collection.',
    },
    {
      name: 'Remove row',
      slug: 'remove-row',
      description: 'Allows removing rows from an existing collection.',
    },
    {
      name: 'View row',
      slug: 'view-row',
      description:
        'Allows viewing and listening rows from an existing collection.',
    },
  ];

  await Permission.insertMany(payload);
  console.info('🌱 \x1b[32m permissions \x1b[0m');
}
