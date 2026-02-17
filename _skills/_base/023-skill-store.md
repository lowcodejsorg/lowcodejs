# Skill: Zustand Store

O Zustand Store e o padrao de gerenciamento de estado global no frontend da aplicacao. Cada store e criada com `create` do Zustand e, quando necessario, utiliza o middleware `persist` para manter dados entre reloads do navegador. O store separa claramente estado (dados) de actions (funcoes que modificam o estado) e utiliza `partialize` para controlar exatamente quais campos sao persistidos no `localStorage` -- funcoes nunca sao persistidas. Cada store e exportada como um hook customizado (`useXxxStore`) que pode ser consumido em qualquer componente React.

---

## Estrutura do Arquivo

```
frontend/
  src/
    stores/
      [name].ts           <-- um arquivo por store
```

- Cada store vive em seu proprio arquivo em `frontend/src/stores/[name].ts`.
- O nome do arquivo reflete o dominio do store (ex.: `authentication.ts`, `sidebar.ts`, `theme.ts`).
- Tipos auxiliares especificos do store sao definidos e exportados no mesmo arquivo.

---

## Template

### Store com persist

```typescript
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type {{Name}}Store = {
  // estado
  {{field}}: {{Type}} | null;
  // actions
  set{{Field}}: ({{field}}: {{Type}} | null) => void;
  reset: () => void;
};

export const use{{Name}}Store = create<{{Name}}Store>()(
  persist(
    (set) => ({
      // estado inicial
      {{field}}: null,
      // actions
      set{{Field}}: ({{field}}) => set({ {{field}} }),
      reset: () => set({ {{field}}: null }),
    }),
    {
      name: '{{name}}-store',
      partialize: (state) => ({
        {{field}}: state.{{field}},
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
```

### Store sem persist

```typescript
import { create } from 'zustand';

type {{Name}}Store = {
  {{field}}: {{Type}};
  set{{Field}}: ({{field}}: {{Type}}) => void;
};

export const use{{Name}}Store = create<{{Name}}Store>()((set) => ({
  {{field}}: {{defaultValue}},
  set{{Field}}: ({{field}}) => set({ {{field}} }),
}));
```

---

## Exemplo Real

```typescript
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { E_ROLE } from '@/lib/constant';
import type { IUser } from '@/lib/interfaces';

export type Authenticated = Pick<IUser, 'name' | 'email'> & {
  role: keyof typeof E_ROLE;
  sub: string;
};

type AuthenticationStore = {
  authenticated: Authenticated | null;
  isAuthenticated: boolean;
  setAuthenticated: (authenticated: Authenticated | null) => void;
  logout: () => void;
};

export const useAuthenticationStore = create<AuthenticationStore>()(
  persist(
    (set) => ({
      authenticated: null,
      isAuthenticated: false,
      setAuthenticated: (authenticated) => set({ authenticated, isAuthenticated: !!authenticated }),
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

**Leitura do exemplo:**

1. **`Authenticated`** e um tipo auxiliar exportado separadamente, composto por `Pick<IUser, 'name' | 'email'>` combinado com `role` e `sub`. Esse tipo e reutilizado em outros pontos da aplicacao (rotas privadas, layout, etc.).
2. **`AuthenticationStore`** e a interface que define o contrato completo do store: dois campos de estado (`authenticated`, `isAuthenticated`) e duas actions (`setAuthenticated`, `logout`).
3. **`create<AuthenticationStore>()`** -- o generic e passado para `create` para garantir type safety. Os parenteses duplos `()()` sao necessarios quando se usa middlewares.
4. **`persist(...)`** envolve a funcao de criacao do store para habilitar persistencia automatica no `localStorage`.
5. **`(set) => ({...})`** -- a funcao recebe `set` do Zustand e retorna o estado inicial junto com as actions. `set` faz merge parcial por padrao (nao precisa de spread manual).
6. **`setAuthenticated`** atualiza `authenticated` e deriva `isAuthenticated` a partir do valor recebido usando `!!authenticated`.
7. **`logout`** reseta ambos os campos para o estado inicial.
8. **`name: 'authentication-store'`** -- chave unica usada como key no `localStorage`. Deve ser descritiva e unica na aplicacao.
9. **`partialize`** controla quais campos sao persistidos. Note que `setAuthenticated` e `logout` (funcoes) nao sao incluidas -- apenas dados puros. O campo derivado `sub` e persistido separadamente para acesso rapido.
10. **`createJSONStorage(() => localStorage)`** -- wrapper do Zustand para serializar/deserializar via JSON no `localStorage`.

---

## Regras e Convencoes

1. **Tipar o store com interface** -- toda store deve ter uma interface `type {{Name}}Store = { ... }` que define todos os campos de estado e actions. O generic `create<{{Name}}Store>()` garante type safety.

2. **Usar `persist` para dados que sobrevivem reload** -- dados de autenticacao, preferencias do usuario e configuracoes visuais devem usar `persist`. Dados transientes (modals abertos, estados de UI temporarios) nao precisam de `persist`.

3. **`partialize` para controlar o que e persistido** -- NUNCA persista funcoes (actions). Use `partialize` para selecionar explicitamente apenas os campos de dados que devem ir para o `localStorage`.

4. **`createJSONStorage(() => localStorage)`** -- sempre use este wrapper para o storage. Nunca passe `localStorage` diretamente.

5. **Nome unico para storage key** -- a propriedade `name` dentro do `persist` deve ser unica na aplicacao inteira. Convencao: `'{{dominio}}-store'` (ex.: `'authentication-store'`, `'sidebar-store'`).

6. **Actions dentro do `create`** -- todas as funcoes que modificam o estado devem ser definidas dentro do callback de `create`, nunca fora do store.

7. **Exportar tipos auxiliares separadamente** -- tipos como `Authenticated` que sao consumidos por outros modulos devem ser exportados com `export type` no mesmo arquivo do store.

8. **Hook exportado como `use{{Name}}Store`** -- a convencao de nomenclatura segue o padrao de hooks do React (`use` prefix) combinado com o dominio e sufixo `Store`.

9. **`set` faz merge parcial** -- ao chamar `set({ campo: valor })`, o Zustand faz merge automatico com o estado existente. Nao e necessario fazer spread manual do estado anterior.

10. **Um arquivo por store** -- cada dominio tem seu proprio arquivo em `frontend/src/stores/`. Nunca combine multiplos stores em um unico arquivo.

---

## Checklist

- [ ] O arquivo esta em `frontend/src/stores/[name].ts`.
- [ ] O store tem uma interface `type {{Name}}Store` definida acima do `create`.
- [ ] O generic `create<{{Name}}Store>()` esta presente.
- [ ] O hook e exportado como `export const use{{Name}}Store`.
- [ ] Se usa `persist`: a `name` e unica na aplicacao.
- [ ] Se usa `persist`: `partialize` esta presente e nao inclui funcoes.
- [ ] Se usa `persist`: `createJSONStorage(() => localStorage)` e usado como `storage`.
- [ ] Todas as actions estao definidas dentro do callback de `create`.
- [ ] Tipos auxiliares reutilizaveis estao exportados com `export type`.
- [ ] O `set` usa merge parcial (sem spread manual do estado).
- [ ] O estado inicial esta definido com valores default adequados (`null`, `false`, `[]`, etc.).

---

## Erros Comuns

| Erro | Causa | Correcao |
|------|-------|----------|
| Funcoes persistidas no `localStorage` | `partialize` ausente ou incluindo actions | Adicionar `partialize` retornando apenas campos de dados, nunca funcoes |
| `localStorage` key duplicada | Dois stores usando a mesma `name` no `persist` | Garantir que cada store tem um `name` unico (ex.: `'authentication-store'`, `'sidebar-store'`) |
| Estado resetado no reload | Store sem `persist` quando deveria ter | Adicionar middleware `persist` com `createJSONStorage(() => localStorage)` |
| `TypeError: state.setX is not a function` | Store desserializado do `localStorage` sem as actions | Consequencia de nao usar `partialize` corretamente -- as actions devem vir do `create`, nao do storage |
| Spread manual no `set` | `set((state) => ({ ...state, campo: valor }))` desnecessariamente | Simplificar para `set({ campo: valor })` -- o Zustand faz merge parcial automaticamente |
| Generic ausente no `create` | `create()` sem `<{{Name}}Store>` perde type safety | Adicionar o generic: `create<{{Name}}Store>()` |
| Parenteses duplos faltando com middleware | `create<Store>(persist(...))` em vez de `create<Store>()(persist(...))` | Usar `create<Store>()(persist(...))` -- os parenteses duplos sao obrigatorios com middlewares |
| Actions definidas fora do store | Funcoes que chamam `set` definidas fora do `create` | Mover todas as actions para dentro do callback de `create` |
| Tipo auxiliar nao exportado | Outro modulo precisa do tipo `Authenticated` mas ele nao esta exportado | Adicionar `export type` na declaracao do tipo |

---

**Cross-references:** ver [015-skill-rota-privada.md](./015-skill-rota-privada.md), [027-skill-layout.md](./027-skill-layout.md).
