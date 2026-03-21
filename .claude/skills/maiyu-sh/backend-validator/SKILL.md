---
name: backend-validator
description: |
  Generates validation code for backend Node.js projects.
  Use when: user asks to create validators, validation schemas, input validation,
  request body/query/params validation, or mentions "validator".
  Supports: Zod, class-validator, Joi, Yup, Typebox.
  Frameworks: Fastify, Express, NestJS, AdonisJS, Hono, Elysia/Bun.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **Validator**: `zod` | `class-validator` | `joi` | `yup` | `@sinclair/typebox`
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
- No ternary operators — use if/else
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
