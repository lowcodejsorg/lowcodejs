# Skill: Seeder (Mongoose)

O seeder e o padrao para popular o banco de dados com dados iniciais. O runner principal em `database/seeders/main.ts` conecta ao MongoDB via `MongooseConnect()`, usa `glob` para descobrir automaticamente todos os arquivos `*.seed.ts`, ordena-los por prefixo numerico e executa-los sequencialmente. Cada seeder usa `Model.deleteMany({})` + `Model.insertMany()` para garantir uma execucao limpa. Seeders sao executados via `npm run seed`.

---

## Estrutura do Arquivo

```
backend/
  database/
    seeders/
      main.ts                                    <-- Runner: MongooseConnect + glob + sort + import dinamico
      [numero]-[descricao].seed.ts               <-- Seeder individual
  application/
    model/
      [entity].model.ts                          <-- Models Mongoose importados nos seeders
  config/
    database.config.ts                           <-- MongooseConnect
```

- O runner vive em `database/seeders/main.ts`.
- Cada seeder vive em `database/seeders/[numero]-[descricao].seed.ts`.
- O numero prefixo garante ordem de execucao (dependencias primeiro).

---

## Template: Runner (`main.ts`)

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

## Template: Seeder Individual

```typescript
import { Entity } from '@application/model/entity.model';

export default async function Seed(): Promise<void> {
  await Entity.deleteMany({});

  const payload = [
    { name: 'Item 1', /* ... */ },
    { name: 'Item 2', /* ... */ },
  ];

  await Entity.insertMany(payload);
  console.info('  [entity] seeded');
}
```

---

## Exemplo Real

```typescript
// database/seeders/1720448435-permissions.seed.ts
import {
  E_TABLE_PERMISSION,
  type IPermission,
  Merge,
  type ValueOf,
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
    // ... mais permissions
  ];

  await Permission.insertMany(PAYLOAD_PERMISSION_SEEDER);
  console.info('  permissions seeded');
}
```

```typescript
// database/seeders/1720448445-user-group.seed.ts
import { E_ROLE } from '@application/core/entity.core';
import { Permission } from '@application/model/permission.model';
import { UserGroup } from '@application/model/user-group.model';

export default async function Seed(): Promise<void> {
  await UserGroup.deleteMany({});

  const permissions = await Permission.find();

  const permissionsAll = permissions.flatMap((p) => p?._id?.toString() || '');

  const payload = [
    {
      name: 'Master',
      slug: E_ROLE.MASTER,
      description: 'Acesso total ao sistema',
      permissions: permissionsAll,
    },
    {
      name: 'Administrator',
      slug: E_ROLE.ADMINISTRATOR,
      description: 'Gerenciamento total de tabelas',
      permissions: permissionsAll,
    },
    // ... mais groups
  ];

  await UserGroup.insertMany(payload);
  console.info('  user groups seeded');
}
```

```typescript
// database/seeders/1720465892-users.seed.ts
import bcrypt from 'bcryptjs';
import { E_ROLE, E_USER_STATUS } from '@application/core/entity.core';
import { UserGroup } from '@application/model/user-group.model';
import { User } from '@application/model/user.model';

export default async function Seed(): Promise<void> {
  await User.deleteMany({});

  const groups = await UserGroup.find();
  const masterGroup = groups.find((g) => g.slug === E_ROLE.MASTER);
  const adminGroup = groups.find((g) => g.slug === E_ROLE.ADMINISTRATOR);

  const password = await bcrypt.hash('10203040', 6);

  const payload = [
    {
      name: 'admin',
      group: adminGroup?._id?.toString(),
      email: 'admin@admin.com',
      password: await bcrypt.hash('admin', 6),
      status: E_USER_STATUS.ACTIVE,
    },
    {
      name: 'master',
      group: masterGroup?._id?.toString(),
      email: 'master@example.com',
      password,
      status: E_USER_STATUS.ACTIVE,
    },
  ];

  await User.insertMany(payload);
  console.info('  users seeded');
}
```

**Leitura do exemplo:**

1. O numero `1720448435` no nome do arquivo garante a ordem de execucao. Seeders com numero menor executam primeiro.
2. `export default async function Seed()` e o padrao -- o runner usa `import()` dinamico e espera um default export.
3. `deleteMany({})` limpa a collection antes de inserir, garantindo que re-execucoes nao criem duplicatas.
4. `insertMany(payload)` insere todos os registros de uma vez (batch insert).
5. Seeders podem depender de dados de seeders anteriores (user-group busca permissions via `Permission.find()`), garantido pelo numero prefixo.
6. `_id?.toString()` converte ObjectId para string ao usar como referencia em outro model.
7. Sem `prisma.$disconnect()` -- o Mongoose gerencia conexoes internamente. O `process.exit(0)` no runner encerra o processo.

---

## Como Criar um Novo Seeder

### Passo 1: Gerar numero prefixo

```bash
# No terminal
node -e "console.log(Date.now())"
# Saida: 1764539798006
```

### Passo 2: Criar arquivo

```
database/seeders/1764539798006-[descricao].seed.ts
```

### Passo 3: Implementar com deleteMany + insertMany

```typescript
import { Entity } from '@application/model/entity.model';

export default async function Seed(): Promise<void> {
  await Entity.deleteMany({});

  const payload = [
    // registros
  ];

  await Entity.insertMany(payload);
  console.info('  [entity] seeded');
}
```

---

## Regras e Convencoes

1. **Numero prefixo obrigatorio** -- todo seeder deve ter prefixo numerico (tipicamente timestamp Unix em milliseconds) para controle de ordem: `[numero]-[descricao].seed.ts`.

2. **`export default async function Seed()`** -- o runner espera um default export que e uma funcao async. Use nome `Seed` (nao anonimo).

3. **`deleteMany({})` + `insertMany(payload)`** -- para garantir idempotencia, sempre limpe a collection antes de inserir. Nao use `upsert` do Prisma.

4. **`Model.find()` para buscar dependencias** -- seeders que dependem de dados de outros seeders devem buscar via `Model.find()` (ex.: buscar groups para obter `_id`).

5. **Sem `$disconnect()`** -- nao precisa desconectar o Mongoose manualmente. O `process.exit(0)` no runner encerra o processo.

6. **Ordem por dependencia** -- seeders que dependem de dados de outros seeders devem ter numero maior. Ex.: users (que dependem de user-groups) devem vir depois.

7. **Dados no proprio arquivo** -- os dados do seeder sao definidos como constantes no proprio arquivo, nao carregados de arquivo externo.

8. **Variaveis de ambiente via `Env`** -- dados sensiveis (email admin, password) podem vir de `Env` importado de `@start/env`.

9. **Nao modificar o runner** -- o `main.ts` e generico e nao deve ser alterado. Novos seeders sao adicionados apenas criando novos arquivos `*.seed.ts`.

10. **`MongooseConnect()` no runner** -- o runner conecta ao MongoDB antes de executar os seeders. Nao conecte nos seeders individuais.

---

## Checklist

- [ ] O arquivo esta em `database/seeders/[numero]-[descricao].seed.ts`.
- [ ] O numero prefixo e um timestamp ou numero sequencial.
- [ ] O arquivo exporta `export default async function Seed()`.
- [ ] Usa `Model.deleteMany({})` para limpar a collection.
- [ ] Usa `Model.insertMany(payload)` para inserir em massa.
- [ ] Dependencias sao buscadas via `Model.find()` (nao hardcoded IDs).
- [ ] Dados de dependencia sao criados por seeders com numero menor.
- [ ] Nao ha `prisma.$disconnect()` ou `mongoose.disconnect()` no seeder.
- [ ] Dados sensiveis vem de `Env`, nao hardcoded.
- [ ] O runner (`main.ts`) chama `MongooseConnect()` antes de executar.

---

## Erros Comuns

| Erro | Causa | Correcao |
|------|-------|----------|
| Seeder nao executado | Arquivo nao segue padrao `*.seed.ts` | Renomear para `[numero]-[nome].seed.ts` |
| Duplicatas criadas | Usando `insertMany` sem `deleteMany` antes | Adicionar `Model.deleteMany({})` antes do `insertMany` |
| Erro de referencia | Seeder executa antes da dependencia | Ajustar numero para ser maior que o da dependencia |
| `Cannot find module` | Import path incorreto | Usar path aliases: `@application/model/...` |
| `MissingSchemaError` | Model nao registrado no Mongoose | Verificar que o model esta importado em `database.config.ts` |
| Runner nao encontra seeders | Glob pattern errado | Verificar que `main.ts` usa `*.seed.{js,ts}` como pattern |
| Usando `upsert` do Prisma | Pattern antigo, nao funciona com Mongoose | Usar `deleteMany({})` + `insertMany(payload)` |

---

**Cross-references:** ver [008-skill-model.md](./008-skill-model.md) para a definicao dos Models Mongoose, [031-skill-validacao-env.md](./031-skill-validacao-env.md) para validacao das variaveis de ambiente.
