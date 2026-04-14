---
name: maiyu:frontend
description: |
  Activates ALL 31 frontend skills for web projects.
  Use when: any frontend task — forms, components, data tables, CRUD pages,
  kanban, calendar, file upload, filters, rich editor, permissions, RBAC,
  stores, routes, SEO, error screens, date pickers, field masks,
  tree navigation, settings pages, API services.
  Frameworks: Next.js, TanStack Start, React (Vite), Remix, Vue.
  UI: shadcn, Radix, Tailwind, TanStack Table, TanStack Form, TanStack Query.
  State: Zustand, TanStack Query.
metadata:
  author: jhollyfer
  version: "1.0.0"
---

# maiyu:frontend — All Frontend Skills

When this skill is activated, you have access to **all 31 frontend skills**. Identify the task and read the matching skill before generating code.

## How to Operate

1. **Detect the project** — Read `package.json` (walk up directories if needed) and identify:
   - **Framework**: `next` | `@tanstack/react-start` | `react` (Vite) | `@remix-run/react` | `vue`
   - **Form lib**: `@tanstack/react-form` | `react-hook-form` | `formik`
   - **UI**: `@radix-ui/*` | `shadcn` | `tailwindcss`
   - **Table**: `@tanstack/react-table`
   - **State**: `zustand` | `@tanstack/react-query`
   - **Validator**: `zod` | `class-validator` | `joi`
   - **Package manager**: `npm` | `pnpm` | `yarn`
2. **Identify the task** — Match to a module below
3. **Read the module** — Use `Read` tool on the relative path (e.g., `skills/form.md`)
4. **Follow conventions** — All code MUST follow the rules below

## Available Modules

| Task | Module to read |
|------|---------------|
| Create a form / edit form | `skills/form.md` |
| Create a dynamic form from definitions | `skills/dynamic-form.md` |
| Create a Zod validation schema | `skills/schema.md` |
| Create a React component | `skills/component.md` |
| Create a complete CRUD page | `skills/crud-page.md` |
| Create a data table | `skills/data-table.md` |
| Advanced data table with virtualization | `skills/data-table-patterns.md` |
| Create a date picker (single/range) | `skills/datepicker.md` |
| Create error/loading/empty screens | `skills/error-screens.md` |
| Add input masks | `skills/field-mask.md` |
| Add file upload component | `skills/file-upload.md` |
| Create URL-based filter system | `skills/filter.md` |
| Create TanStack Query hooks | `skills/hook-query.md` |
| TanStack Query patterns | `skills/query-patterns.md` |
| Create kanban board | `skills/kanban.md` |
| Create a calendar view | `skills/calendar-view.md` |
| Create a Next.js App Router page | `skills/next-page.md` |
| Create page shell layout | `skills/page-shell.md` |
| Add permission system | `skills/permission.md` |
| Add role-based access control | `skills/rbac.md` |
| Create a rich text editor | `skills/rich-editor.md` |
| Define file-based routes | `skills/route.md` |
| Configure SEO | `skills/seo.md` |
| Create system settings page | `skills/settings-page.md` |
| Create Zustand store | `skills/store.md` |
| Create auth store (Zustand) | `skills/auth-store.md` |
| Create API client / service | `skills/api-service.md` |
| Create tree/hierarchical component | `skills/tree-component.md` |
| Create tree navigation | `skills/tree-navigation.md` |
| Create UI primitives (shadcn/Radix) | `skills/ui.md` |
| Create view type (list/card/kanban) | `skills/view.md` |

## Compound Tasks

- **"Create a CRUD for X"** — Read: `crud-page`, `form`, `data-table`, `hook-query`
- **"Create a new page"** — Read: `next-page` or `route`, `page-shell`, `component`
- **"Create a form"** — Read: `form`, `schema`, `field-mask`, `datepicker`
- **"Add authentication"** — Read: `auth-store`, `permission`, `rbac`
- **"Add a filter"** — Read: `filter`, `data-table`

## Conventions

All generated code MUST follow these rules:

- **Zero `any`** — use concrete types, `unknown`, generics, `Record<string, unknown>`
- **Zero ternaries** — use if/else, early return, const mapper
- **Zero `as TYPE`** — use type guards, generics (except `as const`)
- **Explicit return types** on all functions and components
- **Multiple conditions** — const mapper (object lookup instead of switch/if-else chains)
- **Named exports only** — no default exports
- **Compound components** with `data-slot` attributes
- **No prop drilling** — use context/hooks
