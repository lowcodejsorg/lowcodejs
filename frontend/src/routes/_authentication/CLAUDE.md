# Layout de Rotas Publicas de Autenticacao

Layout wrapper para rotas publicas de autenticacao (login, cadastro). Usuarios
ja autenticados sao redirecionados automaticamente.

## Estrutura

```
_authentication/
  layout.tsx          # Layout com guard de redirecionamento
  _sign-in/           # Rota pathless (renderiza em /)
    index.tsx
    index.lazy.tsx
  sign-up/            # Rota /sign-up
    index.tsx
    index.lazy.tsx
```

## Guard de Layout

O `beforeLoad` em `layout.tsx` verifica se o usuario ja esta logado via
`profileDetailOptions()`. Se existir sessao, redireciona para
`ROLE_DEFAULT_ROUTE[role]` (fallback: `/tables`). A role e extraida de
`user.group.slug`.

## Tabela de Rotas

| Diretorio   | Path                      | Descricao          |
| ----------- | ------------------------- | ------------------ |
| `_sign-in/` | `/` (pathless, rota raiz) | Pagina de login    |
| `sign-up/`  | `/sign-up`                | Pagina de cadastro |

## Padrao de Arquivos

Cada rota segue a convencao TanStack Router:

| Arquivo          | Responsabilidade                                    |
| ---------------- | --------------------------------------------------- |
| `index.tsx`      | Configuracao da rota (head/SEO, loader, beforeLoad) |
| `index.lazy.tsx` | Componente UI (carregado via lazy loading)          |

## Dependencias Chave

- `ROLE_DEFAULT_ROUTE` de `@/lib/menu/menu-access-permissions` - mapa role ->
  rota padrao
- `profileDetailOptions` de `@/hooks/tanstack-query/_query-options` - query do
  perfil do usuario
