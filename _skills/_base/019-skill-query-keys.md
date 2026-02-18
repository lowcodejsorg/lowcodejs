# Skill: Query Keys Factory

O Query Keys Factory e o objeto central que define todas as cache keys usadas pelo TanStack Query na aplicacao. Ele organiza as keys em uma hierarquia de 3 niveis por entidade (all -> lists/details -> especifico), garantindo que invalidacoes de cache sejam precisas e previssiveis. Cada nivel estende o anterior via spread, formando uma arvore onde invalidar um nivel pai automaticamente invalida todos os filhos. O uso de `as const` em todos os retornos garante que o TypeScript infere os tipos como tuplas literais readonly, habilitando type safety completo nas queries.

---

## Estrutura do Arquivo

```
frontend/
  src/
    hooks/
      tanstack-query/
        _query-keys.ts                <-- factory unica de query keys
        use-[entity]-[action].tsx     <-- hooks que consomem as keys
```

- O arquivo `_query-keys.ts` vive em `frontend/src/hooks/tanstack-query/_query-keys.ts`.
- O prefixo `_` indica que e um arquivo interno do modulo, nao um hook exportado diretamente.
- Todas as queries da aplicacao importam suas keys deste unico arquivo.

---

## Template

```typescript
export const queryKeys = {
  {{entity}}: {
    all: ['{{entity}}'] as const,
    lists: () => [...queryKeys.{{entity}}.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.{{entity}}.lists(), params] as const,
    details: () => [...queryKeys.{{entity}}.all, 'detail'] as const,
    detail: ({{id}}: string) => [...queryKeys.{{entity}}.details(), {{id}}] as const,
  },
} as const;
```

### Template para entidade aninhada

```typescript
export const queryKeys = {
  {{parentEntity}}: {
    // ... keys da entidade pai
  },
  {{childEntity}}: {
    all: ({{parentId}}: string) => ['{{parentEntity}}', {{parentId}}, '{{childEntity}}'] as const,
    lists: ({{parentId}}: string) => [...queryKeys.{{childEntity}}.all({{parentId}}), 'list'] as const,
    list: ({{parentId}}: string, params: Record<string, unknown>) => [...queryKeys.{{childEntity}}.lists({{parentId}}), params] as const,
    details: ({{parentId}}: string) => [...queryKeys.{{childEntity}}.all({{parentId}}), 'detail'] as const,
    detail: ({{parentId}}: string, {{childId}}: string) => [...queryKeys.{{childEntity}}.details({{parentId}}), {{childId}}] as const,
  },
} as const;
```

---

## Exemplo Real

```typescript
export const queryKeys = {
  entities: {
    all: ['entities'] as const,
    lists: () => [...queryKeys.entities.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.entities.lists(), params] as const,
    details: () => [...queryKeys.entities.all, 'detail'] as const,
    detail: (slug: string) => [...queryKeys.entities.details(), slug] as const,
  },
  children: {
    all: (entityId: string) => ['entities', entityId, 'children'] as const,
    lists: (entityId: string) => [...queryKeys.children.all(entityId), 'list'] as const,
    list: (entityId: string, params: Record<string, unknown>) => [...queryKeys.children.lists(entityId), params] as const,
    details: (entityId: string) => [...queryKeys.children.all(entityId), 'detail'] as const,
    detail: (entityId: string, childId: string) => [...queryKeys.children.details(entityId), childId] as const,
  },
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.users.lists(), params] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (userId: string) => [...queryKeys.users.details(userId), userId] as const,
  },
  profile: {
    all: ['profile'] as const,
    detail: (sub?: string) => [...queryKeys.profile.all, sub] as const,
  },
  permissions: { all: ['permissions'] as const },
  settings: { all: ['settings'] as const },
} as const;
```

**Leitura do exemplo:**

1. **`entities`** e uma entidade raiz com hierarquia completa de 3 niveis. `all` e `['entities']`, `lists()` estende para `['entities', 'list']`, e `list(params)` estende para `['entities', 'list', { page: 1, perPage: 50 }]`.
2. **`children`** e uma entidade aninhada dentro de `entities`. O `all` recebe `entityId` como parametro e retorna `['entities', entityId, 'children']`, vinculando os children a uma entity especifica. Isso permite invalidar todos os children de uma entity sem afetar children de outras entities.
3. **`users`** segue o mesmo padrao raiz de `entities`, com hierarquia completa independente.
4. **`profile`** e uma entidade simplificada sem nivel `lists` -- possui apenas `all` e `detail`, pois o perfil nao tem listagem.
5. **`permissions`** e **`settings`** sao entidades minimas com apenas `all`, usadas para invalidacao global quando necessario.
6. Todos os retornos usam `as const` para garantir inferencia de tuplas literais readonly.
7. Cada nivel usa spread (`...`) do nivel anterior, garantindo que a hierarquia de invalidacao funcione corretamente com `queryClient.invalidateQueries({ queryKey: queryKeys.entities.all })`.

---

## Regras e Convencoes

1. **Hierarquia de 3 niveis** -- toda entidade com CRUD completo deve seguir: `all` (array literal) -> `lists()`/`details()` (funcoes que estendem `all`) -> `list(params)`/`detail(id)` (funcoes que estendem `lists`/`details`).

2. **`as const` em TODOS os retornos** -- tanto nos arrays literais quanto nos retornos de funcao. Isso garante que o TypeScript infere o tipo como tupla readonly literal, nao como `string[]`.

3. **`all` e sempre um array literal** -- nunca uma funcao (exceto em entidades aninhadas onde precisa receber o ID do pai). Para entidades raiz: `all: ['entity'] as const`. Para entidades aninhadas: `all: (parentId: string) => ['parent', parentId, 'child'] as const`.

4. **`lists()` e `details()` sao funcoes sem parametros** que estendem `all` via spread. Elas servem como nivel intermediario para agrupar todas as listagens ou todos os detalhes.

5. **`list(params)` e `detail(id)` sao funcoes com parametros** que estendem `lists()` e `details()` respectivamente. `params` e tipado como `Record<string, unknown>` para aceitar qualquer combinacao de filtros e paginacao.

6. **Spread do nivel anterior** -- cada nivel DEVE usar spread do nivel imediatamente anterior para manter a hierarquia. Nunca recrie a key manualmente: use `[...queryKeys.entity.lists(), params]` e nao `['entity', 'list', params]`.

7. **Entidades aninhadas** -- quando uma entidade pertence a outra (ex.: `children` pertence a `entities`), o `all` recebe o identificador do pai e inclui o namespace do pai na key. Isso permite invalidar children de uma entity especifica sem afetar outras.

8. **Arquivo unico** -- todas as query keys vivem em `_query-keys.ts`. Nunca defina query keys em arquivos de hook individuais.

9. **Nunca use arrays inline nos hooks** -- sempre importe e use `queryKeys.entity.method()`. Arrays inline como `queryKey: ['entities', slug]` sao proibidos.

10. **O objeto raiz tambem usa `as const`** -- alem dos retornos individuais, o `export const queryKeys = { ... } as const` garante imutabilidade do objeto inteiro.

---

## Checklist

- [ ] O arquivo esta em `frontend/src/hooks/tanstack-query/_query-keys.ts`.
- [ ] Existe um unico objeto `queryKeys` exportado como `export const`.
- [ ] Cada entidade com CRUD completo tem os 3 niveis: `all`, `lists`/`details`, `list`/`detail`.
- [ ] `all` e um array literal (entidade raiz) ou funcao com ID do pai (entidade aninhada).
- [ ] `lists()` e `details()` sao funcoes que estendem `all` via spread.
- [ ] `list(params)` e `detail(id)` sao funcoes que estendem `lists()`/`details()` via spread.
- [ ] `as const` esta presente em TODOS os retornos (arrays e funcoes).
- [ ] O objeto raiz `queryKeys` usa `as const`.
- [ ] Entidades aninhadas incluem o namespace do pai no `all`.
- [ ] Parametros de `list` sao tipados como `Record<string, unknown>`.
- [ ] Nenhum hook da aplicacao usa arrays inline como query key.

---

## Erros Comuns

| Erro | Causa | Correcao |
|------|-------|----------|
| Cache nao invalida corretamente | A key do `list` nao estende `lists()` via spread, quebrando a hierarquia | Garantir que cada nivel usa `[...queryKeys.entity.nivelAnterior(), novoSegmento]` |
| `as const` ausente | Retorno inferido como `string[]` em vez de tupla literal readonly | Adicionar `as const` no retorno de toda funcao e array literal |
| Array inline no hook | Query key definida como `['entities', slug]` diretamente no `useQuery` | Importar e usar `queryKeys.entities.detail(slug)` |
| Entidade aninhada sem namespace do pai | `children.all` retorna `['children']` em vez de `['entities', entityId, 'children']` | Incluir o identificador e namespace do pai no `all` da entidade aninhada |
| `lists` como array literal em vez de funcao | `lists: [...queryKeys.entity.all, 'list'] as const` (sem `() =>`) | Tornar `lists` uma funcao: `lists: () => [...queryKeys.entity.all, 'list'] as const` |
| Spread do nivel errado | `detail` estende `all` diretamente em vez de `details()` | Garantir a cadeia: `detail` -> `details()` -> `all` |
| Invalidacao muito ampla | Usa `queryKeys.entities.all` quando deveria invalidar apenas `queryKeys.children.all(entityId)` | Usar o nivel mais especifico possivel para invalidacao |
| `params` tipado como tipo especifico | `list(params: { page: number })` em vez de `Record<string, unknown>` | Usar `Record<string, unknown>` para manter a factory generica |

---

**Cross-references:** ver [017-skill-hook-query.md](./017-skill-hook-query.md), [018-skill-hook-mutation.md](./018-skill-hook-mutation.md).
