import {
  E_TABLE_PERMISSION,
  IPermission,
  Merge,
  ValueOf,
} from '@application/core/entity.core';
import { Permission } from '@application/model/permission.model';

export type PayloadPermissionSeeder = Merge<
  Pick<IPermission, 'name' | 'description'>,
  { slug: ValueOf<typeof E_TABLE_PERMISSION> }
>;

export default async function Seed(): Promise<void> {
  await Permission.deleteMany({});

  const PAYLOAD_PERMISSION_SEEDER: PayloadPermissionSeeder[] = [
    {
      name: 'Create table',
      slug: E_TABLE_PERMISSION.CREATE_TABLE,
      description: 'Allows creating a new table',
    },
    {
      name: 'Update table',
      slug: E_TABLE_PERMISSION.UPDATE_TABLE,
      description: 'Allows updating data of an existing table.',
    },
    {
      name: 'Remove table',
      slug: E_TABLE_PERMISSION.REMOVE_TABLE,
      description: 'Allows removing or deleting existing tables.',
    },
    {
      name: 'View table',
      slug: E_TABLE_PERMISSION.VIEW_TABLE,
      description: 'Allows viewing and listening existing tables',
    },
    {
      name: 'Create field',
      slug: E_TABLE_PERMISSION.CREATE_FIELD,
      description: 'Allows creating a field in an existing table',
    },
    {
      name: 'Update field',
      slug: E_TABLE_PERMISSION.UPDATE_FIELD,
      description: 'Allows updating field data in an existing table',
    },
    {
      name: 'Remove field',
      slug: E_TABLE_PERMISSION.REMOVE_FIELD,
      description: 'Allows removing or deleting fields from an existing table.',
    },
    {
      name: 'View field',
      slug: E_TABLE_PERMISSION.VIEW_FIELD,
      description:
        'Allows viewing and listening fields from an existing table.',
    },
    {
      name: 'Create row',
      slug: E_TABLE_PERMISSION.CREATE_ROW,
      description: 'Allows creating new rows in an existing table',
    },
    {
      name: 'Update row',
      slug: E_TABLE_PERMISSION.UPDATE_ROW,
      description: 'Allows updating row data in an existing table.',
    },
    {
      name: 'Remove row',
      slug: E_TABLE_PERMISSION.REMOVE_ROW,
      description: 'Allows removing rows from an existing table.',
    },
    {
      name: 'View row',
      slug: E_TABLE_PERMISSION.VIEW_ROW,
      description: 'Allows viewing and listening rows from an existing table.',
    },
  ];

  await Permission.insertMany(PAYLOAD_PERMISSION_SEEDER);
  console.info('🌱 \x1b[32m permissions \x1b[0m');
}
