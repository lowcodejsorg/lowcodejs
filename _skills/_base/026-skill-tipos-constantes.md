# Skill: Types e Constants

Types e Constants sao os arquivos que centralizam todas as definicoes de enumeracoes, options arrays, mappers e payload types do frontend. O arquivo `constant.ts` contem objetos `as const` que funcionam como enums type-safe, arrays de opcoes para componentes de select e mappers de label. O arquivo `payloads.ts` contem os types de entrada e saida das operacoes, separados dos schemas Zod para manter responsabilidades distintas. Juntos, esses arquivos formam o vocabulario tipado que todo o frontend utiliza.

---

## Estrutura do Arquivo

```
frontend/src/lib/
  constant.ts       # Enums (E_*), options arrays, mappers, regex patterns
  payloads.ts       # Payload types para queries e mutations
  interfaces.ts     # Utility types auxiliares (Merge, ValueOf, etc.)
```

- `constant.ts` exporta objetos `as const` com prefixo `E_`, arrays de opcoes companion (`*_OPTIONS`), mappers de labels (`*_MAPPER`) e regex patterns.
- `payloads.ts` exporta types de payload que referenciam os enums de `constant.ts` usando `ValueOf<typeof E_*>`.
- `interfaces.ts` exporta utility types como `Merge` e `ValueOf` usados na composicao de payloads.

---

## Template

### constant.ts

```typescript
// Enum object -- prefixo E_, sempre as const
export const E_{{ENTITY}}_{{CAMPO}} = {
  {{VALOR_1}}: '{{VALOR_1}}',
  {{VALOR_2}}: '{{VALOR_2}}',
  {{VALOR_3}}: '{{VALOR_3}}',
} as const;

// Options array companion -- para uso em selects/dropdowns
export const {{ENTITY}}_{{CAMPO}}_OPTIONS = [
  { label: '{{Label em PT-BR}}', value: E_{{ENTITY}}_{{CAMPO}}.{{VALOR_1}} },
  { label: '{{Label em PT-BR}}', value: E_{{ENTITY}}_{{CAMPO}}.{{VALOR_2}} },
  { label: '{{Label em PT-BR}}', value: E_{{ENTITY}}_{{CAMPO}}.{{VALOR_3}} },
] as const;

// Mapper -- para exibicao de labels a partir de valores
export const {{ENTITY}}_{{CAMPO}}_MAPPER = {
  [E_{{ENTITY}}_{{CAMPO}}.{{VALOR_1}}]: '{{Label em PT-BR}}',
  [E_{{ENTITY}}_{{CAMPO}}.{{VALOR_2}}]: '{{Label em PT-BR}}',
} as const;

// Regex patterns -- para validacoes reutilizaveis
export const {{NOME}}_REGEX = /{{pattern}}/;
```

### payloads.ts

```typescript
import type { E_{{ENUM_1}}, E_{{ENUM_2}} } from './constant';
import type { Merge, ValueOf } from './interfaces';

// Payload simples
export type {{Entity}}{{Action}}Payload = {
  {{campo1}}: string;
  {{campo2}}: string;
};

// Payload com enum tipado
export type {{Entity}}{{Action}}Payload = {
  id: string;
  {{campo}}: ValueOf<typeof E_{{ENUM}}>;
};

// Base query + merge para queries paginadas
export type BaseQueryPayload = {
  page?: number;
  perPage?: number;
  search?: string;
};

export type {{Entity}}QueryPayload = Merge<BaseQueryPayload, {
  {{filtroExtra}}?: { id: string; {{campo}}: ValueOf<typeof E_{{ENUM}}> };
}>;
```

---

## Exemplo Real

### constant.ts

```typescript
export const E_ROLE = {
  ADMINISTRATOR: 'ADMINISTRATOR',
  CURATOR: 'CURATOR',
  ARTISAN: 'ARTISAN',
} as const;

export const E_ENTITY_TYPE = {
  TYPE_A: 'TYPE_A',
  TYPE_B: 'TYPE_B',
  TYPE_C: 'TYPE_C',
} as const;

export const E_USER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

// Options arrays para selects
export const ENTITY_TYPE_OPTIONS = [
  { label: 'Tipo A', value: E_ENTITY_TYPE.TYPE_A },
  { label: 'Tipo B', value: E_ENTITY_TYPE.TYPE_B },
] as const;

// Mapper de roles para labels
export const USER_ROLE_MAPPER = {
  [E_ROLE.ADMINISTRATOR]: 'Administrador',
  [E_ROLE.CURATOR]: 'Curador',
  [E_ROLE.ARTISAN]: 'Artesao',
} as const;

// Regex de validacao de senha
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/;
```

### payloads.ts

```typescript
import type { E_ROLE, E_USER_STATUS } from './constant';
import type { Merge, ValueOf } from './interfaces';

export type SignInPayload = {
  email: string;
  password: string;
};

export type UserCreatePayload = {
  name: string;
  email: string;
  password: string;
  group: string;
};

export type UserUpdatePayload = {
  id: string;
  name?: string;
  email?: string;
  status?: ValueOf<typeof E_USER_STATUS>;
};

export type BaseQueryPayload = {
  page?: number;
  perPage?: number;
  search?: string;
};

export type UserQueryPayload = Merge<BaseQueryPayload, {
  user?: { id: string; role: ValueOf<typeof E_ROLE> };
}>;
```

Leitura do exemplo:

1. `E_ROLE`, `E_ENTITY_TYPE` e `E_USER_STATUS` sao objetos `as const` que funcionam como enums type-safe. O prefixo `E_` identifica visualmente que se trata de uma enumeracao.
2. `ENTITY_TYPE_OPTIONS` e o array companion de `E_ENTITY_TYPE` -- cada item possui `label` (para exibicao em PT-BR) e `value` (referenciando o enum). Isso garante que os valores nos selects estejam sempre sincronizados com o enum.
3. `USER_ROLE_MAPPER` usa computed property names (`[E_ROLE.ADMINISTRATOR]`) para mapear valores do enum para labels de exibicao.
4. `PASSWORD_REGEX` centraliza o pattern de validacao de senha, reutilizado tanto em schemas Zod quanto em constantes de UI.
5. Em `payloads.ts`, `ValueOf<typeof E_USER_STATUS>` extrai o tipo union dos valores do enum (`'ACTIVE' | 'INACTIVE'`), garantindo type safety nos campos tipados.
6. `BaseQueryPayload` define os campos comuns de paginacao. `UserQueryPayload` usa `Merge` para combinar a base com filtros especificos da entidade.

---

## Regras e Convencoes

1. **Prefixo `E_` para todos os enum objects** -- todo objeto que representa uma enumeracao deve comecar com `E_` seguido do nome em SCREAMING_SNAKE_CASE. Ex: `E_ROLE`, `E_ENTITY_TYPE`, `E_USER_STATUS`.

2. **`as const` em TODOS os enums e options** -- sem `as const`, o TypeScript infere tipos amplos (`string` em vez de `'ACTIVE' | 'INACTIVE'`). Isso quebra a type safety e permite valores invalidos.

3. **Options arrays sao companions dos enums** -- para cada enum usado em selects/dropdowns, deve existir um array companion com sufixo `_OPTIONS`. Os valores do array devem referenciar o enum diretamente (`E_ENTITY_TYPE.TEXT_SHORT`), nunca strings literais.

4. **Mappers para labels de exibicao** -- quando e necessario converter um valor do enum para um label legivel, use um objeto mapper com sufixo `_MAPPER` e computed property names do enum.

5. **Payload types separados de schemas Zod** -- `payloads.ts` contem apenas types (interfaces/types TypeScript). Schemas de validacao Zod ficam em `schemas.ts`. Essa separacao permite que payloads sejam usados em contextos onde Zod nao e necessario (ex: tipagem de respostas da API).

6. **`ValueOf<typeof E_X>` para tipar valores de enum** -- nunca use `string` quando o campo aceita apenas valores de um enum. Use `ValueOf<typeof E_ROLE>` para extrair o tipo union dos valores.

7. **`BaseQueryPayload` + `Merge` para queries paginadas** -- toda query paginada deve estender `BaseQueryPayload` usando o utility type `Merge`. Isso garante que `page`, `perPage` e `search` estejam sempre disponiveis.

8. **Regex patterns centralizados em `constant.ts`** -- patterns de validacao reutilizaveis (como `PASSWORD_REGEX`) ficam em `constant.ts` e sao importados pelos schemas e componentes que precisam deles.

9. **Nao exporte types de `constant.ts`** -- `constant.ts` exporta apenas valores (objetos, arrays, regex). Types derivados ficam em `payloads.ts` ou sao inferidos inline via `ValueOf<typeof E_*>`.

---

## Checklist

- [ ] Enums objects usam prefixo `E_` e SCREAMING_SNAKE_CASE
- [ ] Todos os enums e options arrays possuem `as const`
- [ ] Para cada enum usado em selects existe um array companion `*_OPTIONS`
- [ ] Options arrays referenciam o enum diretamente (nao strings literais)
- [ ] Mappers usam computed property names do enum
- [ ] Payload types estao em `payloads.ts`, separados dos schemas Zod
- [ ] Campos que aceitam valores de enum usam `ValueOf<typeof E_*>`
- [ ] Queries paginadas estendem `BaseQueryPayload` via `Merge`
- [ ] Regex patterns reutilizaveis estao centralizados em `constant.ts`
- [ ] Arquivo `constant.ts` localizado em `frontend/src/lib/constant.ts`
- [ ] Arquivo `payloads.ts` localizado em `frontend/src/lib/payloads.ts`

---

## Erros Comuns

| Erro | Causa | Correcao |
|------|-------|----------|
| Enum perde type safety e aceita qualquer string | Faltou `as const` no objeto enum | Adicionar `as const` ao final do objeto: `} as const` |
| Select exibe valor invalido nao presente no enum | Options array usa string literal em vez de referenciar o enum | Usar `E_ENTITY_TYPE.TEXT_SHORT` em vez de `'TEXT_SHORT'` no array de options |
| Campo tipado como `string` aceita valores fora do enum | Tipo do campo definido como `string` em vez de `ValueOf<typeof E_*>` | Substituir `status: string` por `status: ValueOf<typeof E_USER_STATUS>` |
| Duplicacao de labels entre mapper e options | Mapper e options definidos independentemente com strings duplicadas | Centralizar labels no mapper e, se necessario, derivar options a partir dele |
| Payload type diverge do schema Zod | Type definido manualmente sem corresponder ao schema | Manter payload types e schemas Zod sincronizados. Para schemas de input, prefira `z.infer` em `schemas.ts` |
| Query paginada faltando campos de paginacao | Payload de query definido sem estender `BaseQueryPayload` | Usar `Merge<BaseQueryPayload, { ...filtros }>` para garantir campos de paginacao |
| Enum sem prefixo `E_` confundido com constante comum | Nomenclatura nao segue a convencao do projeto | Renomear para `E_NOME` seguindo o padrao: `E_ROLE`, `E_ENTITY_TYPE`, etc. |
| Import circular entre `constant.ts` e `payloads.ts` | `constant.ts` importando types de `payloads.ts` | `constant.ts` nunca deve importar de `payloads.ts`. O fluxo e unidirecional: `payloads.ts` importa de `constant.ts` |

---

> **Cross-references:** ver [024-skill-schema-zod.md](./024-skill-schema-zod.md) | [023-skill-store.md](./023-skill-store.md)
