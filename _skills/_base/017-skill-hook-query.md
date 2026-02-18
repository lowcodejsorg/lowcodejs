# Skill: Hook Query

O Hook Query e o padrao para encapsular chamadas de leitura de dados (GET) usando TanStack Query. Cada hook envolve um `useQuery` com query key vinda da factory `queryKeys`, funcao `queryFn` que chama a API tipada e configuracoes como `enabled` para queries condicionais. O hook retorna `UseQueryResult<T, Error>` com tipo explicito, permitindo que componentes consumam dados, loading state e erros de forma declarativa. Hooks de leitura sao separados em dois padroes: detail (registro unico) e list (colecao com paginacao).

---

## Estrutura do Arquivo

```
frontend/
  src/
    hooks/
      tanstack-query/
        _query-keys.ts                        <-- factory de query keys
        use-[entity]-read.tsx                  <-- hook de detail (GET /entity/:id)
        use-[entity]-read-[plural].tsx         <-- hook de list (GET /entity)
```

- Cada hook vive em `frontend/src/hooks/tanstack-query/use-[entity]-[action].tsx`.
- Hooks de detail e list ficam em arquivos separados.
- Todos os hooks importam suas query keys de `_query-keys.ts` (ver `019-skill-query-keys.md`).

---

## Template

### Hook de detail

```typescript
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './_query-keys';
import { API } from '@/lib/api';
import type { I{{Entity}} } from '@/lib/interfaces';

export function useRead{{Entity}}(payload: { {{id}}: string }): UseQueryResult<I{{Entity}}, Error> {
  return useQuery({
    queryKey: queryKeys.{{entity}}.detail(payload.{{id}}),
    queryFn: async function () {
      const route = '/{{entities}}/'.concat(payload.{{id}});
      const response = await API.get<I{{Entity}}>(route);
      return response.data;
    },
    enabled: Boolean(payload.{{id}}),
  });
}
```

### Hook de list

```typescript
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './_query-keys';
import { API } from '@/lib/api';
import type { I{{Entity}} } from '@/lib/interfaces';

interface Paginated{{Entity}}Response {
  data: Array<I{{Entity}}>;
  meta: { page: number; perPage: number; total: number };
}

export function useRead{{Entities}}(payload?: { page?: number; perPage?: number }): UseQueryResult<Array<I{{Entity}}>, Error> {
  const page = payload?.page ?? 1;
  const perPage = payload?.perPage ?? 50;

  return useQuery({
    queryKey: queryKeys.{{entity}}.list({ page, perPage }),
    queryFn: async () => {
      const response = await API.get<Paginated{{Entity}}Response>('/{{entities}}/paginated', {
        params: { page, perPage },
      });
      return response.data.data;
    },
  });
}
```

---

## Exemplo Real

### Query de detail

```typescript
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './_query-keys';
import { API } from '@/lib/api';
import type { IEntity } from '@/lib/interfaces';

export function useReadEntity(payload: { slug: string }): UseQueryResult<IEntity, Error> {
  return useQuery({
    queryKey: queryKeys.entities.detail(payload.slug),
    queryFn: async function () {
      const route = '/entities/'.concat(payload.slug);
      const response = await API.get<IEntity>(route);
      return response.data;
    },
    enabled: Boolean(payload.slug),
  });
}
```

**Leitura do exemplo (detail):**

1. **`useReadEntity`** recebe um `payload` com `slug` como parametro. O payload e um objeto para manter consistencia e permitir extensao futura.
2. **`queryKey: queryKeys.entities.detail(payload.slug)`** -- a key vem da factory, resultando em `['entities', 'detail', slug]`. Isso garante que cada entidade tem sua propria entrada no cache.
3. **`queryFn`** e uma funcao async que monta a rota concatenando o slug, chama `API.get<IEntity>` com o generic para tipar a resposta e retorna `response.data`.
4. **`enabled: Boolean(payload.slug)`** -- a query so executa quando `slug` e truthy. Isso previne chamadas invalidas quando o slug ainda nao esta disponivel (ex.: durante carregamento da rota).
5. **Tipo de retorno `UseQueryResult<IEntity, Error>`** -- explicito na assinatura, garantindo que o componente consumidor sabe exatamente o que esperar de `data`, `error`, `isLoading`, etc.

### Query de list com paginacao

```typescript
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './_query-keys';
import { API } from '@/lib/api';
import type { IEntity } from '@/lib/interfaces';

interface PaginatedEntitiesResponse {
  data: Array<IEntity>;
  meta: { page: number; perPage: number; total: number };
}

export function useReadEntitys(payload?: { page?: number; perPage?: number }): UseQueryResult<Array<IEntity>, Error> {
  const page = payload?.page ?? 1;
  const perPage = payload?.perPage ?? 50;

  return useQuery({
    queryKey: queryKeys.entities.list({ page, perPage }),
    queryFn: async () => {
      const response = await API.get<PaginatedEntitiesResponse>('/entities/paginated', {
        params: { page, perPage },
      });
      return response.data.data;
    },
  });
}
```

**Leitura do exemplo (list):**

1. **`useReadEntitys`** recebe um `payload` opcional com parametros de paginacao. Valores default sao aplicados: `page = 1`, `perPage = 50`.
2. **`queryKey: queryKeys.entities.list({ page, perPage })`** -- a key inclui os parametros de paginacao, garantindo que cada combinacao de `page` e `perPage` tem sua propria entrada no cache. Mudar de pagina nao invalida o cache da pagina anterior.
3. **`PaginatedEntitiesResponse`** -- interface local que descreve o formato da resposta paginada do backend, com `data` (array de itens) e `meta` (informacoes de paginacao).
4. **`API.get<PaginatedEntitiesResponse>`** -- o generic tipa a resposta completa. O retorno do hook e `response.data.data` (o array de items dentro do wrapper de paginacao).
5. **Sem `enabled`** -- a query de list nao precisa de condicional pois nao depende de parametros dinamicos obrigatorios. Os defaults de paginacao garantem que a query e sempre valida.

---

## Regras e Convencoes

1. **Sempre usar `queryKeys` factory** -- nunca defina arrays inline como `queryKey: ['entities', slug]`. Todas as keys devem vir de `queryKeys` importado de `_query-keys.ts`.

2. **`enabled` para queries condicionais** -- quando o hook depende de um parametro que pode ser undefined ou vazio (ex.: `slug`, `id`), use `enabled: Boolean(param)` para prevenir chamadas invalidas a API.

3. **Tipo de retorno `UseQueryResult<T, Error>`** -- sempre declare o tipo de retorno explicitamente na assinatura do hook. `T` e o tipo do dado de sucesso, `Error` e o tipo do erro.

4. **`API.get<T>` para tipagem da resposta** -- use o generic de `API.get` para tipar `response.data`. Isso garante type safety desde a chamada HTTP ate o retorno do hook.

5. **Separar detail e list** -- hooks de registro unico (detail) e hooks de colecao (list) ficam em arquivos separados. Detail usa `queryKeys.entity.detail(id)`, list usa `queryKeys.entity.list(params)`.

6. **Payload como parametro do hook** -- o hook recebe um objeto `payload` (nao parametros avulsos). Para detail: `payload: { id: string }`. Para list: `payload?: { page?: number; perPage?: number }`.

7. **Defaults de paginacao dentro do hook** -- valores default como `page = 1` e `perPage = 50` sao resolvidos dentro do hook, nao no componente. Use `payload?.field ?? defaultValue`.

8. **Interface de resposta paginada local** -- quando a API retorna um wrapper de paginacao, defina a interface `Paginated{{Entity}}Response` no mesmo arquivo do hook.

9. **`queryFn` retorna apenas os dados** -- a funcao de query deve extrair e retornar apenas os dados relevantes (`response.data` ou `response.data.data`), nao o objeto de resposta HTTP inteiro.

10. **Nomenclatura** -- o padrao e `useRead{{Entity}}` para detail e `useRead{{Entities}}` (plural) para list. Outros verbos: `useCreate{{Entity}}`, `useUpdate{{Entity}}`, `useDelete{{Entity}}` (estes sao mutations, ver `018-skill-hook-mutation.md`).

---

## Checklist

- [ ] O arquivo esta em `frontend/src/hooks/tanstack-query/use-[entity]-[action].tsx`.
- [ ] O hook importa `queryKeys` de `./_query-keys` (nunca arrays inline).
- [ ] O hook importa `useQuery` e `UseQueryResult` de `@tanstack/react-query`.
- [ ] O tipo de retorno `UseQueryResult<T, Error>` esta explicito na assinatura.
- [ ] O `queryKey` usa `queryKeys.entity.detail(id)` ou `queryKeys.entity.list(params)`.
- [ ] O `queryFn` usa `API.get<T>` com generic adequado.
- [ ] O `queryFn` retorna apenas os dados (`response.data`), nao o wrapper HTTP.
- [ ] Queries condicionais usam `enabled: Boolean(param)`.
- [ ] O payload e recebido como objeto, nao parametros avulsos.
- [ ] Defaults de paginacao sao resolvidos dentro do hook.
- [ ] A interface de resposta paginada (se aplicavel) esta definida no mesmo arquivo.
- [ ] O nome do hook segue `useRead{{Entity}}` (detail) ou `useRead{{Entities}}` (list).

---

## Erros Comuns

| Erro | Causa | Correcao |
|------|-------|----------|
| Array inline como query key | `queryKey: ['entities', slug]` em vez de usar a factory | Usar `queryKey: queryKeys.entities.detail(slug)` |
| Query executa sem parametro valido | Falta `enabled` quando o parametro pode ser undefined | Adicionar `enabled: Boolean(payload.slug)` |
| Tipo de retorno ausente | Hook sem `UseQueryResult<T, Error>` na assinatura | Declarar explicitamente: `): UseQueryResult<IEntity, Error>` |
| Retorna `response` em vez de `response.data` | O `queryFn` retorna o objeto Axios completo | Retornar `response.data` (ou `response.data.data` para paginacao) |
| Cache nao diferencia paginas | `queryKey` nao inclui parametros de paginacao | Usar `queryKeys.entity.list({ page, perPage })` -- os params fazem parte da key |
| Parametros avulsos no hook | `useReadEntity(slug: string)` em vez de objeto payload | Receber como `useReadEntity(payload: { slug: string })` |
| Generic ausente no `API.get` | `API.get('/entities')` sem generic perde tipagem | Usar `API.get<IEntity>('/entities')` para tipar a resposta |
| Defaults no componente | Componente faz `useReadEntitys({ page: page ?? 1 })` | Mover defaults para dentro do hook com `payload?.page ?? 1` |
| `queryFn` inline muito grande | Logica de transformacao de dados dentro do `queryFn` | Manter o `queryFn` simples: apenas chamada API e retorno. Transformacoes complexas devem usar `select` do `useQuery` |

---

**Cross-references:** ver [019-skill-query-keys.md](./019-skill-query-keys.md), [025-skill-http-client.md](./025-skill-http-client.md).
