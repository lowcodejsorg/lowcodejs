# Stores (Estado Global)

Gerenciamento de estado global da aplicacao usando Zustand com persistencia.

## useAuthStore

Store de autenticacao do usuario, definida em `authentication.ts`.

### State

| Campo           | Tipo            | Descricao                                         |
| --------------- | --------------- | ------------------------------------------------- |
| user            | `IUser \| null` | Dados do usuario logado                           |
| isAuthenticated | `boolean`       | Indica se ha sessao ativa                         |
| hasHydrated     | `boolean`       | Indica se o estado foi restaurado do localStorage |

### Actions

| Action         | Assinatura                      | Descricao                                   |
| -------------- | ------------------------------- | ------------------------------------------- |
| setUser        | `(user: IUser \| null) => void` | Define usuario e atualiza `isAuthenticated` |
| clear          | `() => void`                    | Limpa usuario e marca como nao autenticado  |
| setHasHydrated | `(val: boolean) => void`        | Controle interno de hidratacao              |

### Persistencia

- Chave no localStorage: `low-code-js-auth`
- Middleware: `persist` com `createJSONStorage`
- Campos persistidos: `user` e `isAuthenticated` (via `partialize`)
- `hasHydrated` NAO e persistido -- e setado para `true` via
  `onRehydrateStorage` apos restauracao
- Possui fallback SSR-safe para `localStorage` (retorna storage vazio quando
  `window` e `undefined`)

## Padroes de uso

### Em componentes React

```tsx
const { user, isAuthenticated } = useAuthStore();
```

### Fora do React (ex: interceptors, utils)

```tsx
const user = useAuthStore.getState().user;
```

### Em beforeLoad (TanStack Router)

Acessar via `useAuthStore.getState()` para verificar autenticacao antes de
renderizar a rota. Verificar `hasHydrated` para garantir que o estado foi
restaurado do localStorage.

## Como criar uma nova store

1. Criar arquivo `nome-da-store.ts` neste diretorio
2. Definir o tipo com state e actions na mesma interface
3. Usar `create<Tipo>()` do Zustand
4. Se precisar persistencia, envolver com `persist()` e configurar `partialize`
   para selecionar apenas campos necessarios
5. Exportar como `useNomeStore` (convencao de hook)
