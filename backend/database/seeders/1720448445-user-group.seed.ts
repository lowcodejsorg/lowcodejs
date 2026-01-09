import {
  E_ROLE,
  E_TABLE_PERMISSION,
  Merge,
  type Optional,
} from '@application/core/entity.core';
import { Permission } from '@application/model/permission.model';
import { UserGroup } from '@application/model/user-group.model';

import { PayloadPermissionSeeder } from './1720448435-permissions.seed';

type Payload = Omit<
  Optional<
    import('@application/core/entity.core').IGroup,
    '_id' | 'createdAt' | 'updatedAt' | 'trashed' | 'trashedAt'
  >,
  'permissions'
> & { permissions: string[] };

export default async function Seed(): Promise<void> {
  await UserGroup.deleteMany({});

  const permissions: Merge<PayloadPermissionSeeder, { _id: string }>[] =
    await Permission.find();

  // Super Admin (Master): TODAS as permissões do sistema
  const permissionsSuper = permissions.flatMap((p) => p?._id?.toString() || '');

  // Administrator: TODAS as permissões (mesmas do Super Admin, exceto grupo de usuários e sistema)
  const permissionsAdministrator = permissions.flatMap(
    (p) => p?._id?.toString() || '',
  );

  // Manager: Pode criar tabelas próprias e gerenciar onde é admin/dono
  const permissionsManager = permissions
    ?.filter((p) =>
      [
        E_TABLE_PERMISSION.CREATE_TABLE, // apenas tabelas próprias
        E_TABLE_PERMISSION.UPDATE_TABLE, // somente tabelas próprias ou onde é admin
        E_TABLE_PERMISSION.REMOVE_TABLE, // somente tabelas próprias ou onde é admin
        E_TABLE_PERMISSION.VIEW_TABLE, // Sim (respeitando visibilidade)
        E_TABLE_PERMISSION.CREATE_FIELD, // somente tabelas próprias ou onde é admin
        E_TABLE_PERMISSION.UPDATE_FIELD, // somente tabelas próprias ou onde é admin
        E_TABLE_PERMISSION.REMOVE_FIELD, // somente tabelas próprias ou onde é admin
        E_TABLE_PERMISSION.VIEW_FIELD, // Sim
        E_TABLE_PERMISSION.CREATE_ROW, // Sim (respeitando visibilidade)
        E_TABLE_PERMISSION.UPDATE_ROW, // somente tabelas próprias ou onde é admin
        E_TABLE_PERMISSION.REMOVE_ROW, // somente tabelas próprias ou onde é admin
        E_TABLE_PERMISSION.VIEW_ROW, // Sim (respeitando visibilidade)
      ].includes(p.slug),
    )
    .flatMap((p) => p?._id?.toString() || '');

  // Registered: Acesso limitado, só gerencia onde é admin
  const permissionsRegistered = permissions
    ?.filter((p) =>
      [
        E_TABLE_PERMISSION.VIEW_TABLE, // Sim (respeitando visibilidade)
        E_TABLE_PERMISSION.VIEW_ROW, // Sim (respeitando visibilidade)
        // @ts-ignore
      ].includes(p.slug),
    )
    .flatMap((p) => p._id?.toString() || '');

  const payload: Payload[] = [
    {
      name: 'Master',
      slug: E_ROLE.MASTER,
      description:
        'Acesso total ao sistema - gerencia tudo, incluindo configurações do sistema',
      permissions: permissionsSuper,
    },
    {
      name: 'Administrator',
      slug: E_ROLE.ADMINISTRATOR,
      description:
        'Gerenciamento total de tabelas - gerencia todas as tabelas, campos e registros',
      permissions: permissionsAdministrator,
    },
    {
      name: 'Manager',
      slug: E_ROLE.MANAGER,
      description:
        'Cria suas próprias tabelas e gerencia tabelas onde é proprietário ou administrador. Pode visualizar e criar registros em todas as tabelas acessíveis',
      permissions: permissionsManager,
    },
    {
      name: 'Registered',
      slug: E_ROLE.REGISTERED,
      description:
        'Pode visualizar tabelas e criar registros (respeitando visibilidade). Gerencia apenas tabelas onde é administrador',
      permissions: permissionsRegistered,
    },
  ];

  await UserGroup.insertMany(payload);
  console.info('🌱 \x1b[32m user groups \x1b[0m');
}
