import {
  E_ROLE,
  E_TABLE_PERMISSION,
  ValueOf,
} from '@application/core/entity.core';
import { Permission } from '@application/model/permission.model';
import { UserGroup } from '@application/model/user-group.model';

type GroupMetadata = {
  name: string;
  slug: ValueOf<typeof E_ROLE>;
  description: string;
};

const GROUP_METADATA: GroupMetadata[] = [
  {
    name: 'Master',
    slug: E_ROLE.MASTER,
    description:
      'Acesso total ao sistema - gerencia tudo, incluindo configurações do sistema',
  },
  {
    name: 'Administrator',
    slug: E_ROLE.ADMINISTRATOR,
    description:
      'Gerenciamento total de tabelas - gerencia todas as tabelas, campos e registros',
  },
  {
    name: 'Manager',
    slug: E_ROLE.MANAGER,
    description:
      'Cria suas próprias tabelas e gerencia tabelas onde é proprietário ou administrador. Pode visualizar e criar registros em todas as tabelas acessíveis',
  },
  {
    name: 'Registered',
    slug: E_ROLE.REGISTERED,
    description:
      'Pode visualizar tabelas e criar registros (respeitando visibilidade). Gerencia apenas tabelas onde é administrador',
  },
];

const MANAGER_PERMISSIONS: ValueOf<typeof E_TABLE_PERMISSION>[] = [
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
];

const REGISTERED_PERMISSIONS: ValueOf<typeof E_TABLE_PERMISSION>[] = [
  E_TABLE_PERMISSION.VIEW_TABLE,
  E_TABLE_PERMISSION.VIEW_FIELD,
  E_TABLE_PERMISSION.VIEW_ROW,
  E_TABLE_PERMISSION.CREATE_ROW,
];

export default async function Seed(): Promise<void> {
  const permissions = await Permission.find({ trashed: false });

  const permissionIdBySlug = new Map<string, unknown>();
  for (const permission of permissions) {
    permissionIdBySlug.set(permission.slug, permission._id);
  }

  const permissionsBySlug: Record<string, unknown[]> = {
    [E_ROLE.MASTER]: permissions.map((p) => p._id),
    [E_ROLE.ADMINISTRATOR]: permissions.map((p) => p._id),
    [E_ROLE.MANAGER]: MANAGER_PERMISSIONS.flatMap((slug) => {
      const id = permissionIdBySlug.get(slug);
      if (!id) return [];
      return [id];
    }),
    [E_ROLE.REGISTERED]: REGISTERED_PERMISSIONS.flatMap((slug) => {
      const id = permissionIdBySlug.get(slug);
      if (!id) return [];
      return [id];
    }),
  };

  const ops = GROUP_METADATA.map(({ slug, name, description }) => ({
    updateOne: {
      filter: { slug },
      update: {
        $set: { slug, name, description },
        $setOnInsert: { permissions: permissionsBySlug[slug] ?? [] },
      },
      upsert: true,
    },
  }));

  // @ts-expect-error IGroup.permissions é tipado como IPermission[] (populado), mas o schema guarda ObjectId[]
  await UserGroup.bulkWrite(ops);
  console.info('🌱 \x1b[32m user groups \x1b[0m');
}
