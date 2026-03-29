# Route Status

Telas de status e erro para rotas do TanStack Router (acesso negado,
carregamento, erro, 404).

## Arquivos

| Arquivo               | Descricao                                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `index.ts`            | Barrel export de todos os componentes                                                                                |
| `access-denied.tsx`   | Tela de acesso negado (403) com icone ShieldX e botao voltar via `router.history.back()`                             |
| `load-error.tsx`      | Tela de erro de carregamento de dados com botao "Tentar novamente" que chama `refetch()`                             |
| `route-error.tsx`     | Error boundary para rotas. Exibe mensagem do erro com botao que chama `resetErrorBoundary()` e `router.invalidate()` |
| `route-not-found.tsx` | Tela 404 com link para pagina inicial via `<Link to="/">`                                                            |
| `route-pending.tsx`   | Spinner de carregamento (Loader2 animado) exibido durante pendingComponent de rotas                                  |

## Dependencias principais

- `@tanstack/react-router` (useRouter, Link)
- Componentes UI: `Button`, `Card`, `Empty` (com EmptyMedia, EmptyTitle,
  EmptyDescription)
- Icones Lucide (ShieldXIcon, CloudAlertIcon, AlertTriangle, SearchX, Loader2)

## Padroes importantes

- Todos os componentes sao stateless (exceto RoutePending que e default export)
- `LoadError` recebe `refetch` como prop para retry
- `RouteError` recebe `error` e `resetErrorBoundary` (compativel com error
  boundary do TanStack Router)
- Layout centralizado com `min-h-[80vh]` e `flex items-center justify-center`
- UI em PT-BR (Acesso negado, Pagina nao encontrada, Algo deu errado,
  Carregando)
