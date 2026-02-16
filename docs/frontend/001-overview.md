# Visao Geral da Arquitetura do Frontend

## Introducao
O frontend do LowCodeJS e uma aplicacao React 19 com Server-Side Rendering (SSR) construida com **TanStack Start**, **TypeScript** e **Tailwind CSS v4**. A interface utiliza **shadcn/ui** sobre **Radix UI** para componentes acessiveis e **TanStack Query** para gerenciamento de estado do servidor.

---

## Stack Tecnologica

| Tecnologia | Versao | Funcao |
|---|---|---|
| React | 19.2+ | Biblioteca de UI |
| TanStack Start | 1.132+ | Meta-framework SSR |
| TanStack Router | 1.132+ | Roteamento file-based |
| TanStack Query | 5.66+ | Estado do servidor (cache, fetching) |
| TanStack Form | 1.0+ | Gerenciamento de formularios |
| Vite | 7.1+ | Build tool |
| Nitro | latest | Servidor SSR |
| TypeScript | 5.7+ | Linguagem |
| Tailwind CSS | 4.0+ | Estilizacao utility-first |
| shadcn/ui | — | Componentes UI (Radix + CVA) |
| Zustand | 5.0+ | Estado local (autenticacao) |
| Zod | 4.2+ | Validacao de schemas |
| Axios | 1.13+ | Cliente HTTP |
| Monaco Editor | 4.7+ | Editor de codigo (methods) |
| TipTap | 3.13+ | Editor rich text |
| Recharts | 2.15+ | Graficos (dashboard) |
| @dnd-kit | 6.3+ / 10.0+ | Drag and drop (kanban) |
| Lucide React | 0.544+ | Icones |

---

## Autenticacao

A autenticacao e gerenciada via **cookies httpOnly** emitidos pelo backend (JWT RS256). O frontend armazena apenas dados basicos do usuario (nome, email, role, sub) em um store Zustand persistido no localStorage:

```typescript
// src/stores/authentication.ts
export type Authenticated = Pick<IUser, 'name' | 'email'> & {
  role: keyof typeof E_ROLE;
  sub: string;
};
```

O fluxo de login:
1. Formulario envia POST `/authentication/sign-in` com email e senha
2. Backend retorna cookies httpOnly (accessToken + refreshToken)
3. Frontend faz GET `/profile` para obter dados do usuario
4. Dados sao armazenados no Zustand store
5. Redirect para rota padrao do role (`ROLE_DEFAULT_ROUTE`)

---

## Roteamento

O roteamento utiliza **TanStack Router** com file-based routing. As rotas sao geradas automaticamente a partir da estrutura de diretorios em `src/routes/`:

- **`_authentication/`**: Rotas publicas (sign-in, sign-up)
- **`_private/`**: Rotas protegidas com guard de autenticacao
- **`__root.tsx`**: Layout raiz com HTML head, meta tags e Toaster

---

## Validacao

A validacao de dados e feita com **Zod** em conjunto com **TanStack Form**:

```typescript
// src/lib/schemas.ts
export const SignInBodySchema = z.object({
  email: z.email('Digite um email valido'),
  password: z.string().min(1, 'A senha e obrigatoria'),
});
```

---

## Gerenciamento de Estado

| Tipo | Tecnologia | Uso |
|---|---|---|
| Estado do servidor | TanStack Query | Cache, fetching, mutations |
| Autenticacao | Zustand + persist | Dados do usuario logado |
| Formularios | TanStack Form + Zod | Estado e validacao de formularios |
| UI (sidebar) | React Context | Estado do sidebar |
| Tema | next-themes | Dark mode |

---

## Build e Desenvolvimento

| Comando | Descricao |
|---|---|
| `npm run dev` | Inicia em modo desenvolvimento (Vite dev server, porta 5173) |
| `npm run build` | Compila para producao (SSR via Nitro) |
| `npm start` | Executa o build de producao (`node .output/server/index.mjs`) |
| `npm run preview` | Preview do build |
| `npm test` | Executa testes com Vitest |
| `npm run lint` | Prettier + ESLint com auto-fix |

---

## Estrutura de Diretorios

```
frontend/
├── public/                     # Arquivos estaticos
├── src/
│   ├── components/
│   │   ├── ui/                 # 33 componentes shadcn/Radix
│   │   ├── common/             # ~101 componentes de negocio
│   │   ├── code-editor/        # Monaco Editor (methods de tabela)
│   │   ├── kanban/             # 12 componentes kanban (@dnd-kit)
│   │   └── forum/              # 10 componentes forum
│   ├── hooks/
│   │   ├── tanstack-query/     # 38+ hooks de query/mutation
│   │   ├── use-mobile.ts       # Deteccao de dispositivo
│   │   ├── use-debounced-value.tsx
│   │   └── use-table-permission.ts
│   ├── integrations/
│   │   ├── tanstack-form/      # Form hook, fields, validacao
│   │   └── tanstack-query/     # Provider, devtools, SSR
│   ├── lib/
│   │   ├── interfaces.ts       # Tipos TypeScript (IUser, ITable, IField, IRow...)
│   │   ├── constant.ts         # Enums e constantes
│   │   ├── schemas.ts          # Zod schemas
│   │   ├── api.ts              # Axios instance
│   │   ├── query-client.ts     # QueryClient config
│   │   ├── payloads.ts         # Tipos de payload
│   │   ├── menu/               # Menu dinamico e permissoes
│   │   └── *-helpers.ts        # Helpers (kanban, forum, document)
│   ├── routes/
│   │   ├── __root.tsx          # Layout raiz
│   │   ├── _authentication/    # Sign-in, sign-up
│   │   └── _private/           # Rotas protegidas
│   │       ├── layout.tsx      # Guard + sidebar + header
│   │       ├── dashboard/      # Dashboard com graficos
│   │       ├── users/          # CRUD de usuarios
│   │       ├── groups/         # CRUD de grupos
│   │       ├── menus/          # CRUD de menus
│   │       ├── tables/         # CRUD de tabelas (core)
│   │       ├── pages/          # Paginas dinamicas HTML
│   │       ├── profile/        # Perfil do usuario
│   │       ├── settings/       # Configuracoes (MASTER only)
│   │       └── tools/          # Ferramentas (clone)
│   ├── stores/
│   │   └── authentication.ts   # Zustand store
│   ├── env.ts                  # T3 Env (variaveis de ambiente)
│   ├── router.tsx              # Configuracao do router
│   ├── routeTree.gen.ts        # Arvore de rotas (auto-gerada)
│   └── styles.css              # Estilos globais (Tailwind v4)
├── components.json             # Configuracao shadcn/ui
├── Dockerfile-local            # Docker para desenvolvimento
├── Dockerfile-production       # Docker para producao
├── docker-entrypoint.sh        # Script de entrada (substituicao de URL)
├── vite.config.ts              # Configuracao Vite
├── tsconfig.json               # Configuracao TypeScript
├── eslint.config.js            # Configuracao ESLint
└── prettier.config.js          # Configuracao Prettier
```

---

## Sistema de Roles

O sistema de permissoes no frontend espelha o backend com 4 roles hierarquicos:

| Role | Menu Sidebar | Acesso |
|---|---|---|
| **MASTER** | Tabelas, Configuracoes, Menus, Grupos, Usuarios, Ferramentas, Perfil | Acesso total incluindo configuracoes do sistema |
| **ADMINISTRATOR** | Tabelas, Menus, Usuarios, Perfil | Gerenciamento de tabelas e usuarios |
| **MANAGER** | Tabelas, Perfil | Cria e gerencia tabelas proprias |
| **REGISTERED** | Tabelas, Perfil | Visualiza tabelas e cria registros |
