import type { Optional } from '@core/entity.core';
import { Permission } from '@model/permission.model';
import { UserGroup } from '@model/user-group.model';

type Payload = Optional<
  import('@core/entity.core').UserGroup,
  '_id' | 'createdAt' | 'updatedAt' | 'trashed' | 'trashedAt'
>;

export default async function Seed(): Promise<void> {
  await UserGroup.deleteMany({});

  const permissions = await Permission.find();

  // Super Admin: TODAS as permissões (gerencia tudo + configurações do sistema)
  const permissionsSuper = permissions.flatMap((p) => p?._id?.toString() || '');

  // Administrator: TODAS as permissões EXCETO configurações do sistema
  // (gerencia todas as listas e usuários, mas não configurações do sistema)
  const permissionsAdministrator = permissions
    // ?.filter((p) => p?.slug !== 'create-collection') // Assumindo que create-collection é configuração do sistema
    .flatMap((p) => p?._id?.toString() || '');

  // Manager: Pode criar, alterar, remover e consultar listas e seus campos/registros
  // (cria lista e gerencia suas próprias listas)
  const permissionsManager = permissions
    ?.filter((p) =>
      [
        'create-collection',
        'update-collection',
        'view-collection',
        'create-field',
        'update-field',
        'remove-field',
        'view-field',
        'create-row',
        'update-row',
        'remove-row',
        'view-row',
      ].includes(p?.slug),
    )
    .flatMap((p) => p?._id?.toString() || '');

  // Registered: Apenas visualizar listas/registros e criar registros
  // (apenas acessa as listas e insere registros)
  const permissionsRegistered = permissions
    ?.filter((p) =>
      [
        'view-list',
        'view-row',
        //  'create-row'
      ].includes(p?.slug),
    )
    .flatMap((p) => p._id?.toString() || '');

  const payload: Payload[] = [
    {
      name: 'Master',
      slug: 'master',
      description: 'Manages all lists and also system configurations',
      permissions: permissionsSuper,
    },
    {
      name: 'Administrator',
      slug: 'administrator',
      description: 'Manages all lists and users',
      permissions: permissionsAdministrator,
    },
    {
      name: 'Manager',
      slug: 'manager',
      description: 'Creates lists and manages their own lists',
      permissions: permissionsManager,
    },
    {
      name: 'Registered',
      slug: 'registered',
      description: 'Only accesses lists and inserts rows',
      permissions: permissionsRegistered,
    },
  ];

  await UserGroup.insertMany(payload);
  console.info('🌱 \x1b[32m user groups \x1b[0m');
}
