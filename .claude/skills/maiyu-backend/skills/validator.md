---
name: maiyu:backend-validator
description: |
  Generates validation code for backend Node.js projects.
  Use when: user asks to create validators, validation schemas, input validation,
  request body/query/params validation, or mentions "validator".
  Supports: Zod, class-validator, Joi, Yup, Typebox, VineJS (AdonisJS).
  Frameworks: Fastify, Express, NestJS, AdonisJS v6/v7, Hono, Elysia/Bun.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **Validator**: `zod` | `class-validator` | `joi` | `yup` | `@sinclair/typebox` | `@vinejs/vine`
   - **Framework**: `fastify` | `express` | `@nestjs/core` | `@adonisjs/core` | `hono` | `elysia`
   - **Language**: scan existing validators for language (Portuguese messages = pt-BR, else English)
3. If validator library not detected, ask user:
   ```
   Which validation library does your project use?
   1. Zod
   2. class-validator (NestJS)
   3. Joi
   4. Yup
   5. @sinclair/typebox
   6. VineJS (AdonisJS)
   ```

## Conventions

### Naming
- File: `{action}.validator.ts` (e.g., `create.validator.ts`)
- Base file: `{entity}-base.validator.ts` (shared fields)
- Export names: `{Entity}{Action}{Part}Validator` (e.g., `UserCreateBodyValidator`)
- Type export: `{Entity}{Action}Payload` via type inference

### File Placement
- Feature-based: `resources/{entity}/{action}/{action}.validator.ts`
- Base validator: `resources/{entity}/{entity}-base.validator.ts`

### Rules
- Always `.trim()` string fields
- Use `.coerce` for query parameters (page, perPage)
- Export both the schema AND the inferred type
- Base validator with `.extend()` for action-specific validators
- No ternary operators — use if/else or early returns
- No `any` type — use `unknown`, concrete types, generics, or `Record<string, unknown>` (use `z.unknown()` not `z.any()`)
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- All functions must have explicit return types
- Multiple conditions use const mapper (object lookup) instead of switch/if-else chains
- Detect project language for error messages

## Templates

### Zod (Reference Implementation)

**Base Validator:**
```typescript
import z from 'zod';

export const {Entity}BaseValidator = z.object({
  name: z
    .string({ message: 'Name is required' })
    .trim()
    .min(1, 'Name is required'),
  email: z
    .string({ message: 'Email is required' })
    .email('Enter a valid email')
    .trim(),
});
```

**Body Validator (Create):**
```typescript
import z from 'zod';
import { {Entity}BaseValidator } from '../{entity}-base.validator';

export const {Entity}CreateBodyValidator = {Entity}BaseValidator.extend({
  password: z
    .string({ message: 'Password is required' })
    .trim()
    .min(6, 'Password must be at least 6 characters'),
});

export type {Entity}CreatePayload = z.infer<typeof {Entity}CreateBodyValidator>;
```

**Query Validator (Paginated):**
```typescript
import z from 'zod';

export const {Entity}PaginatedQueryValidator = z.object({
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(50),
  search: z.string().trim().optional(),
  'order-name': z.enum(['asc', 'desc']).optional(),
  'order-created-at': z.enum(['asc', 'desc']).optional(),
});

export type {Entity}PaginatedQuery = z.infer<typeof {Entity}PaginatedQueryValidator>;
```

**Params Validator:**
```typescript
import z from 'zod';

export const {Entity}ShowParamValidator = z.object({
  _id: z.string({ message: 'ID is required' }).min(1, 'ID is required'),
});

export type {Entity}ShowParams = z.infer<typeof {Entity}ShowParamValidator>;
```

### class-validator (NestJS)

**Body DTO:**
```typescript
import { IsString, IsEmail, MinLength, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class Create{Entity}Dto {
  @IsString({ message: 'Name is required' })
  @Transform(({ value }) => value?.trim())
  @MinLength(1, { message: 'Name is required' })
  name: string;

  @IsEmail({}, { message: 'Enter a valid email' })
  @Transform(({ value }) => value?.trim())
  email: string;

  @IsString({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;
}
```

**Query DTO:**
```typescript
import { IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class Paginated{Entity}QueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage: number = 50;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;
}
```

### Joi

```typescript
import Joi from 'joi';

export const {Entity}CreateBodyValidator = Joi.object({
  name: Joi.string().trim().min(1).required()
    .messages({ 'string.empty': 'Name is required' }),
  email: Joi.string().trim().email().required()
    .messages({ 'string.email': 'Enter a valid email' }),
  password: Joi.string().min(6).required()
    .messages({ 'string.min': 'Password must be at least 6 characters' }),
});

export type {Entity}CreatePayload = {
  name: string;
  email: string;
  password: string;
};
```

### Typebox

```typescript
import { Type, type Static } from '@sinclair/typebox';

export const {Entity}CreateBodyValidator = Type.Object({
  name: Type.String({ minLength: 1, errorMessage: 'Name is required' }),
  email: Type.String({ format: 'email', errorMessage: 'Enter a valid email' }),
  password: Type.String({ minLength: 6, errorMessage: 'Password must be at least 6 characters' }),
});

export type {Entity}CreatePayload = Static<typeof {Entity}CreateBodyValidator>;
```

### AdonisJS v6/v7 (VineJS)

**Create Validator:**
```typescript
// app/validators/{entity}_create.ts
import vine from '@vinejs/vine'

export const {Entity}CreateValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(255),
    email: vine.string().email(),
    status: vine.enum(['active', 'inactive']).optional(),
  })
)
```

**Update Validator:**
```typescript
// app/validators/{entity}_update.ts
import vine from '@vinejs/vine'

export const {Entity}UpdateValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(255).optional(),
    email: vine.string().email().optional(),
    status: vine.enum(['active', 'inactive']).optional(),
  })
)
```

**Paginated Query Validator:**
```typescript
// app/validators/{entity}_paginated.ts
import vine from '@vinejs/vine'

export const {Entity}PaginatedValidator = vine.compile(
  vine.object({
    page: vine.number().positive().optional(),
    perPage: vine.number().positive().max(100).optional(),
    search: vine.string().trim().optional(),
    orderBy: vine.enum(['createdAt', 'name', 'updatedAt']).optional(),
    order: vine.enum(['asc', 'desc']).optional(),
  })
)
```

**With Custom Rules:**
```typescript
import vine from '@vinejs/vine'
import { uniqueRule } from '#validators/rules/unique'

export const {Entity}CreateValidator = vine.compile(
  vine.object({
    email: vine.string().email().use(uniqueRule({ table: '{entities}', column: 'email' })),
    slug: vine.string().alphaNumeric({ allow: ['dash'] }).use(uniqueRule({ table: '{entities}', column: 'slug' })),
  })
)
```

## Examples

### Complete Zod Validator Set (User)

```typescript
// user-base.validator.ts
import z from 'zod';

export const UserBaseValidator = z.object({
  name: z
    .string({ message: 'O nome é obrigatório' })
    .trim()
    .min(1, 'O nome é obrigatório'),
  email: z
    .string({ message: 'O email é obrigatório' })
    .email('Digite um email válido')
    .trim(),
  group: z
    .string({ message: 'O grupo é obrigatório' })
    .min(1, 'O grupo é obrigatório'),
});

// create/create.validator.ts
import z from 'zod';
import { PASSWORD_REGEX } from '@application/core/util.core';
import { UserBaseValidator } from '../user-base.validator';

export const UserCreateBodyValidator = UserBaseValidator.extend({
  password: z
    .string({ message: 'A senha é obrigatória' })
    .trim()
    .min(6, 'A senha deve ter no mínimo 6 caracteres')
    .regex(
      PASSWORD_REGEX,
      'A senha deve conter: 1 maiúscula, 1 minúscula, 1 número e 1 especial',
    ),
});

export type UserCreatePayload = z.infer<typeof UserCreateBodyValidator>;

// update/update.validator.ts
import z from 'zod';
import { UserBaseValidator } from '../user-base.validator';

export const UserUpdateParamsValidator = z.object({
  _id: z.string({ message: 'O ID é obrigatório' }).min(1, 'O ID é obrigatório'),
});

export const UserUpdateBodyValidator = UserBaseValidator.partial().extend({
  status: z.enum(['active', 'inactive']).optional(),
});

export type UserUpdatePayload = z.infer<typeof UserUpdateBodyValidator> & { _id: string };
```

### Dynamic Payload Validation

Build a Zod schema at runtime from an array of field definitions. Useful when fields are
user-configured (e.g., form builders, dynamic tables) and cannot be known at compile time.

```typescript
import z, { type ZodTypeAny } from 'zod';

interface IFieldDef {
  slug: string;
  type: string;
  required: boolean;
  multiple?: boolean;
}

export function buildDynamicSchema(
  fieldDefinitions: Array<IFieldDef>,
): z.ZodObject<Record<string, ZodTypeAny>> {
  const shape: Record<string, ZodTypeAny> = {};

  for (const field of fieldDefinitions) {
    let schema: ZodTypeAny;

    if (field.type === 'TEXT_SHORT') {
      schema = z.string().trim();
    } else if (field.type === 'TEXT_LONG') {
      schema = z.string().trim();
    } else if (field.type === 'INTEGER') {
      schema = z.coerce.number().int();
    } else if (field.type === 'DECIMAL') {
      schema = z.coerce.number();
    } else if (field.type === 'DATE') {
      schema = z.coerce.date();
    } else if (field.type === 'DROPDOWN') {
      if (field.multiple) {
        schema = z.array(z.string());
      } else {
        schema = z.string();
      }
    } else if (field.type === 'FILE') {
      schema = z.unknown();
    } else if (field.type === 'BOOLEAN') {
      schema = z.boolean();
    } else if (field.type === 'RELATIONSHIP') {
      schema = z.string(); // ID reference
    } else {
      schema = z.unknown();
    }

    if (!field.required) {
      schema = schema.optional();
    }

    shape[field.slug] = schema;
  }

  return z.object(shape);
}

export type DynamicPayload = z.infer<ReturnType<typeof buildDynamicSchema>>;
```

### Format-Specific Validators (Composable Refinements)

Reusable Zod refinements for common field formats. Import and compose them into any schema.

```typescript
import z, { type ZodString } from 'zod';

export const emailValidator = z.string().trim().email('Enter a valid email');

export const phoneValidator = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Enter a valid international phone number');

export const urlValidator = z.string().trim().url('Enter a valid URL');

export const passwordValidator = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character');

function calculateCpfDigits(digits: Array<number>): boolean {
  function calcDigit(slice: Array<number>, factor: number): number {
    let sum = 0;
    for (let i = 0; i < slice.length; i++) {
      sum += slice[i] * (factor - i);
    }
    const remainder = sum % 11;
    if (remainder < 2) {
      return 0;
    }
    return 11 - remainder;
  }

  const first = calcDigit(digits.slice(0, 9), 10);
  if (first !== digits[9]) {
    return false;
  }

  const second = calcDigit(digits.slice(0, 10), 11);
  if (second !== digits[10]) {
    return false;
  }

  return true;
}

export const cpfValidator = z
  .string()
  .trim()
  .refine((value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length !== 11) {
      return false;
    }
    const allSame = cleaned.split('').every((d) => d === cleaned[0]);
    if (allSame) {
      return false;
    }
    const digits = cleaned.split('').map(Number);
    return calculateCpfDigits(digits);
  }, 'Enter a valid CPF');

function calculateCnpjDigits(digits: Array<number>): boolean {
  function calcDigit(slice: Array<number>, weights: Array<number>): number {
    let sum = 0;
    for (let i = 0; i < slice.length; i++) {
      sum += slice[i] * weights[i];
    }
    const remainder = sum % 11;
    if (remainder < 2) {
      return 0;
    }
    return 11 - remainder;
  }

  const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const first = calcDigit(digits.slice(0, 12), firstWeights);
  if (first !== digits[12]) {
    return false;
  }

  const secondWeights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const second = calcDigit(digits.slice(0, 13), secondWeights);
  if (second !== digits[13]) {
    return false;
  }

  return true;
}

export const cnpjValidator = z
  .string()
  .trim()
  .refine((value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length !== 14) {
      return false;
    }
    const allSame = cleaned.split('').every((d) => d === cleaned[0]);
    if (allSame) {
      return false;
    }
    const digits = cleaned.split('').map(Number);
    return calculateCnpjDigits(digits);
  }, 'Enter a valid CNPJ');

type FormatName = 'email' | 'phone' | 'cpf' | 'cnpj' | 'url' | 'password';

const FORMAT_MAP: Record<FormatName, z.ZodTypeAny> = {
  email: emailValidator,
  phone: phoneValidator,
  cpf: cpfValidator,
  cnpj: cnpjValidator,
  url: urlValidator,
  password: passwordValidator,
};

export function applyFormat(baseSchema: ZodString, format: FormatName): z.ZodTypeAny {
  const formatSchema = FORMAT_MAP[format];
  if (!formatSchema) {
    return baseSchema;
  }
  return formatSchema;
}
```

### Conditional Required Fields

Patterns for fields that become required based on the value of another field or resource state.

**Discriminated Union — shape changes by a literal field:**
```typescript
import z from 'zod';

export const ResourceValidator = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('active'),
    name: z
      .string({ message: 'Name is required when active' })
      .trim()
      .min(1, 'Name is required when active'),
    description: z.string().trim().optional(),
  }),
  z.object({
    status: z.literal('draft'),
    name: z.string().trim().optional(),
    description: z.string().trim().optional(),
  }),
]);

export type ResourcePayload = z.infer<typeof ResourceValidator>;
```

**superRefine — cross-field conditional logic:**
```typescript
import z from 'zod';

export const ConditionalValidator = z
  .object({
    status: z.enum(['active', 'inactive', 'draft']),
    name: z.string().trim().optional(),
    email: z.string().trim().optional(),
    trashedAt: z.coerce.date().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    const isNotTrashed = !data.trashedAt;

    if (data.status === 'active' && !data.name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Name is required when status is active',
        path: ['name'],
      });
    }

    if (data.status === 'active' && !data.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Email is required when status is active',
        path: ['email'],
      });
    }

    if (isNotTrashed && !data.name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Name is required for non-trashed resources',
        path: ['name'],
      });
    }
  });

export type ConditionalPayload = z.infer<typeof ConditionalValidator>;
```

## Checklist

Before delivering generated validators, verify:

- [ ] No ternary operators — all branching uses if/else
- [ ] All exports are named (no default exports)
- [ ] TypeScript types are exported alongside schemas (`z.infer<typeof ...>`)
- [ ] String fields have `.trim()`
- [ ] Query parameters use `.coerce` for numeric values
- [ ] Base validator exists and action-specific validators use `.extend()`
- [ ] Error messages match the detected project language
- [ ] File is placed at `resources/{entity}/{action}/{action}.validator.ts`
- [ ] Dynamic schemas handle all supported field types with fallback to `z.unknown()`
- [ ] Format validators (CPF, CNPJ, email, phone) use `.refine()` with proper algorithms
- [ ] Conditional required fields use `discriminatedUnion` or `superRefine` (not inline ternaries)
- [ ] `.optional()` is applied based on field definition, not hardcoded
