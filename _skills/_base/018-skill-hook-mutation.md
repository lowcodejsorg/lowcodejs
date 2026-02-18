# Skill: Hook Mutation

O Hook Mutation e a camada responsavel por encapsular operacoes de escrita (create, update, delete) no frontend utilizando `useMutation` do TanStack Query. Ele conecta a chamada HTTP via `API` (Axios) ao ciclo de vida de mutations, garantindo invalidacao automatica de queries relacionadas no `onSuccess`, tipagem forte de payloads e respostas, e callbacks configuráveis via props. Cada hook segue o pattern de um arquivo por acao por entidade, mantendo responsabilidade unica e reuso consistente em toda a aplicacao.

---

## Estrutura do Arquivo

O arquivo de hook mutation deve estar localizado em:

```
frontend/src/hooks/tanstack-query/use-[entity]-[action].tsx
```

Onde `[entity]` representa o recurso (ex: `user`, `category`, `piece`) e `[action]` representa a operacao (ex: `create`, `update`, `delete`).

Dependencias tipicas de um hook mutation:

- **UseMutationOptions / UseMutationResult** - tipos do TanStack Query para configuracao e retorno
- **useMutation** - hook do TanStack Query para operacoes de escrita
- **useQueryClient** - hook para acessar o query client e invalidar queries
- **AxiosError** - tipo de erro do Axios para tipagem de falhas HTTP
- **queryKeys** - objeto centralizado de query keys para invalidacao
- **API** - instancia singleton do Axios (`@/lib/api`)
- **IEntity** - interface da entidade retornada pela API
- **EntityPayload** - tipo do payload enviado na request

## Template

```typescript
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { queryKeys } from './_query-keys';
import { API } from '@/lib/api';
import type { IEntity } from '@/lib/interfaces';
import type { Entity<Action>Payload } from '@/lib/payloads';

type UseEntity<Action>Props = Pick<
  Omit<
    UseMutationOptions<IEntity, AxiosError | Error, Entity<Action>Payload, unknown>,
    'mutationFn' | 'onSuccess'
  >,
  'onError'
> & {
  onSuccess?: (data: IEntity, variables: Entity<Action>Payload) => void;
};

export function use<Action><Entity>(
  props: UseEntity<Action>Props,
): UseMutationResult<IEntity, AxiosError | Error, Entity<Action>Payload, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async function (payload: Entity<Action>Payload) {
      const route = '/<entities>';
      const response = await API.<method><IEntity>(route, payload);
      return response.data;
    },
    onSuccess(data, variables) {
      queryClient.invalidateQueries({ queryKey: queryKeys.<entities>.lists() });
      props.onSuccess?.(data, variables);
    },
    onError: props.onError,
  });
}
```

## Exemplo Real

```typescript
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { queryKeys } from './_query-keys';
import { API } from '@/lib/api';
import type { IEntity } from '@/lib/interfaces';
import type { EntityCreatePayload } from '@/lib/payloads';

type UseEntityCreateProps = Pick<
  Omit<
    UseMutationOptions<IEntity, AxiosError | Error, EntityCreatePayload, unknown>,
    'mutationFn' | 'onSuccess'
  >,
  'onError'
> & {
  onSuccess?: (data: IEntity, variables: EntityCreatePayload) => void;
};

export function useCreateEntity(
  props: UseEntityCreateProps,
): UseMutationResult<IEntity, AxiosError | Error, EntityCreatePayload, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async function (payload: EntityCreatePayload) {
      const route = '/entities';
      const response = await API.post<IEntity>(route, payload);
      return response.data;
    },
    onSuccess(data, variables) {
      queryClient.invalidateQueries({ queryKey: queryKeys.entities.lists() });
      props.onSuccess?.(data, variables);
    },
    onError: props.onError,
  });
}
```

Leitura do exemplo:

1. O tipo `UseEntityCreateProps` usa `Pick<Omit<UseMutationOptions, ...>, 'onError'>` para expor apenas o callback `onError` das opcoes padrao, e adiciona `onSuccess` com assinatura customizada que recebe `data` e `variables` tipados.
2. `useQueryClient()` e chamado dentro do hook para obter acesso ao query client e poder invalidar queries no sucesso.
3. `mutationFn` faz a chamada HTTP via `API.post<IEntity>()` e retorna `response.data` -- o tipo generico garante que o retorno seja `IEntity`.
4. `onSuccess` invalida todas as queries de listagem de entities via `queryKeys.entities.lists()` e chama o callback `onSuccess` do consumidor com optional chaining (`?.`).
5. `onError` e delegado diretamente para o callback recebido via props, sem tratamento adicional no hook.

## Regras e Convencoes

1. **Sempre invalidar queries relacionadas no `onSuccess`.** Apos uma mutation bem-sucedida, as queries que listam ou detalham a entidade afetada devem ser invalidadas para que o TanStack Query refaca o fetch automaticamente. Use `queryClient.invalidateQueries({ queryKey: queryKeys.<entity>.lists() })`.

2. **`useQueryClient()` para invalidacao.** Nunca importe o `queryClient` diretamente de um modulo externo. Sempre obtenha a instancia via `useQueryClient()` dentro do hook para respeitar o contexto do React.

3. **Callbacks via props (`onSuccess`, `onError`).** O consumidor do hook configura comportamentos pos-mutation (ex: redirect, toast, fechar modal) atraves de props. O hook nunca deve conter side effects de UI como navegacao ou notificacoes.

4. **Tipar props com `Pick`/`Omit` de `UseMutationOptions`.** O tipo de props do hook deve derivar de `UseMutationOptions` usando `Pick` e `Omit` para expor apenas os callbacks relevantes. `mutationFn` e sempre omitido pois e definido internamente. `onSuccess` e omitido e re-declarado com assinatura customizada para expor `data` e `variables` tipados.

5. **`AxiosError | Error` para tipo de erro.** O segundo generico de `UseMutationResult` deve ser `AxiosError | Error` para cobrir tanto erros HTTP (com `response.data`) quanto erros genericos de JavaScript.

6. **`API.post`/`API.put`/`API.delete` para requests.** Toda comunicacao HTTP deve usar a instancia `API` de `@/lib/api`. Nunca use `axios` diretamente ou `fetch`. O metodo HTTP corresponde a operacao: `post` para create, `put` para update, `delete` para delete.

7. **Um arquivo por acao por entidade.** Cada mutation tem seu proprio arquivo: `use-entity-create.tsx`, `use-entity-update.tsx`, `use-entity-delete.tsx`. Nunca agrupe multiplas mutations no mesmo arquivo.

8. **A funcao do hook e nomeada como `use<Action><Entity>`.** Exemplos: `useCreateEntity`, `useUpdateProject`, `useDeleteUser`. O prefixo `use` e obrigatorio para que o React reconheca como hook.

9. **`mutationFn` deve ser uma `async function` nomeada ou anonima.** Sempre declare como `async function (payload)` e nao como arrow function, seguindo o pattern do projeto.

10. **O tipo de retorno do hook deve ser explicitamente declarado** como `UseMutationResult<TData, TError, TVariables, TContext>` para garantir tipagem completa no consumidor.

## Checklist

- [ ] Arquivo localizado em `frontend/src/hooks/tanstack-query/use-[entity]-[action].tsx`
- [ ] Imports de `UseMutationOptions` e `UseMutationResult` como `import type`
- [ ] `useMutation` e `useQueryClient` importados de `@tanstack/react-query`
- [ ] `AxiosError` importado como `import type` de `axios`
- [ ] `queryKeys` importado de `./_query-keys`
- [ ] `API` importado de `@/lib/api`
- [ ] Interface e payload importados como `import type`
- [ ] Tipo de props usa `Pick<Omit<UseMutationOptions, 'mutationFn' | 'onSuccess'>, 'onError'>`
- [ ] `onSuccess` customizado expoe `data` e `variables` tipados
- [ ] `useQueryClient()` chamado dentro do hook
- [ ] `mutationFn` usa `API.<method>` com tipo generico
- [ ] `onSuccess` invalida queries relacionadas via `queryKeys`
- [ ] `onSuccess` chama `props.onSuccess?.()` com optional chaining
- [ ] `onError` delegado para `props.onError`
- [ ] Tipo de retorno do hook explicitamente declarado como `UseMutationResult`
- [ ] Tipo de erro e `AxiosError | Error`
- [ ] Nenhum side effect de UI dentro do hook (sem toast, redirect, etc.)

## Erros Comuns

1. **Esquecer de invalidar queries no `onSuccess`.** Sem invalidacao, a listagem da entidade fica desatualizada apos a mutation e o usuario precisa recarregar a pagina manualmente para ver as mudancas.

2. **Importar `queryClient` de um modulo externo ao inves de usar `useQueryClient()`.** Isso pode causar problemas em cenarios com multiplos providers ou testes, pois o client nao estara vinculado ao contexto correto do React.

3. **Colocar side effects de UI no hook (toast, redirect, fechar modal).** O hook de mutation nao deve conter logica de apresentacao. Esses comportamentos pertencem ao consumidor, que os configura via `onSuccess` e `onError` nas props.

4. **Tipar o erro apenas como `AxiosError` sem incluir `Error`.** Erros que ocorrem antes da request HTTP (ex: erro de rede, erro de serializacao) sao instancias de `Error` genericas, nao de `AxiosError`. O union type garante cobertura completa.

5. **Usar `axios` diretamente ao inves de `API`.** Chamadas diretas ao `axios` ignoram a `baseURL`, `withCredentials` e os interceptors configurados na instancia `API`, causando falhas de autenticacao e tratamento de erros inconsistente.

6. **Agrupar multiplas mutations no mesmo arquivo.** Cada mutation deve ter seu proprio arquivo para manter responsabilidade unica e facilitar navegacao no projeto. `useCreateEntity` e `useDeleteEntity` nunca devem estar no mesmo arquivo.

7. **Declarar `onSuccess` no tipo de props sem omiti-lo de `UseMutationOptions` primeiro.** Sem o `Omit`, o TypeScript reclama de tipos conflitantes entre a assinatura original de `onSuccess` (que inclui `context`) e a customizada (que expoe apenas `data` e `variables`).

8. **Esquecer o optional chaining em `props.onSuccess?.()`.** Se o consumidor nao passar `onSuccess`, a chamada sem `?.` resulta em `TypeError: props.onSuccess is not a function` em runtime.

---

> **Cross-references:** ver [019-skill-query-keys.md](./019-skill-query-keys.md) para a estrutura centralizada de query keys usada na invalidacao | [025-skill-http-client.md](./025-skill-http-client.md) para a instancia `API` do Axios | [017-skill-hook-query.md](./017-skill-hook-query.md) para o pattern complementar de hooks de leitura com `useQuery`
