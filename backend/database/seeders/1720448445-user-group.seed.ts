import type { Optional } from '@application/core/entity.core';
import { Permission } from '@application/model/permission.model';
import { UserGroup } from '@application/model/user-group.model';
import { GroupSlugMapper } from '@config/util.config';

type Payload = Optional<
  import('@application/core/entity.core').UserGroup,
  '_id' | 'createdAt' | 'updatedAt' | 'trashed' | 'trashedAt'
>;

export default async function Seed(): Promise<void> {
  await UserGroup.deleteMany({});

  const permissions = await Permission.find();

  // Super Admin (Master): TODAS as permissões do sistema
  const permissionsSuper = permissions.flatMap((p) => p?._id?.toString() || '');

  // Administrator: TODAS as permissões (mesmas do Super Admin, exceto grupo de usuários e sistema)
  const permissionsAdministrator = permissions.flatMap(
    (p) => p?._id?.toString() || '',
  );

  // Manager: Pode criar tabelas próprias e gerenciar onde é admin/dono
  // ✅ INCLUI create-field (faltava antes)
  const permissionsManager = permissions
    ?.filter((p) =>
      [
        'create-table', // apenas tabelas próprias
        'update-table', // somente tabelas próprias ou onde é admin
        'remove-table', // somente tabelas próprias ou onde é admin
        'view-table', // Sim (respeitando visibilidade)
        'create-field', // ✅ ADICIONADO - somente tabelas próprias ou onde é admin
        'update-field', // somente tabelas próprias ou onde é admin
        'remove-field', // somente tabelas próprias ou onde é admin
        'view-field', // Sim
        'create-row', // Sim (respeitando visibilidade)
        'update-row', // somente tabelas próprias ou onde é admin
        'remove-row', // somente tabelas próprias ou onde é admin
        'view-row', // Sim (respeitando visibilidade)
      ].includes(p?.slug),
    )
    .flatMap((p) => p?._id?.toString() || '');

  // Registered: Acesso limitado, só gerencia onde é admin
  // ✅ INCLUI create-row (faltava antes)
  const permissionsRegistered = permissions
    ?.filter((p) =>
      [
        'update-table', // apenas onde é admin
        'remove-table', // apenas onde é admin
        'view-table', // Sim (respeitando visibilidade)
        'create-field', // apenas onde é admin
        'update-field', // apenas onde é admin
        'remove-field', // apenas onde é admin
        'view-field', // Sim
        'create-row', // ✅ ADICIONADO - Sim (respeitando visibilidade)
        'update-row', // apenas onde é admin
        'remove-row', // apenas onde é admin
        'view-row', // Sim (respeitando visibilidade)
      ].includes(p?.slug),
    )
    .flatMap((p) => p._id?.toString() || '');

  const payload: Payload[] = [
    {
      name: 'Super Admin',
      slug: GroupSlugMapper.MASTER,
      description:
        'Full system access - manages everything including system configurations',
      permissions: permissionsSuper,
    },
    {
      name: 'Administrator',
      slug: GroupSlugMapper.ADMINISTRATOR,
      description:
        'Full table management - manages all tables, fields and records',
      permissions: permissionsAdministrator,
    },
    {
      name: 'Manager',
      slug: GroupSlugMapper.MANAGER,
      description:
        'Creates own tables and manages tables where is owner or admin. Can view and create records in all accessible tables',
      permissions: permissionsManager,
    },
    {
      name: 'Registered',
      slug: GroupSlugMapper.REGISTERED,
      description:
        'Can view tables and create records (respecting visibility). Manages only tables where is admin',
      permissions: permissionsRegistered,
    },
  ];

  await UserGroup.insertMany(payload);
  console.info('🌱 \x1b[32m user groups \x1b[0m');
}
