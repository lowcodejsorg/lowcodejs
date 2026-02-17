# Skill: Rota Privada

A rota privada e o ponto de entrada para paginas autenticadas do frontend. Toda rota privada vive sob o layout `/_private/`, que garante a presenca de sidebar, header e verificacao de autenticacao. Cada rota define seu `Route` via `createFileRoute` com path completo, opcionalmente declara `validateSearch` para URL state tipado com Zod e implementa um `RouteComponent` que consome hooks de query para buscar dados e renderiza condicionalmente com base no status da query (`pending`, `error`, `success`). A navegacao entre paginas e feita via `useRouter().navigate`, e os parametros de URL sao lidos via `useSearch`.

---

## Estrutura do Arquivo

```
frontend/
  src/
    routes/
      _private/
        route.tsx                             <-- layout privado (Sidebar + Header + Outlet)
        [entity]/
          index.tsx                           <-- listagem (rota privada principal)
          [action]/
            index.tsx                         <-- action (create, edit, show...)
    hooks/
      tanstack-query/
        use-[entity]-read-paginated.ts        <-- hook de query paginada
    stores/
      authentication.ts                       <-- store de autenticacao (Zustand)
    lib/
      constant.ts                             <-- MetaDefault e constantes
```

- A rota privada vive em `frontend/src/routes/_private/[entity]/index.tsx` (listagem) ou `frontend/src/routes/_private/[entity]/[action]/index.tsx` (action).
- O layout pai `/_private/` garante que a sidebar e o header estejam presentes.

---

## Template

```typescript
import { createFileRoute, useRouter, useSearch } from '@tanstack/react-router';
import z from 'zod';
import { use{{Entity}}ReadPaginated } from '@/hooks/tanstack-query/use-{{entity}}-read-paginated';
import { MetaDefault } from '@/lib/constant';
import { useAuthenticationStore } from '@/stores/authentication';

export const Route = createFileRoute('/_private/{{entities}}/')({
  component: RouteComponent,
  validateSearch: z.object({
    search: z.string().optional(),
    page: z.coerce.number().default(1),
    perPage: z.coerce.number().default(50),
  }),
});

function RouteComponent(): React.JSX.Element {
  const authenticated = useAuthenticationStore();
  const search = useSearch({ from: '/_private/{{entities}}/' });
  const router = useRouter();
  const pagination = use{{Entity}}ReadPaginated({
    ...search,
    authenticated: authenticated.authenticated?.sub,
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header da pagina */}
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1 border-b">
        <h1 className="text-2xl font-medium">{{Entities}}</h1>
        <Button onClick={() => router.navigate({ to: '/{{entities}}/create', replace: true })}>
          Novo {{Entity}}
        </Button>
      </div>

      {/* Conteudo principal com rendering condicional */}
      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        {pagination.status === 'pending' && <Skeleton />}
        {pagination.status === 'error' && <LoadError refetch={pagination.refetch} />}
        {pagination.status === 'success' && <Table{{Entity}} data={pagination.data.data} />}
      </div>

      {/* Paginacao */}
      <div className="shrink-0 border-t p-2">
        <Pagination meta={pagination.data?.meta ?? MetaDefault} />
      </div>
    </div>
  );
}
```

---

## Exemplo Real

```typescript
import { createFileRoute, useRouter, useSearch } from '@tanstack/react-router';
import z from 'zod';
import { useUserReadPaginated } from '@/hooks/tanstack-query/use-user-read-paginated';
import { MetaDefault } from '@/lib/constant';
import { useAuthenticationStore } from '@/stores/authentication';

export const Route = createFileRoute('/_private/users/')({
  component: RouteComponent,
  validateSearch: z.object({
    search: z.string().optional(),
    page: z.coerce.number().default(1),
    perPage: z.coerce.number().default(50),
  }),
});

function RouteComponent(): React.JSX.Element {
  const authenticated = useAuthenticationStore();
  const search = useSearch({ from: '/_private/users/' });
  const router = useRouter();
  const pagination = useUserReadPaginated({
    ...search,
    authenticated: authenticated.authenticated?.sub,
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1 border-b">
        <h1 className="text-2xl font-medium">Usuarios</h1>
        <Button onClick={() => router.navigate({ to: '/users/create', replace: true })}>
          Novo Usuario
        </Button>
      </div>
      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        {pagination.status === 'pending' && <Skeleton />}
        {pagination.status === 'error' && <LoadError refetch={pagination.refetch} />}
        {pagination.status === 'success' && <TableUsers data={pagination.data.data} />}
      </div>
      <div className="shrink-0 border-t p-2">
        <Pagination meta={pagination.data?.meta ?? MetaDefault} />
      </div>
    </div>
  );
}
```

**Leitura do exemplo:**

1. `createFileRoute('/_private/users/')` registra a rota no TanStack Router. O path deve corresponder exatamente a estrutura de pastas dentro de `routes/`. O prefixo `/_private/` indica que essa rota herda o layout privado.
2. `validateSearch` define o schema Zod para os parametros de URL (query string). `z.coerce.number()` converte strings da URL para numeros. `z.string().optional()` permite o parametro `search` ausente. Esses valores sao acessiveis via `useSearch`.
3. `useAuthenticationStore()` acessa o store Zustand de autenticacao para obter dados do usuario logado (como `sub`, o ID do usuario).
4. `useSearch({ from: '/_private/users/' })` le os parametros de URL tipados, ja validados pelo `validateSearch`. O `from` deve coincidir com o path do `createFileRoute`.
5. `useRouter()` fornece o metodo `navigate` para navegacao programatica. O `replace: true` substitui a entrada no historico.
6. O hook `useUserReadPaginated` recebe os parametros de busca e retorna um objeto com `status`, `data` e `refetch`.
7. O rendering condicional usa `pagination.status` para exibir Skeleton (loading), LoadError (erro com botao de retry) ou a tabela com dados.
8. O componente `Pagination` recebe `meta` com informacoes de paginacao. O fallback `MetaDefault` evita erros quando `pagination.data` e `undefined` (durante loading).

---

## Regras e Convencoes

1. **Sempre sob `/_private/`** -- toda rota autenticada deve estar dentro da pasta `routes/_private/`. Isso garante que o layout privado (sidebar, header, verificacao de auth) seja aplicado automaticamente.

2. **`createFileRoute` com path completo** -- o path passado para `createFileRoute` deve corresponder exatamente a estrutura de pastas, incluindo o prefixo `/_private/` e a barra final (ex.: `'/_private/users/'`).

3. **`validateSearch` para URL state** -- parametros de URL (search, page, perPage, filtros) sao definidos via `validateSearch` com schema Zod. Nunca leia `window.location.search` ou `URLSearchParams` manualmente.

4. **`useSearch` para ler parametros** -- sempre use `useSearch({ from: '/_private/[entity]/' })` para acessar parametros tipados. O `from` deve coincidir com o path do `createFileRoute`.

5. **Rendering condicional com status** -- sempre trate os tres estados da query: `pending` (skeleton/loading), `error` (mensagem de erro com retry) e `success` (dados renderizados). Nunca assuma que `data` esta disponivel sem checar o status.

6. **`useAuthenticationStore` para dados do usuario** -- informacoes do usuario logado (ID, nome, role) vem do store Zustand. Nunca busque essas informacoes via API dentro do componente de rota.

7. **`router.navigate` para navegacao** -- use `useRouter().navigate({ to: '/path', replace: true })` para navegacoes programaticas. Evite `window.location.href` ou manipulacao direta do historico.

8. **Layout de tres faixas (header, conteudo, footer)** -- o pattern padrao e `shrink-0` para header e footer, `flex-1 min-h-0 overflow-auto` para o conteudo principal. Isso garante scroll apenas no conteudo.

9. **`MetaDefault` como fallback** -- sempre fornecer um fallback para `pagination.data?.meta` usando `MetaDefault` da `@/lib/constant`, evitando erros de `undefined` durante o loading.

10. **`export const Route`** -- a rota deve ser exportada como named export `Route` (nao default export). Essa e uma exigencia do TanStack Router file-based routing.

---

## Checklist

- [ ] O arquivo esta em `routes/_private/[entity]/index.tsx` ou `routes/_private/[entity]/[action]/index.tsx`.
- [ ] `createFileRoute` usa o path completo com `/_private/` e barra final.
- [ ] A rota e exportada como `export const Route`.
- [ ] `validateSearch` define o schema Zod para parametros de URL.
- [ ] `useSearch` usa o mesmo `from` do `createFileRoute`.
- [ ] `useAuthenticationStore` e chamado para obter dados do usuario.
- [ ] O hook de query e chamado com os parametros de search + authenticated.
- [ ] Rendering condicional trata `pending`, `error` e `success`.
- [ ] O estado `error` renderiza um componente com `refetch` para retry.
- [ ] `Pagination` usa `MetaDefault` como fallback para `meta`.
- [ ] Navegacao programatica usa `router.navigate` com `replace: true`.
- [ ] O componente e declarado como `function RouteComponent(): React.JSX.Element`.

---

## Erros Comuns

| Erro | Causa | Correcao |
|------|-------|----------|
| Rota nao renderiza dentro do layout privado | Arquivo fora da pasta `routes/_private/` | Mover o arquivo para dentro de `routes/_private/[entity]/` |
| `useSearch` retorna tipos errados | `from` do `useSearch` nao coincide com o path do `createFileRoute` | Garantir que o `from` e identico ao path registrado (ex.: `'/_private/users/'`) |
| Parametros de URL nao convertidos para numero | Uso de `z.number()` em vez de `z.coerce.number()` no `validateSearch` | Usar `z.coerce.number()` para parametros numericos vindos da URL (que sao strings) |
| Tela branca durante loading | Faltou tratar o status `pending` da query | Adicionar rendering condicional: `{pagination.status === 'pending' && <Skeleton />}` |
| Erro `Cannot read property 'meta' of undefined` | Acesso a `pagination.data.meta` sem fallback | Usar `pagination.data?.meta ?? MetaDefault` |
| Sidebar e header ausentes | Rota nao esta sob `/_private/` ou layout nao usa `Outlet` | Verificar que a rota esta na pasta correta e que o layout `/_private/route.tsx` renderiza `<Outlet />` |
| Navegacao nao funciona | Uso de `window.location.href` em vez de `router.navigate` | Substituir por `useRouter().navigate({ to: '/path', replace: true })` |
| Hook chamado condicionalmente | `useSearch` ou `useAuthenticationStore` dentro de um `if` | Mover todos os hooks para o topo do componente (regra dos hooks React) |

---

**Cross-references:** ver [017-skill-hook-query.md](./017-skill-hook-query.md), [023-skill-store.md](./023-skill-store.md), [027-skill-layout.md](./027-skill-layout.md).
