---
name: maiyu:frontend-schema
description: |
  Generates Zod validation schemas for frontend projects.
  Use when: user asks to create a validation schema, form schema, Zod schema,
  request schema, or mentions "schema" or "validation" for data validation.
  Supports: Zod v4, yup, valibot.
  Frameworks: TanStack Start, React (Vite), Next.js, Remix.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **Validation**: `zod` | `yup` | `valibot` | `@sinclair/typebox`
3. Scan existing schemas to detect:
   - Schema file location (`src/lib/schemas.ts`, `src/schemas/`)
   - Constants/enums location (`src/lib/constant.ts`)
   - Language used in error messages (pt-BR or en)
   - Naming pattern (EntityBaseSchema, EntityCreateSchema)
4. If validation lib not detected, default to Zod

## Language Detection

Scan existing schema files for message language:
- **pt-BR**: `"obrigatório"`, `"deve ter"`, `"mínimo"`, `"inválido"`
- **en**: `"required"`, `"must be"`, `"minimum"`, `"invalid"`
- Match the detected language for all new error messages

## Conventions

### Naming
- Base schema: `{Entity}BaseSchema`
- Create variant: `{Entity}CreateSchema` (extends base)
- Update variant: `{Entity}UpdateSchema` (base with `.partial()` or custom)
- Query params: `{Entity}QuerySchema`
- Type export: `type {Entity}Create = z.infer<typeof {Entity}CreateSchema>`
- File: `src/lib/schemas.ts` (centralized) or `src/{feature}/schemas.ts`

### Rules
- Always `.trim()` on string fields
- Use `z.coerce.number()` for numeric query params (strings from URL)
- Use `z.coerce.boolean()` for boolean query params
- Use `.default()` for optional fields with sensible defaults
- Use `z.enum()` with constants from `constant.ts`
- Base + `.extend()` pattern for create/update variants
- Export type inference: `z.infer<typeof Schema>`
- No ternary operators — use if/else, early return, or const mapper
- No `any` type — use concrete types, `unknown`, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- Explicit return types on all functions
- Multiple conditions use const mapper (`Record` lookup) instead of switch/if-else chains

## Templates

### Zod (Reference Implementation)

**Authentication Schemas:**
```typescript
import z from 'zod';

// Sign-in (pt-BR example)
export const SignInBodySchema = z.object({
  email: z
    .string({ message: 'O e-mail é obrigatório' })
    .email('Informe um e-mail válido')
    .trim(),
  password: z
    .string({ message: 'A senha é obrigatória' })
    .trim()
    .min(1, 'A senha é obrigatória'),
});

export type SignInPayload = z.infer<typeof SignInBodySchema>;

// Sign-in (en example)
export const SignInBodySchemaEn = z.object({
  email: z
    .string({ message: 'Email is required' })
    .email('Enter a valid email')
    .trim(),
  password: z
    .string({ message: 'Password is required' })
    .trim()
    .min(1, 'Password is required'),
});
```

**CRUD Schemas — Base + Extend Pattern:**
```typescript
import z from 'zod';

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/;

// Base schema with shared fields
const UserBaseSchema = z.object({
  name: z
    .string({ message: 'O nome é obrigatório' })
    .trim()
    .min(1, 'O nome é obrigatório')
    .max(100, 'O nome deve ter no máximo 100 caracteres'),
  email: z
    .string({ message: 'O e-mail é obrigatório' })
    .email('Informe um e-mail válido')
    .trim(),
  group: z.string({ message: 'O grupo é obrigatório' }).min(1),
  status: z.string().default('active'),
});

// Create extends base with password
export const UserCreateSchema = UserBaseSchema.extend({
  password: z
    .string({ message: 'A senha é obrigatória' })
    .trim()
    .min(6, 'A senha deve ter no mínimo 6 caracteres')
    .regex(
      PASSWORD_REGEX,
      'A senha deve conter: 1 maiúscula, 1 minúscula, 1 número e 1 especial',
    ),
});

// Update uses base directly (password optional)
export const UserUpdateSchema = UserBaseSchema;

export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserUpdate = z.infer<typeof UserBaseSchema>;
```

**Entity with Enums:**
```typescript
import z from 'zod';

import {
  E_TABLE_VISIBILITY,
  E_TABLE_STYLE,
  E_TABLE_COLLABORATION,
} from '@/lib/constant';

export const TableCreateSchema = z.object({
  name: z
    .string({ message: 'O nome é obrigatório' })
    .trim()
    .min(1, 'O nome é obrigatório')
    .max(40, 'O nome deve ter no máximo 40 caracteres'),
  description: z.string().trim().default(''),
  visibility: z
    .string()
    .default(E_TABLE_VISIBILITY.RESTRICTED),
  collaboration: z
    .string()
    .default(E_TABLE_COLLABORATION.OPEN),
  style: z
    .string()
    .default(E_TABLE_STYLE.LIST),
});

export type TableCreate = z.infer<typeof TableCreateSchema>;
```

**Nested Object Schemas:**
```typescript
import z from 'zod';

export const FieldCreateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(40).trim(),
  type: z.string().min(1, 'Tipo é obrigatório'),
  format: z.string().default(''),
  required: z.boolean().default(false),
  showInList: z.boolean().default(true),
  showInForm: z.boolean().default(true),
  // Nested object
  relationship: z.object({
    tableId: z.string().default(''),
    tableSlug: z.string().default(''),
    fieldId: z.string().default(''),
    fieldSlug: z.string().default(''),
    order: z.string().default(''),
  }),
  // Array of objects
  dropdown: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
        color: z.string().optional(),
      }),
    )
    .default([]),
});

export type FieldCreate = z.infer<typeof FieldCreateSchema>;
```

**Query Params Schema (for route search params):**
```typescript
import z from 'zod';

export const TableListSearchSchema = z.object({
  page: z.coerce.number().default(1),
  perPage: z.coerce.number().default(50),
  trashed: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

export type TableListSearch = z.infer<typeof TableListSearchSchema>;
```

**Dynamic Record Schema:**
```typescript
import z from 'zod';

// For dynamic form data (row data with arbitrary fields)
export const RowDataSchema = z.record(z.string(), z.unknown());

export type RowData = z.infer<typeof RowDataSchema>;
```

### Yup Alternative

```typescript
import * as yup from 'yup';

export const UserCreateSchema = yup.object({
  name: yup.string().trim().required('Nome é obrigatório'),
  email: yup.string().trim().email('E-mail inválido').required('E-mail é obrigatório'),
  password: yup
    .string()
    .trim()
    .min(6, 'Mínimo 6 caracteres')
    .required('Senha é obrigatória'),
});

export type UserCreate = yup.InferType<typeof UserCreateSchema>;
```

## Checklist

- [ ] `.trim()` on all string fields
- [ ] `.coerce` for query param numbers/booleans
- [ ] Base + `.extend()` pattern for CRUD variants
- [ ] Type inference export with `z.infer<typeof Schema>`
- [ ] Error messages match project language (pt-BR or en)
- [ ] `.default()` for optional fields
- [ ] Enum values from `constant.ts` where applicable
- [ ] No ternary operators
