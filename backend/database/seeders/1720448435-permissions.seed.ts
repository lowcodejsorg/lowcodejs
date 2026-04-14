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
  const PAYLOAD_PERMISSION_SEEDER: PayloadPermissionSeeder[] = [
    {
      name: 'Criar tabela',
      slug: E_TABLE_PERMISSION.CREATE_TABLE,
      description: 'Permite criar uma nova tabela',
    },
    {
      name: 'Editar tabela',
      slug: E_TABLE_PERMISSION.UPDATE_TABLE,
      description: 'Permite editar dados de uma tabela existente',
    },
    {
      name: 'Remover tabela',
      slug: E_TABLE_PERMISSION.REMOVE_TABLE,
      description: 'Permite remover ou excluir tabelas existentes',
    },
    {
      name: 'Visualizar tabela',
      slug: E_TABLE_PERMISSION.VIEW_TABLE,
      description: 'Permite visualizar tabelas existentes',
    },
    {
      name: 'Criar campo',
      slug: E_TABLE_PERMISSION.CREATE_FIELD,
      description: 'Permite criar um campo em uma tabela existente',
    },
    {
      name: 'Editar campo',
      slug: E_TABLE_PERMISSION.UPDATE_FIELD,
      description: 'Permite editar dados de um campo em uma tabela existente',
    },
    {
      name: 'Remover campo',
      slug: E_TABLE_PERMISSION.REMOVE_FIELD,
      description: 'Permite remover ou excluir campos de uma tabela existente',
    },
    {
      name: 'Visualizar campo',
      slug: E_TABLE_PERMISSION.VIEW_FIELD,
      description: 'Permite visualizar campos de uma tabela existente',
    },
    {
      name: 'Criar registro',
      slug: E_TABLE_PERMISSION.CREATE_ROW,
      description: 'Permite criar novos registros em uma tabela existente',
    },
    {
      name: 'Editar registro',
      slug: E_TABLE_PERMISSION.UPDATE_ROW,
      description:
        'Permite editar dados de um registro em uma tabela existente',
    },
    {
      name: 'Remover registro',
      slug: E_TABLE_PERMISSION.REMOVE_ROW,
      description: 'Permite remover registros de uma tabela existente',
    },
    {
      name: 'Visualizar registro',
      slug: E_TABLE_PERMISSION.VIEW_ROW,
      description: 'Permite visualizar registros de uma tabela existente',
    },
  ];

  for (const payload of PAYLOAD_PERMISSION_SEEDER) {
    await Permission.findOneAndUpdate(
      { slug: payload.slug },
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  console.info('🌱 \x1b[32m permissions \x1b[0m');
}
