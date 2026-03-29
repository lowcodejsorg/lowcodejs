# Pagina de Sign-In

Pagina de login do sistema. Rota pathless que renderiza diretamente em `/` (rota
raiz).

## Arquivos

| Arquivo          | Responsabilidade                                                             |
| ---------------- | ---------------------------------------------------------------------------- |
| `index.tsx`      | Configuracao da rota: define `head` com titulo "Login" via `createRouteHead` |
| `index.lazy.tsx` | Componente UI do formulario de login (lazy loaded)                           |

## Configuracao da Rota

- **Path**: `/` (pathless route, `/_authentication/_sign-in/`)
- **Head/SEO**: titulo "Login"
- **Sem loader ou beforeLoad** (o guard esta no layout pai)

## Componente

### Campos do Formulario

| Campo      | Tipo                           | Validacao (Zod)                   |
| ---------- | ------------------------------ | --------------------------------- |
| `email`    | email                          | `z.email()` - email valido        |
| `password` | password (toggle visibilidade) | `z.string().min(1)` - obrigatorio |

### Bibliotecas Utilizadas

- **Formulario**: `@tanstack/react-form` com `useForm`
- **Validacao**: `zod` via `FormSignInSchema` (onChange + onSubmit)
- **Mutacao**: `useAuthenticationSignIn` de
  `@/hooks/tanstack-query/use-authentication-sign-in`
- **Erros**: `handleApiError` com `createFieldErrorSetter` para erros por campo

## Fluxo de Submissao

1. Usuario preenche email e senha, submete o formulario
2. `signInMutation.mutateAsync(payload)` envia credenciais ao backend
3. **Sucesso**: extrai role de `response.group.slug`, redireciona para
   `ROLE_DEFAULT_ROUTE[role]` com `router.navigate`, exibe toast de sucesso
4. **Erro**: `handleApiError` mapeia erros do backend para campos do formulario
   via `onFieldErrors`

## Links de Navegacao

- Link para `/sign-up` ("Nao possui uma conta? Clique aqui")
