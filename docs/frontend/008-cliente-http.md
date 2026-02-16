# Cliente HTTP

Documentacao da camada de comunicacao HTTP do frontend LowCodeJS, incluindo a instancia Axios, o QueryClient do TanStack Query e o provider de integracao.

**Arquivos-fonte:**
- `src/lib/api.ts` -- Instancia Axios configurada
- `src/lib/query-client.ts` -- Configuracao do QueryClient
- `src/integrations/tanstack-query/root-provider.tsx` -- Provider React

---

## 1. Instancia Axios (API)

O arquivo `src/lib/api.ts` exporta uma instancia Axios pre-configurada utilizada em todas as chamadas HTTP da aplicacao.

### Configuracao

```typescript
import axios from 'axios';
import { Env } from '@/env';

const API = axios.create({
  baseURL: Env.VITE_API_BASE_URL,
  withCredentials: true,
});
```

| Propriedade | Valor | Descricao |
|-------------|-------|-----------|
| `baseURL` | `Env.VITE_API_BASE_URL` | URL base da API, definida via variavel de ambiente |
| `withCredentials` | `true` | Envia cookies automaticamente (autenticacao via httpOnly cookies) |

### Interceptors

A instancia possui dois interceptors configurados.

#### Request Interceptor

Repassa a configuracao sem modificacao. Loga erros de requisicao no console.

```typescript
API.interceptors.request.use(
  function (config) {
    return config;
  },
  function (error) {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  },
);
```

#### Response Interceptor

Repassa a resposta sem modificacao. Rejeita erros normalmente. Possui logica comentada para redirect em caso de 401 (tratamento futuro de sessao expirada).

```typescript
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Logica de redirect para 401 esta comentada
    // Pode ser ativada futuramente para sign-out automatico
    return Promise.reject(error);
  },
);
```

### Exemplo de Uso

```typescript
import { API } from '@/lib/api';
import type { Paginated, ITable } from '@/lib/interfaces';

// GET com tipagem
const response = await API.get<Paginated<ITable>>('/tables', {
  params: { page: 1, perPage: 20 },
});
console.log(response.data.data);   // Array<ITable>
console.log(response.data.meta);   // Meta

// POST
await API.post('/tables', {
  name: 'Nova Tabela',
  style: 'LIST',
});

// PUT
await API.put('/tables/minha-tabela', {
  name: 'Tabela Renomeada',
  description: 'Nova descricao',
});

// DELETE
await API.delete('/tables/minha-tabela');
```

### Tratamento de Erros

```typescript
import { API } from '@/lib/api';
import type { IHTTPException } from '@/lib/interfaces';
import { isAxiosError } from 'axios';

try {
  await API.post('/authentication/sign-in', {
    email: 'usuario@email.com',
    password: 'senha',
  });
} catch (error) {
  if (isAxiosError(error) && error.response) {
    const data = error.response.data as IHTTPException;
    console.error(data.message); // Mensagem do backend
    console.error(data.code);    // Codigo HTTP
  }
}
```

---

## 2. QueryClient

O arquivo `src/lib/query-client.ts` configura e exporta uma instancia do `QueryClient` do TanStack React Query.

### Configuracao

```typescript
import { QueryClient as Base } from '@tanstack/react-query';

export const QueryClient = new Base({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: true,
      staleTime: 60 * 60 * 1000, // 1 hora
    },
  },
});
```

### Opcoes Padrao

| Opcao | Valor | Descricao |
|-------|-------|-----------|
| `retry` | `false` | Nao re-tenta queries que falharam |
| `refetchOnWindowFocus` | `true` | Re-busca dados quando a janela ganha foco |
| `staleTime` | `3600000` (1h) | Dados sao considerados frescos por 1 hora |

### Detalhamento das Opcoes

**retry: false**
Queries que falham (erro de rede, 500, etc.) nao sao re-tentadas automaticamente. Isso evita requisicoes duplicadas e permite que o tratamento de erro do componente atue imediatamente.

**refetchOnWindowFocus: true**
Quando o usuario alterna entre abas e volta para a aplicacao, os dados sao re-buscados caso estejam stale. Isso garante que o usuario veja dados atualizados ao retornar.

**staleTime: 1 hora**
Uma vez que dados sao carregados, eles sao considerados frescos por 1 hora. Isso reduz significativamente o numero de requisicoes a API, pois dados ja carregados sao reutilizados do cache.

---

## 3. TanStack Query Provider

O arquivo `src/integrations/tanstack-query/root-provider.tsx` fornece o provider React que disponibiliza o QueryClient para toda a arvore de componentes.

### Codigo Completo

```typescript
import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { QueryClient as BaseQueryClient } from '@/lib/query-client';

export function getContext(): {
  queryClient: QueryClient;
} {
  return {
    queryClient: BaseQueryClient,
  };
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

### Funcoes Exportadas

| Funcao | Retorno | Descricao |
|--------|---------|-----------|
| `getContext()` | `{ queryClient: QueryClient }` | Retorna o contexto com a instancia do QueryClient para uso no roteamento (SSR/hydration) |
| `Provider` | `React.JSX.Element` | Componente wrapper que fornece o `QueryClientProvider` |

### getContext()

A funcao `getContext` e utilizada pelo TanStack Router para integrar o QueryClient ao sistema de roteamento. Ela retorna a instancia singleton do QueryClient, permitindo que o router pre-carregue dados durante a navegacao.

```typescript
// Uso tipico no roteador (router.tsx)
import { getContext } from '@/integrations/tanstack-query/root-provider';

const router = createRouter({
  routeTree,
  context: getContext(),
});
```

### Provider

O componente `Provider` envolve a arvore de componentes e disponibiliza o QueryClient via React Context.

```typescript
// Uso tipico no App.tsx ou main.tsx
import { Provider } from '@/integrations/tanstack-query/root-provider';
import { QueryClient } from '@/lib/query-client';

function App() {
  return (
    <Provider queryClient={QueryClient}>
      <RouterProvider router={router} />
    </Provider>
  );
}
```

---

## 4. Fluxo Completo de uma Requisicao

O diagrama abaixo mostra o fluxo tipico de uma requisicao no frontend:

```
Componente React
    |
    v
useQuery / useMutation (TanStack Query)
    |
    v
Query Function (chama API)
    |
    v
API (instancia Axios)
    |-- baseURL: Env.VITE_API_BASE_URL
    |-- withCredentials: true
    |-- Request Interceptor (pass-through)
    |
    v
Backend LowCodeJS
    |
    v
Response Interceptor (pass-through ou reject)
    |
    v
TanStack Query Cache (staleTime: 1h)
    |
    v
Componente React (re-render com dados)
```

### Exemplo Completo com useQuery

```typescript
import { useQuery } from '@tanstack/react-query';
import { API } from '@/lib/api';
import type { Paginated, IUser } from '@/lib/interfaces';

function useUsers(page: number) {
  return useQuery({
    queryKey: ['users', page],
    queryFn: async () => {
      const response = await API.get<Paginated<IUser>>('/users', {
        params: { page, perPage: 20 },
      });
      return response.data;
    },
  });
}

// No componente
function UsersList() {
  const { data, isLoading, error } = useUsers(1);

  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro ao carregar usuarios</div>;

  return (
    <ul>
      {data?.data.map((user) => (
        <li key={user._id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### Exemplo Completo com useMutation

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API } from '@/lib/api';
import type { TableCreatePayload } from '@/lib/payloads';
import type { ITable } from '@/lib/interfaces';

function useCreateTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: TableCreatePayload) => {
      const response = await API.post<ITable>('/tables', payload);
      return response.data;
    },
    onSuccess: () => {
      // Invalida o cache da listagem de tabelas
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });
}
```

---

## 5. Resumo da Arquitetura

| Camada | Arquivo | Responsabilidade |
|--------|---------|-----------------|
| HTTP Client | `src/lib/api.ts` | Instancia Axios com baseURL e cookies |
| Cache Layer | `src/lib/query-client.ts` | QueryClient com staleTime 1h, sem retry |
| React Integration | `src/integrations/tanstack-query/root-provider.tsx` | Provider e contexto para SSR |
| Tipos | `src/lib/interfaces.ts` | Tipagem das respostas |
| Payloads | `src/lib/payloads.ts` | Tipagem dos envios |
| Validacao | `src/lib/schemas.ts` | Schemas Zod para formularios |
