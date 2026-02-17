# Configuracoes do Projeto

## package.json

### Scripts

| Script | Comando | Descricao |
|---|---|---|
| `dev` | `vite dev` | Servidor de desenvolvimento com HMR |
| `build` | `NODE_OPTIONS='--max-old-space-size=8192' vite build` | Build de producao com memoria extra |
| `start` | `node .output/server/index.mjs` | Executa build de producao via Nitro |
| `preview` | `vite preview` | Preview local do build |
| `test` | `vitest run` | Executa testes |
| `lint` | `prettier --write . && eslint --fix "**/*.{ts,tsx}"` | Formatacao + lint com auto-fix |
| `format` | `prettier` | Formatacao com Prettier |
| `prepare` | `husky` | Configura git hooks |

### Dependencias Principais

| Pacote | Funcao |
|---|---|
| `react`, `react-dom` | Biblioteca de UI |
| `@tanstack/react-start` | Meta-framework SSR |
| `@tanstack/react-router` | Roteamento |
| `@tanstack/react-query` | Cache e fetching |
| `@tanstack/react-form` | Formularios |
| `tailwindcss`, `@tailwindcss/vite` | Estilizacao |
| `@radix-ui/*` | Primitivos acessiveis |
| `class-variance-authority` | Variantes de componentes |
| `clsx`, `tailwind-merge` | Merge de classes CSS |
| `axios` | Cliente HTTP |
| `zod` | Validacao de schemas |
| `zustand` | Estado local |
| `@monaco-editor/react` | Editor de codigo |
| `reactjs-tiptap-editor` | Editor rich text |
| `recharts` | Graficos |
| `@dnd-kit/*` | Drag and drop |
| `sonner` | Toasts/notificacoes |
| `lucide-react` | Icones |
| `next-themes` | Tema dark/light |
| `date-fns` | Manipulacao de datas |
| `nitro` | Servidor SSR |

---

## vite.config.ts

```typescript
import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';
import viteTsConfigPaths from 'vite-tsconfig-paths';

const config = defineConfig({
  server: {
    port: 5173,
  },
  plugins: [
    devtools(),
    nitro(),
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart({
      router: {
        routeToken: 'layout',
      },
    }),
    viteReact(),
  ],
});

export default config;
```

### Plugins

| Plugin | Funcao |
|---|---|
| `devtools()` | TanStack DevTools |
| `nitro()` | Servidor SSR para producao |
| `viteTsConfigPaths` | Resolve aliases de path (`@/*`) |
| `tailwindcss()` | Processamento Tailwind CSS v4 |
| `tanstackStart` | Plugin do TanStack Start (routeToken: `layout`) |
| `viteReact()` | Suporte React (JSX, Fast Refresh) |

---

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2024",
    "jsx": "react-jsx",
    "module": "ESNext",
    "lib": ["ES2024", "DOM", "DOM.Iterable"],
    "moduleResolution": "Bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

Destaques:
- **Target ES2024**: Utiliza features modernas do JavaScript
- **Strict mode**: Todas as verificacoes de tipo habilitadas
- **Path alias**: `@/*` mapeia para `./src/*`
- **noEmit**: Build e feito pelo Vite, nao pelo tsc

---

## eslint.config.js

- Utiliza `@tanstack/eslint-config` como base
- **Ignores**: `dist`, `node_modules`, `src/components/ui` (gerado pelo shadcn)
- **Regras principais**:
  - `prettier/prettier: 'error'` — formatacao via Prettier integrada
  - `@typescript-eslint/consistent-type-imports: 'warn'` — prefere `import type`
  - `@typescript-eslint/explicit-function-return-type: 'error'` — tipo de retorno obrigatorio
  - `import/order: 'error'` — ordenacao de imports (external, internal, parent, sibling)

---

## prettier.config.js

```javascript
export default {
  trailingComma: 'all',
  tabWidth: 2,
  semi: true,
  singleQuote: true,
  arrowParens: 'always',
  proseWrap: 'always',
  printWidth: 80,
  singleAttributePerLine: true,
  endOfLine: 'auto',
};
```

---

## components.json (shadcn/ui)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles.css",
    "baseColor": "zinc",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

| Configuracao | Valor | Descricao |
|---|---|---|
| style | `new-york` | Estilo visual dos componentes |
| rsc | `false` | Sem React Server Components |
| baseColor | `zinc` | Cor base do tema |
| cssVariables | `true` | Usa CSS variables para temas |
| iconLibrary | `lucide` | Biblioteca de icones |

---

## Variaveis de Ambiente

### src/env.ts (T3 Env + Zod)

```typescript
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

| Variavel | Tipo | Padrao | Descricao |
|---|---|---|---|
| `SERVER_URL` | URL (opcional) | — | URL do servidor SSR |
| `VITE_APP_TITLE` | String (opcional) | — | Titulo da aplicacao |
| `VITE_API_BASE_URL` | URL | `http://localhost:3000` | URL base da API backend |

### .env

```
VITE_API_BASE_URL=http://localhost:3000
```
