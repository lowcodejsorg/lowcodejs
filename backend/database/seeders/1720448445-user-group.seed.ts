import { E_ROLE, type Optional } from '@application/core/entity.core';
import { Permission } from '@application/model/permission.model';
import { UserGroup } from '@application/model/user-group.model';

type Payload = Optional<
  import('@application/core/entity.core').IGroup,
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
