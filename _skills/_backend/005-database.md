# Diretorio `database/`

## Visao Geral

O diretorio `database/` contem o sistema de seeders da aplicacao, responsavel por popular o banco de dados com dados iniciais necessarios para o funcionamento do sistema (permissoes, grupos de usuarios e usuarios padrao).

---

## Estrutura

```
database/
└── seeders/
    ├── main.ts                             # Orquestrador dos seeders
    ├── 1720448435-permissions.seed.ts       # Seeder de permissoes
    ├── 1720448445-user-group.seed.ts        # Seeder de grupos de usuarios
    └── 1720465892-users.seed.ts             # Seeder de usuarios
```

---

## Comando para executar seeders

```bash
npm run seed
```

Que executa:

```bash
node --import @swc-node/register/esm-register database/seeders/main.ts
```

- `--import @swc-node/register/esm-register`: Registra o SWC para compilar TypeScript em tempo real
- O script conecta ao banco de dados, executa todos os seeders em ordem e encerra o processo

---

## `main.ts` - Orquestrador

O arquivo principal que descobre e executa todos os seeders automaticamente.

### Codigo fonte

```typescript
import { glob } from 'glob';

import { MongooseConnect } from '@config/database.config';

async function seed(): Promise<void> {
  await MongooseConnect();
  let seeders = await glob(process.cwd() + '/database/seeders/*.seed.{js,ts}');

  seeders = seeders.sort((a, b) => {
    return a.localeCompare(b);
  });

  console.info('Seeding...\n');

  for (const seeder of seeders) {
    console.info(`Seeding ${seeder}`);
    const { default: main } = await import(seeder);
    await main();
  }

  console.info('\nSeeding complete!');
  process.exit(0);
}

seed();
```

### Fluxo de execucao

```
1. MongooseConnect()        → Conecta ao MongoDB
2. glob('*.seed.{js,ts}')  → Descobre todos os arquivos de seed
3. sort()                   → Ordena por nome (timestamp garante a ordem)
4. for...of                 → Executa cada seeder sequencialmente
5. process.exit(0)          → Encerra o processo com sucesso
```

### Convencao de nomenclatura

Os arquivos de seed seguem o padrao: `<timestamp>-<nome>.seed.ts`

O prefixo numerico (timestamp Unix) garante a ordem de execucao, pois a ordenacao lexicografica (`localeCompare`) coloca os seeders com timestamps menores primeiro.

| Timestamp | Nome | Ordem |
|---|---|---|
| `1720448435` | permissions | 1 |
| `1720448445` | user-group | 2 |
| `1720465892` | users | 3 |

A ordem e importante pois existem dependencias entre os seeders: os grupos de usuarios dependem das permissoes, e os usuarios dependem dos grupos.

---

## `1720448435-permissions.seed.ts` - Permissoes

Cria as 12 permissoes base do sistema, organizadas em 3 entidades (TABLE, FIELD, ROW) com 4 operacoes cada (CREATE, UPDATE, REMOVE, VIEW).

### Codigo fonte

```typescript
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
    // ... demais permissoes
  ];

  await Permission.insertMany(PAYLOAD_PERMISSION_SEEDER);
}
```

### Tabela de permissoes

O seeder limpa todas as permissoes existentes (`deleteMany({})`) e recria as 12 permissoes:

#### Permissoes de Tabela (TABLE)

| Slug | Nome | Descricao |
|---|---|---|
| `CREATE_TABLE` | Create table | Permite criar uma nova tabela |
| `UPDATE_TABLE` | Update table | Permite atualizar dados de uma tabela existente |
| `REMOVE_TABLE` | Remove table | Permite remover ou deletar tabelas existentes |
| `VIEW_TABLE` | View table | Permite visualizar e listar tabelas existentes |

#### Permissoes de Campo (FIELD)

| Slug | Nome | Descricao |
|---|---|---|
| `CREATE_FIELD` | Create field | Permite criar um campo em uma tabela existente |
| `UPDATE_FIELD` | Update field | Permite atualizar dados de campo em uma tabela existente |
| `REMOVE_FIELD` | Remove field | Permite remover ou deletar campos de uma tabela existente |
| `VIEW_FIELD` | View field | Permite visualizar e listar campos de uma tabela existente |

#### Permissoes de Registro (ROW)

| Slug | Nome | Descricao |
|---|---|---|
| `CREATE_ROW` | Create row | Permite criar novos registros em uma tabela existente |
| `UPDATE_ROW` | Update row | Permite atualizar dados de registro em uma tabela existente |
| `REMOVE_ROW` | Remove row | Permite remover registros de uma tabela existente |
| `VIEW_ROW` | View row | Permite visualizar e listar registros de uma tabela existente |

---

## `1720448445-user-group.seed.ts` - Grupos de Usuarios

Cria os 4 grupos de usuarios (roles) do sistema, cada um com seu conjunto de permissoes.

### Codigo fonte

```typescript
import {
  E_ROLE,
  E_TABLE_PERMISSION,
  Merge,
  type Optional,
} from '@application/core/entity.core';
import { Permission } from '@application/model/permission.model';
import { UserGroup } from '@application/model/user-group.model';

export default async function Seed(): Promise<void> {
  await UserGroup.deleteMany({});

  const permissions = await Permission.find();

  // Super Admin (Master): TODAS as permissoes do sistema
  const permissionsSuper = permissions.flatMap((p) => p?._id?.toString() || '');

  // Administrator: TODAS as permissoes
  const permissionsAdministrator = permissions.flatMap(
    (p) => p?._id?.toString() || '',
  );

  // Manager: Pode criar tabelas proprias e gerenciar onde e admin/dono
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

  // Registered: Acesso limitado
  const permissionsRegistered = permissions
    ?.filter((p) =>
      [
        E_TABLE_PERMISSION.VIEW_TABLE,
        E_TABLE_PERMISSION.VIEW_FIELD,
        E_TABLE_PERMISSION.VIEW_ROW,
        E_TABLE_PERMISSION.CREATE_ROW,
      ].includes(p.slug),
    )
    .flatMap((p) => p._id?.toString() || '');

  const payload = [
    {
      name: 'Master',
      slug: E_ROLE.MASTER,
      description: 'Acesso total ao sistema...',
      permissions: permissionsSuper,
    },
    // ... demais grupos
  ];

  await UserGroup.insertMany(payload);
}
```

### Tabela de grupos

O seeder limpa todos os grupos existentes, busca as permissoes criadas pelo seeder anterior e cria os 4 grupos:

| Grupo | Slug | Permissoes | Descricao |
|---|---|---|---|
| **Master** | `MASTER` | Todas (12) | Acesso total ao sistema, incluindo configuracoes do sistema |
| **Administrator** | `ADMINISTRATOR` | Todas (12) | Gerenciamento total de tabelas, campos e registros |
| **Manager** | `MANAGER` | Todas (12)* | Cria tabelas proprias e gerencia tabelas onde e proprietario ou administrador |
| **Registered** | `REGISTERED` | 4 | Visualiza tabelas e cria registros (respeitando visibilidade) |

*O Manager recebe todas as 12 permissoes no seeder, mas a logica de negocio restringe o escopo: ele so pode operar sobre tabelas proprias ou onde e administrador.

### Detalhamento de permissoes do Registered

O grupo Registered recebe apenas as permissoes minimas para interagir com o sistema:

- `VIEW_TABLE` - Visualizar tabelas (respeitando visibilidade)
- `VIEW_FIELD` - Visualizar campos (necessario para ver a estrutura da tabela)
- `VIEW_ROW` - Visualizar registros (respeitando visibilidade)
- `CREATE_ROW` - Criar registros (respeitando visibilidade)

### Dependencia

Este seeder depende do seeder de permissoes (`1720448435-permissions.seed.ts`), pois busca os IDs das permissoes ja criadas via `Permission.find()` para associa-las aos grupos.

---

## `1720465892-users.seed.ts` - Usuarios

Cria os 5 usuarios iniciais do sistema, um para cada grupo (com um usuario extra de admin).

### Codigo fonte

```typescript
import bcrypt from 'bcryptjs';

import { E_ROLE, E_USER_STATUS } from '@application/core/entity.core';
import { UserGroup } from '@application/model/user-group.model';
import { User } from '@application/model/user.model';

export default async function Seed(): Promise<void> {
  await User.deleteMany({});

  const groups = await UserGroup.find();

  const masterGroup = groups.find((g) => g.slug === E_ROLE.MASTER);
  const administratorGroup = groups.find((g) => g.slug === E_ROLE.ADMINISTRATOR);
  const managerGroup = groups.find((g) => g.slug === E_ROLE.MANAGER);
  const registeredGroup = groups.find((g) => g.slug === E_ROLE.REGISTERED);

  const password = await bcrypt.hash('10203040', 6);
  const payload = [
    {
      name: 'admin',
      group: administratorGroup?._id?.toString(),
      email: 'admin@admin.com',
      password: await bcrypt.hash('admin', 6),
      status: E_USER_STATUS.ACTIVE,
    },
    {
      name: 'master',
      group: masterGroup?._id?.toString(),
      email: 'master@lowcodejs.org',
      password,
      status: E_USER_STATUS.ACTIVE,
    },
    {
      name: 'administrator',
      group: administratorGroup?._id?.toString(),
      email: 'administrator@lowcodejs.org',
      password,
      status: E_USER_STATUS.ACTIVE,
    },
    {
      name: 'manager',
      group: managerGroup?._id?.toString(),
      email: 'manager@lowcodejs.org',
      password,
      status: E_USER_STATUS.ACTIVE,
    },
    {
      name: 'registered',
      group: registeredGroup?._id?.toString(),
      email: 'registered@lowcodejs.org',
      password,
      status: E_USER_STATUS.ACTIVE,
    },
  ];

  await User.insertMany(payload);
}
```

### Tabela de usuarios

O seeder limpa todos os usuarios existentes, busca os grupos criados pelo seeder anterior e cria 5 usuarios:

| Nome | Email | Grupo | Senha | Status |
|---|---|---|---|---|
| admin | `admin@admin.com` | Administrator | `admin` | ACTIVE |
| master | `master@lowcodejs.org` | Master | `10203040` | ACTIVE |
| administrator | `administrator@lowcodejs.org` | Administrator | `10203040` | ACTIVE |
| manager | `manager@lowcodejs.org` | Manager | `10203040` | ACTIVE |
| registered | `registered@lowcodejs.org` | Registered | `10203040` | ACTIVE |

### Senhas

As senhas sao hasheadas com **bcrypt** usando salt round de **6**:

- O usuario `admin` possui senha propria (`admin`)
- Os demais usuarios compartilham a mesma senha (`10203040`)

O hash e gerado uma unica vez para a senha compartilhada e reutilizado para otimizar a execucao:

```typescript
const password = await bcrypt.hash('10203040', 6);
```

### Dependencia

Este seeder depende do seeder de grupos de usuarios (`1720448445-user-group.seed.ts`), pois busca os IDs dos grupos via `UserGroup.find()` para associa-los aos usuarios.

---

## Cadeia de dependencias

```
1. permissions.seed.ts     → Sem dependencias
        |
        v
2. user-group.seed.ts     → Depende das permissoes (Permission.find())
        |
        v
3. users.seed.ts           → Depende dos grupos (UserGroup.find())
```

Cada seeder executa `deleteMany({})` antes de inserir os dados, garantindo que a execucao seja idempotente: rodar o seed multiplas vezes produz sempre o mesmo resultado.

---

## Criando um novo seeder

Para adicionar um novo seeder:

1. Crie um arquivo em `database/seeders/` com o padrao `<timestamp>-<nome>.seed.ts`
2. Exporte uma funcao `default` assincrona
3. O timestamp deve ser maior que o do ultimo seeder para garantir a ordem

```typescript
// database/seeders/1720500000-meu-seeder.seed.ts
export default async function Seed(): Promise<void> {
  // Limpar dados existentes
  await MeuModel.deleteMany({});

  // Inserir dados iniciais
  await MeuModel.insertMany([
    { nome: 'Exemplo 1' },
    { nome: 'Exemplo 2' },
  ]);

  console.info('Meu seeder executado');
}
```

O arquivo sera automaticamente descoberto e executado pelo `main.ts` na proxima execucao de `npm run seed`.
