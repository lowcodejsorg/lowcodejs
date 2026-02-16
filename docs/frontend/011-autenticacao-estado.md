# Autenticacao e Estado

Documentacao do sistema de autenticacao e gerenciamento de estado do frontend LowCodeJS. Cobre o store Zustand de autenticacao (`src/stores/authentication.ts`), a configuracao de variaveis de ambiente com T3 Env (`src/env.ts`) e a instancia Axios (`src/lib/api.ts`).

---

## Visao Geral

O frontend utiliza uma arquitetura de autenticacao baseada em cookies httpOnly gerenciados pelo backend. O estado do usuario autenticado e mantido no cliente via Zustand com persistencia em localStorage, enquanto o token real de sessao e transportado automaticamente via cookies.

---

## Store de Autenticacao (Zustand)

**Arquivo:** `src/stores/authentication.ts`

O store e criado com `zustand` e utiliza o middleware `persist` para manter os dados entre recarregamentos de pagina.

### Tipo `Authenticated`

```ts
export type Authenticated = Pick<IUser, 'name' | 'email'> & {
  role: keyof typeof E_ROLE;
  sub: string;
};
```

| Campo  | Tipo                     | Descricao                                      |
|--------|--------------------------|-------------------------------------------------|
| `name` | `string`                 | Nome do usuario autenticado                     |
| `email`| `string`                 | Email do usuario autenticado                    |
| `role` | `keyof typeof E_ROLE`    | Papel do usuario (MASTER, ADMINISTRATOR, etc.)  |
| `sub`  | `string`                 | ID unico do usuario (subject do JWT)            |

Os papeis disponiveis em `E_ROLE` sao:

| Papel            | Descricao                |
|------------------|--------------------------|
| `MASTER`         | Super Administrador      |
| `ADMINISTRATOR`  | Administrador            |
| `MANAGER`        | Gerente                  |
| `REGISTERED`     | Registrado               |

### Tipo `AuthenticationStore`

```ts
type AuthenticationStore = {
  authenticated: Authenticated | null;
  isAuthenticated: boolean;
  setAuthenticated: (authenticated: Authenticated | null) => void;
  logout: () => void;
};
```

| Propriedade        | Tipo                                              | Descricao                                    |
|--------------------|---------------------------------------------------|----------------------------------------------|
| `authenticated`    | `Authenticated \| null`                           | Dados do usuario autenticado ou null         |
| `isAuthenticated`  | `boolean`                                         | Flag derivada indicando se ha usuario logado |
| `setAuthenticated` | `(authenticated: Authenticated \| null) => void`  | Define os dados do usuario autenticado       |
| `logout`           | `() => void`                                      | Limpa o estado de autenticacao               |

### Implementacao Completa

```ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const useAuthenticationStore = create<AuthenticationStore>()(
  persist(
    (set) => ({
      authenticated: null,
      isAuthenticated: false,
      setAuthenticated: (authenticated) =>
        set({ authenticated, isAuthenticated: !!authenticated }),
      logout: () => set({ authenticated: null, isAuthenticated: false }),
    }),
    {
      name: 'authentication-store',
      partialize: (state) => ({
        authenticated: state.authenticated,
        isAuthenticated: state.isAuthenticated,
        sub: state.authenticated?.sub,
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
```

### Persistencia

| Configuracao   | Valor                    | Descricao                                          |
|----------------|--------------------------|-----------------------------------------------------|
| `name`         | `'authentication-store'` | Chave usada no localStorage                         |
| `partialize`   | Funcao customizada       | Persiste apenas `authenticated`, `isAuthenticated` e `sub` |
| `storage`      | `localStorage`           | Armazena os dados no localStorage do navegador       |

O middleware `persist` serializa automaticamente o estado parcializado para JSON e o restaura ao inicializar a aplicacao.

---

## Configuracao de Ambiente (T3 Env)

**Arquivo:** `src/env.ts`

O projeto utiliza `@t3-oss/env-core` para validacao type-safe das variaveis de ambiente com Zod.

```ts
import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const Env = createEnv({
  server: {
    SERVER_URL: z.url().optional(),
  },
  clientPrefix: 'VITE_',
  client: {
    VITE_APP_TITLE: z.string().min(1).optional(),
    VITE_API_BASE_URL: z.url().default('http://localhost:3000'),
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
});
```

### Variaveis de Ambiente

| Variavel            | Tipo       | Obrigatoria | Padrao                    | Descricao                              |
|---------------------|------------|-------------|---------------------------|----------------------------------------|
| `SERVER_URL`        | `url`      | Nao         | -                         | URL do servidor (lado servidor)        |
| `VITE_APP_TITLE`    | `string`   | Nao         | -                         | Titulo da aplicacao                    |
| `VITE_API_BASE_URL` | `url`      | Nao         | `http://localhost:3000`   | URL base da API do backend             |

### Opcoes de Configuracao

| Opcao                     | Valor            | Descricao                                                |
|---------------------------|------------------|----------------------------------------------------------|
| `clientPrefix`            | `'VITE_'`        | Prefixo obrigatorio para variaveis do cliente (Vite)     |
| `runtimeEnv`              | `import.meta.env`| Fonte das variaveis de ambiente em runtime               |
| `emptyStringAsUndefined`  | `true`           | Strings vazias sao tratadas como `undefined`             |

---

## Instancia Axios (API)

**Arquivo:** `src/lib/api.ts`

A instancia Axios centraliza todas as chamadas HTTP ao backend.

```ts
import axios from 'axios';
import { Env } from '@/env';

const API = axios.create({
  baseURL: Env.VITE_API_BASE_URL,
  withCredentials: true,
});
```

### Configuracao

| Propriedade       | Valor                       | Descricao                                                       |
|-------------------|-----------------------------|-----------------------------------------------------------------|
| `baseURL`         | `Env.VITE_API_BASE_URL`     | URL base da API, validada pelo T3 Env                           |
| `withCredentials` | `true`                      | Envia cookies httpOnly automaticamente em todas as requisicoes   |

### Interceptors

A instancia possui dois interceptors configurados:

- **Request interceptor:** Repassa a configuracao sem modificacao (ponto de extensao para headers futuros).
- **Response interceptor:** Propaga erros normalmente. Contem codigo comentado para redirecionamento automatico em caso de erro 401 (nao autorizado).

---

## Integracao com Cookies httpOnly

A autenticacao do LowCodeJS utiliza um modelo hibrido:

1. **Backend:** Gerencia tokens JWT em cookies httpOnly (nao acessiveis via JavaScript)
2. **Frontend:** Armazena apenas dados de exibicao (nome, email, role) no Zustand/localStorage

A flag `withCredentials: true` na instancia Axios garante que o navegador envie automaticamente os cookies em todas as requisicoes cross-origin.

---

## Fluxo Completo de Sign-In

```
1. Usuario preenche email e senha
2. Frontend chama useAuthenticationSignIn
3. Hook executa POST /authentication/sign-in com credenciais
4. Backend valida, define cookie httpOnly com JWT
5. Hook executa GET /profile para obter dados do usuario
6. Callback onSuccess recebe IUser
7. Componente chama setAuthenticated com dados do usuario
8. Zustand persiste estado no localStorage
9. Usuario e redirecionado para area autenticada
```

### Exemplo de uso no componente:

```tsx
const auth = useAuthenticationStore();

const signIn = useAuthenticationSignIn({
  onSuccess(user) {
    auth.setAuthenticated({
      name: user.name,
      email: user.email,
      role: user.group.slug as keyof typeof E_ROLE,
      sub: user._id,
    });
    navigate({ to: '/tables' });
  },
  onError(error) {
    toast.error('Credenciais invalidas');
  },
});

// Disparar o login
signIn.mutate({ email: 'user@email.com', password: 'senha123' });
```

---

## Fluxo Completo de Sign-Out

```
1. Usuario clica em sair
2. Frontend chama useAuthenticationSignOut
3. Hook executa POST /authentication/sign-out
4. Backend invalida cookie httpOnly
5. Callback onSuccess e disparado
6. Componente chama auth.logout()
7. Zustand limpa estado e atualiza localStorage
8. Usuario e redirecionado para pagina de login
```

### Exemplo de uso no componente:

```tsx
const auth = useAuthenticationStore();

const signOut = useAuthenticationSignOut({
  onSuccess() {
    auth.logout();
    navigate({ to: '/' });
  },
  onError(error) {
    console.error('Erro ao fazer logout:', error);
  },
});

// Disparar o logout
signOut.mutate();
```

---

## Verificacao de Autenticacao em Componentes

O store pode ser acessado em qualquer componente para verificar o estado de autenticacao:

```tsx
function ProtectedComponent() {
  const { authenticated, isAuthenticated } = useAuthenticationStore();

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" />;
  }

  return (
    <div>
      <p>Bem-vindo, {authenticated?.name}!</p>
      <p>Papel: {authenticated?.role}</p>
    </div>
  );
}
```

---

## Estrutura de Arquivos

```
src/
  stores/
    authentication.ts       # Store Zustand com persistencia
  env.ts                    # Configuracao T3 Env
  lib/
    api.ts                  # Instancia Axios com withCredentials
    constant.ts             # E_ROLE e outras constantes
    interfaces.ts           # Tipos IUser, etc.
  hooks/
    tanstack-query/
      use-authentication-sign-in.tsx   # Hook de login
      use-authentication-sign-out.tsx  # Hook de logout
      use-authentication-sign-up.tsx   # Hook de registro
```
