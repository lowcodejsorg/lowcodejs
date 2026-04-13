import {
  E_ROLE,
  E_SYSTEM_PERMISSION,
  E_TABLE_PERMISSION,
  Merge,
  type ISystemPermissions,
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
  'permissions' | 'encompasses' | 'systemPermissions'
> & {
  permissions: string[];
  encompasses: string[];
  systemPermissions: ISystemPermissions;
};

function buildSystemPermissions(
  enabled: Array<
    (typeof E_SYSTEM_PERMISSION)[keyof typeof E_SYSTEM_PERMISSION]
  >,
): ISystemPermissions {
  const permissions = {} as ISystemPermissions;

  for (const key of Object.values(E_SYSTEM_PERMISSION)) {
    permissions[key] = enabled.includes(key);
  }

  return permissions;
}

export default async function Seed(): Promise<void> {
  await UserGroup.deleteMany({});

  const permissions: Merge<PayloadPermissionSeeder, { _id: string }>[] =
    await Permission.find();

  const permissionsAll = permissions.flatMap((p) => p?._id?.toString() || '');

  const permissionsManager = permissions
    ?.filter((p) =>
      [
        E_TABLE_PERMISSION.CREATE_TABLE,
        E_TABLE_PERMISSION.UPDATE_TABLE,
        E_TABLE_PERMISSION.REMOVE_TABLE,
        E_TABLE_PERMISSION.VIEW_TABLE,
        E_TABLE_PERMISSION.CREATE_FIELD,
        E_TABLE_PERMISSION.UPDATE_FIELD,
        E_TABLE_PERMISSION.REMOVE_FIELD,
        E_TABLE_PERMISSION.VIEW_FIELD,
        E_TABLE_PERMISSION.CREATE_ROW,
        E_TABLE_PERMISSION.UPDATE_ROW,
        E_TABLE_PERMISSION.REMOVE_ROW,
        E_TABLE_PERMISSION.VIEW_ROW,
      ].includes(p.slug),
    )
    .flatMap((p) => p?._id?.toString() || '');

  const permissionsRegistered = permissions
    ?.filter((p) =>
      [
        E_TABLE_PERMISSION.VIEW_TABLE,
        E_TABLE_PERMISSION.VIEW_FIELD,
        E_TABLE_PERMISSION.VIEW_ROW,
        E_TABLE_PERMISSION.CREATE_ROW,
      ]
        .flatMap((p) => p.toString() || '')
        .includes(p.slug),
    )
    .flatMap((p) => p._id?.toString() || '');

  const allSystemPermissions = Object.values(E_SYSTEM_PERMISSION);

  const payload: Payload[] = [
    {
      name: 'Master',
      slug: E_ROLE.MASTER,
      description:
        'Acesso total ao sistema - gerencia tudo, incluindo configurações do sistema',
      permissions: permissionsAll,
      encompasses: [],
      systemPermissions: buildSystemPermissions(allSystemPermissions),
      immutable: true,
    },
    {
      name: 'Administrator',
      slug: E_ROLE.ADMINISTRATOR,
      description:
        'Gerenciamento total de tabelas - gerencia todas as tabelas, campos e registros',
      permissions: permissionsAll,
      encompasses: [],
      systemPermissions: buildSystemPermissions([
        E_SYSTEM_PERMISSION.VIEW_TABLES,
        E_SYSTEM_PERMISSION.CREATE_TABLES,
        E_SYSTEM_PERMISSION.UPDATE_TABLES,
        E_SYSTEM_PERMISSION.REMOVE_TABLES,
        E_SYSTEM_PERMISSION.USERS,
        E_SYSTEM_PERMISSION.MENU,
      ]),
      immutable: false,
    },
    {
      name: 'Manager',
      slug: E_ROLE.MANAGER,
      description:
        'Cria suas próprias tabelas e gerencia tabelas onde é proprietário ou administrador',
      permissions: permissionsManager,
      encompasses: [],
      systemPermissions: buildSystemPermissions([
        E_SYSTEM_PERMISSION.VIEW_TABLES,
        E_SYSTEM_PERMISSION.CREATE_TABLES,
      ]),
      immutable: false,
    },
    {
      name: 'Registered',
      slug: E_ROLE.REGISTERED,
      description:
        'Pode visualizar tabelas e criar registros (respeitando visibilidade)',
      permissions: permissionsRegistered,
      encompasses: [],
      systemPermissions: buildSystemPermissions([
        E_SYSTEM_PERMISSION.VIEW_TABLES,
      ]),
      immutable: false,
    },
  ];

  const createdGroups = await UserGroup.insertMany(payload);

  const groupMap: Record<string, string> = {};
  for (const g of createdGroups) {
    groupMap[g.slug] = g._id.toString();
  }

  await UserGroup.findOneAndUpdate(
    { slug: E_ROLE.MASTER },
    { encompasses: [groupMap[E_ROLE.ADMINISTRATOR]] },
  );
  await UserGroup.findOneAndUpdate(
    { slug: E_ROLE.ADMINISTRATOR },
    { encompasses: [groupMap[E_ROLE.MANAGER]] },
  );
  await UserGroup.findOneAndUpdate(
    { slug: E_ROLE.MANAGER },
    { encompasses: [groupMap[E_ROLE.REGISTERED]] },
  );

  console.info('🌱 \x1b[32m user groups \x1b[0m');
}
