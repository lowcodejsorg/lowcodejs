# Schemas de Validacao

Documentacao completa dos schemas Zod utilizados para validacao de formularios e payloads no frontend do LowCodeJS.

**Arquivo-fonte:** `src/lib/schemas.ts`

**Dependencia principal:** [Zod](https://zod.dev/) -- biblioteca de validacao de schemas com inferencia de tipos.

---

## 1. Visao Geral

O arquivo `schemas.ts` define todos os schemas de validacao utilizados nos formularios e nas chamadas de API. Cada schema valida os dados antes de serem enviados ao backend e fornece mensagens de erro em portugues.

Os schemas estao organizados por entidade:

| Grupo | Schemas | Descricao |
|-------|---------|-----------|
| Autenticacao | 5 | Login, cadastro, recuperacao de senha |
| Usuarios | 5 | Criacao, edicao, formulario de edicao |
| Grupos | 3 | Criacao e edicao de grupos |
| Menus | 3 | Criacao e edicao de menus |
| Tabelas | 11 | Criacao, edicao, estilo, visibilidade, metodos |
| Campos | 6 | Criacao, edicao, schemas auxiliares |
| Registros | 3 | Dados dinamicos, params |
| Perfil | 2 | Atualizacao de perfil |
| Configuracoes | 1 | Atualizacao de configuracoes |

---

## 2. Schemas de Autenticacao

### SignInBodySchema

Validacao do formulario de login.

```typescript
export const SignInBodySchema = z.object({
  email: z.email().trim(),
  password: z.string().trim().min(1),
});
```

| Campo | Tipo | Regras |
|-------|------|--------|
| `email` | `string` | Email valido, trim |
| `password` | `string` | Minimo 1 caractere, trim |

### SignUpBodySchema

Validacao do formulario de cadastro.

```typescript
export const SignUpBodySchema = z.object({
  name: z.string().trim().min(1),
  email: z.email().trim(),
  password: z.string().trim().min(8),
});
```

| Campo | Tipo | Regras |
|-------|------|--------|
| `name` | `string` | Minimo 1 caractere |
| `email` | `string` | Email valido |
| `password` | `string` | Minimo 8 caracteres |

### RequestCodeBodySchema

Validacao da solicitacao de codigo de recuperacao.

```typescript
export const RequestCodeBodySchema = z.object({
  email: z.email().trim(),
});
```

### ValidateCodeBodySchema

Validacao do codigo recebido.

```typescript
export const ValidateCodeBodySchema = z.object({
  code: z.string().trim(),
});
```

### ResetPasswordBodySchema e ResetPasswordParamsSchema

```typescript
export const ResetPasswordBodySchema = z.object({
  password: z.string().trim().min(8),
});

export const ResetPasswordParamsSchema = z.object({
  _id: z.string().trim(),
});
```

---

## 3. Schemas de Usuarios

### UserBaseSchema

Schema base reutilizado por criacao e edicao. Inclui mensagens de erro em portugues.

```typescript
export const UserBaseSchema = z.object({
  name: z
    .string({ message: 'O nome e obrigatorio' })
    .trim()
    .min(1, 'O nome e obrigatorio'),
  email: z
    .string({ message: 'O email e obrigatorio' })
    .trim()
    .email('Digite um email valido'),
  group: z
    .string({ message: 'O grupo e obrigatorio' })
    .min(1, 'O grupo e obrigatorio'),
});
```

### UserCreateBodySchema

Estende `UserBaseSchema` com campo de senha.

```typescript
export const UserCreateBodySchema = UserBaseSchema.extend({
  password: z
    .string({ message: 'A senha e obrigatoria' })
    .trim()
    .min(6, 'A senha deve ter no minimo 6 caracteres')
    .regex(
      PASSWORD_REGEX,
      'A senha deve conter: 1 maiuscula, 1 minuscula, 1 numero e 1 especial',
    ),
});
```

| Campo | Tipo | Regras |
|-------|------|--------|
| `name` | `string` | Obrigatorio, minimo 1 caractere |
| `email` | `string` | Obrigatorio, email valido |
| `group` | `string` | Obrigatorio, ID do grupo |
| `password` | `string` | Minimo 6 caracteres, regex de forca |

### UserUpdateBodySchema

Todos os campos de `UserBaseSchema` sao opcionais (`.partial()`).

```typescript
export const UserUpdateBodySchema = UserBaseSchema.partial().extend({
  password: z.string().trim().min(6).regex(PASSWORD_REGEX).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
```

### UserUpdateFormSchema

Schema especifico para o formulario de edicao (campos obrigatorios, senha com refine).

```typescript
export const UserUpdateFormSchema = UserBaseSchema.extend({
  password: z.string().refine(
    (val) => val === '' || (val.length >= 6 && PASSWORD_REGEX.test(val)),
    'A senha deve ter 6+ caracteres com: 1 maiuscula, 1 minuscula, 1 numero e 1 especial',
  ),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});
```

### UserUpdateParamsSchema

```typescript
export const UserUpdateParamsSchema = z.object({
  _id: z.string({ message: 'O ID e obrigatorio' }).trim().min(1),
});
```

---

## 4. Schemas de Grupos de Usuarios

### UserGroupCreateBodySchema

```typescript
export const UserGroupCreateBodySchema = z.object({
  name: z.string().trim(),
  description: z.string().trim().nullable(),
  permissions: z.array(z.string().trim()).default([]),
});
```

| Campo | Tipo | Regras |
|-------|------|--------|
| `name` | `string` | Obrigatorio |
| `description` | `string \| null` | Nullable |
| `permissions` | `Array<string>` | Default `[]` |

### UserGroupUpdateBodySchema

```typescript
export const UserGroupUpdateBodySchema = z.object({
  name: z.string().trim().optional(),
  description: z.string().trim().nullable().optional(),
  permissions: z.array(z.string().trim()).default([]),
});
```

### UserGroupUpdateParamsSchema

```typescript
export const UserGroupUpdateParamsSchema = z.object({
  _id: z.string(),
});
```

---

## 5. Schemas de Menus

### MenuCreateBodySchema e MenuUpdateBodySchema

Ambos compartilham a mesma estrutura.

```typescript
const MenuTypeEnum = z.enum(['TABLE', 'PAGE', 'FORM', 'EXTERNAL', 'SEPARATOR']);

export const MenuCreateBodySchema = z.object({
  name: z.string().trim().min(1, 'Nome e obrigatorio'),
  type: MenuTypeEnum,
  table: z.string().default(''),
  parent: z.string().default(''),
  html: z.string().default(''),
  url: z.string().default(''),
});
```

| Campo | Tipo | Regras |
|-------|------|--------|
| `name` | `string` | Obrigatorio, minimo 1 caractere |
| `type` | `enum` | `TABLE \| PAGE \| FORM \| EXTERNAL \| SEPARATOR` |
| `table` | `string` | Default `''` |
| `parent` | `string` | Default `''` |
| `html` | `string` | Default `''` |
| `url` | `string` | Default `''` |

### MenuUpdateParamsSchema

```typescript
export const MenuUpdateParamsSchema = z.object({
  _id: z.string().min(1, 'ID e obrigatorio'),
});
```

---

## 6. Schemas de Tabelas

### Schemas Atomicos

Schemas individuais para cada propriedade configuravel da tabela. Cada um possui um valor `default`.

| Schema | Tipo | Default |
|--------|------|---------|
| `TableStyleSchema` | enum de estilos | `'LIST'` |
| `TableVisibilitySchema` | enum de visibilidade | `'RESTRICTED'` |
| `TableCollaborationSchema` | enum de colaboracao | `'OPEN'` |
| `TableAdministratorsSchema` | `Array<string>` | `[]` |
| `TableFieldOrderListSchema` | `Array<string>` | `[]` |
| `TableFieldOrderFormSchema` | `Array<string>` | `[]` |

```typescript
export const TableStyleSchema = z
  .enum(['GALLERY', 'LIST', 'DOCUMENT', 'CARD', 'MOSAIC', 'KANBAN', 'FORUM'])
  .default('LIST');

export const TableVisibilitySchema = z
  .enum(['PUBLIC', 'RESTRICTED', 'OPEN', 'FORM', 'PRIVATE'])
  .default('RESTRICTED');

export const TableCollaborationSchema = z
  .enum(['OPEN', 'RESTRICTED'])
  .default('OPEN');
```

### TableCreateBodySchema

```typescript
export const TableCreateBodySchema = z.object({
  name: z.string().trim()
    .min(1, 'Nome e obrigatorio')
    .max(40, 'Nome deve ter no maximo 40 caracteres')
    .regex(
      /^[a-zA-ZaaaaaeeeiioooouucAAAAEEEIIOOOOUUC0-9\s\-_]+$/,
      'Nome pode conter apenas letras, numeros, espacos, hifen, underscore e c',
    ),
  owner: z.string().trim().optional(),
  logo: z.string().trim().nullable().optional(),
  style: TableStyleSchema.optional(),
  visibility: TableVisibilitySchema.optional(),
  collaboration: TableCollaborationSchema.optional(),
  administrators: TableAdministratorsSchema.optional(),
  fieldOrderList: TableFieldOrderListSchema.optional(),
  fieldOrderForm: TableFieldOrderFormSchema.optional(),
});
```

| Campo | Tipo | Regras |
|-------|------|--------|
| `name` | `string` | 1-40 chars, regex para caracteres validos |
| `owner` | `string?` | Opcional, ID do proprietario |
| `logo` | `string?` | Opcional, nullable |
| `style` | `enum?` | Opcional, default LIST |
| `visibility` | `enum?` | Opcional, default RESTRICTED |
| `collaboration` | `enum?` | Opcional, default OPEN |
| `administrators` | `Array<string>?` | Opcional, default [] |
| `fieldOrderList` | `Array<string>?` | Opcional, default [] |
| `fieldOrderForm` | `Array<string>?` | Opcional, default [] |

### TableUpdateBodySchema

Todos os campos sao obrigatorios (pois o formulario envia todos os valores).

```typescript
export const TableUpdateBodySchema = z.object({
  name: z.string().trim().min(1).max(40).regex(/*...*/),
  description: z.string().trim().nullable(),
  logo: z.string().trim().nullable(),
  style: TableStyleSchema,
  visibility: TableVisibilitySchema,
  collaboration: TableCollaborationSchema,
  administrators: TableAdministratorsSchema,
  fieldOrderList: TableFieldOrderListSchema,
  fieldOrderForm: TableFieldOrderFormSchema,
  methods: TableMethodSchema,
});
```

### TableMethodSchema

Schema para hooks de codigo da tabela.

```typescript
export const TableMethodSchema = z.object({
  beforeSave: z.object({ code: z.string().trim().nullable() }),
  afterSave: z.object({ code: z.string().trim().nullable() }),
  onLoad: z.object({ code: z.string().trim().nullable() }),
});
```

### TableUpdateParamsSchema

```typescript
export const TableUpdateParamsSchema = z.object({
  slug: z.string().trim(),
});
```

---

## 7. Schemas de Campos (Fields)

### Schemas Auxiliares

#### CategorySchema

```typescript
const CategorySchema = z.object({
  id: z.string().trim(),
  label: z.string().trim(),
  children: z.array(z.unknown()).default([]),
});
```

#### RelationshipSchema

```typescript
const RelationshipSchema = z.object({
  table: z.object({
    _id: z.string().trim(),
    slug: z.string().trim(),
  }),
  field: z.object({
    _id: z.string().trim(),
    slug: z.string().trim(),
  }),
  order: z.enum(['asc', 'desc']).default('asc'),
});
```

#### DropdownSchema

```typescript
const DropdownSchema = z.object({
  id: z.string().trim(),
  label: z.string().trim(),
  color: z.string().nullable().optional(),
});
```

### FieldBaseSchema

Schema base com todas as propriedades de configuracao de campo.

```typescript
export const FieldBaseSchema = z.object({
  required: z.boolean().default(false),
  multiple: z.boolean().default(false),
  format: z.enum([/* todos os E_FIELD_FORMAT */]).nullable().default(null),
  showInFilter: z.boolean().default(false),
  showInForm: z.boolean().default(false),
  showInDetail: z.boolean().default(false),
  showInList: z.boolean().default(false),
  widthInForm: z.number().nullable().default(50),
  widthInList: z.number().nullable().default(10),
  locked: z.boolean().default(false),
  defaultValue: z.string().nullable().default(null),
  relationship: RelationshipSchema.nullable().default(null),
  dropdown: z.array(DropdownSchema).default([]),
  category: z.array(CategorySchema).default([]),
  group: z.object({
    _id: z.string().trim().optional(),
    slug: z.string().trim(),
  }).nullable().default(null),
});
```

| Campo | Tipo | Default | Descricao |
|-------|------|---------|-----------|
| `required` | `boolean` | `false` | Se o campo e obrigatorio |
| `multiple` | `boolean` | `false` | Se aceita multiplos valores |
| `format` | `enum \| null` | `null` | Formato do campo |
| `showInFilter` | `boolean` | `false` | Exibir no filtro |
| `showInForm` | `boolean` | `false` | Exibir no formulario |
| `showInDetail` | `boolean` | `false` | Exibir no detalhe |
| `showInList` | `boolean` | `false` | Exibir na listagem |
| `widthInForm` | `number \| null` | `50` | Largura no form (%) |
| `widthInList` | `number \| null` | `10` | Largura na lista (%) |
| `locked` | `boolean` | `false` | Se esta bloqueado |
| `defaultValue` | `string \| null` | `null` | Valor padrao |
| `relationship` | `object \| null` | `null` | Config de relacionamento |
| `dropdown` | `Array<Dropdown>` | `[]` | Opcoes de dropdown |
| `category` | `Array<Category>` | `[]` | Arvore de categorias |
| `group` | `object \| null` | `null` | Config de grupo |

### FieldCreateBodySchema

Merge de campos de identificacao com `FieldBaseSchema`.

```typescript
export const FieldCreateBodySchema = z
  .object({
    name: z.string().trim(),
    type: z.enum([
      'TEXT_SHORT', 'TEXT_LONG', 'DROPDOWN', 'DATE',
      'RELATIONSHIP', 'FILE', 'FIELD_GROUP', 'REACTION',
      'EVALUATION', 'CATEGORY', 'USER',
    ]),
  })
  .merge(FieldBaseSchema);
```

### FieldUpdateBodySchema

Inclui campos adicionais `trashed` e `trashedAt`.

```typescript
export const FieldUpdateBodySchema = z
  .object({
    name: z.string().trim(),
    type: z.enum([/* mesmos tipos */]),
    trashed: z.boolean().default(false),
    trashedAt: z.string().nullable().default(null),
  })
  .merge(FieldBaseSchema);
```

### Params Schemas

```typescript
export const FieldCreateParamsSchema = z.object({
  slug: z.string().trim(), // Slug da tabela
});

export const FieldUpdateParamsSchema = z.object({
  slug: z.string().trim(),  // Slug da tabela
  _id: z.string().trim(),   // ID do campo
});
```

---

## 8. Schemas de Registros (Rows)

### RowDataSchema

Schema para dados dinamicos de um registro. Aceita uma variedade de tipos.

```typescript
export const RowDataSchema = z.record(
  z.string(),
  z.union([
    z.string().trim(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(z.string().trim()),
    z.array(z.number()),
    z.array(z.object({ _id: z.string().trim().optional() }).loose()),
    z.object({}).loose(),
  ]),
);
```

Tipos de valor aceitos para cada chave:

| Tipo | Exemplo | Uso |
|------|---------|-----|
| `string` | `"texto"` | Campos de texto, data |
| `number` | `42` | Avaliacoes |
| `boolean` | `true` | Flags |
| `null` | `null` | Campos vazios |
| `Array<string>` | `["op1", "op2"]` | Dropdown, categoria |
| `Array<number>` | `[1, 2, 3]` | Valores numericos |
| `Array<object>` | `[{ _id: "..." }]` | Relacionamentos, arquivos |
| `object` | `{ key: "val" }` | Dados genericos |

### Tipo Inferido

```typescript
export type RowData = z.infer<typeof RowDataSchema>;
// Resultado: Record<string, string | number | boolean | null | ...>
```

### Params Schemas

```typescript
export const RowCreateParamsSchema = z.object({
  slug: z.string().trim(), // Slug da tabela
});

export const RowUpdateParamsSchema = z.object({
  slug: z.string().trim(), // Slug da tabela
  _id: z.string().trim(),  // ID do registro
});
```

---

## 9. Schema de Perfil

### ProfileUpdateBodySchema

```typescript
export const ProfileUpdateBodySchema = z.object({
  name: z.string().trim(),
  email: z.email().trim(),
  group: z.string().trim(),
  currentPassword: z.string().trim().optional(),
  newPassword: z.string().trim().optional(),
  allowPasswordChange: z.coerce.boolean().default(false),
});
```

| Campo | Tipo | Regras |
|-------|------|--------|
| `name` | `string` | Obrigatorio |
| `email` | `string` | Email valido |
| `group` | `string` | ID do grupo |
| `currentPassword` | `string?` | Opcional, senha atual |
| `newPassword` | `string?` | Opcional, nova senha |
| `allowPasswordChange` | `boolean` | Coercao, default false |

### ProfileUpdateParamsSchema

```typescript
export const ProfileUpdateParamsSchema = z.object({
  _id: z.string().trim(),
});
```

---

## 10. Schema de Configuracoes

### SettingUpdateBodySchema

Todos os campos sao opcionais (atualizacao parcial).

```typescript
export const SettingUpdateBodySchema = z.object({
  LOCALE: z.string().optional(),
  FILE_UPLOAD_MAX_SIZE: z.number().optional(),
  FILE_UPLOAD_ACCEPTED: z.array(z.string()).optional(),
  FILE_UPLOAD_MAX_FILES_PER_UPLOAD: z.number().optional(),
  PAGINATION_PER_PAGE: z.number().optional(),
  LOGO_SMALL_URL: z.string().optional(),
  LOGO_LARGE_URL: z.string().optional(),
  MODEL_CLONE_TABLES: z.string().optional(),
  EMAIL_PROVIDER_HOST: z.string().optional(),
  EMAIL_PROVIDER_PORT: z.number().optional(),
  EMAIL_PROVIDER_USER: z.string().optional(),
  EMAIL_PROVIDER_PASSWORD: z.string().optional(),
});
```

---

## 11. Tabela Resumo de Todos os Schemas

| Schema | Grupo | Campos | Descricao |
|--------|-------|--------|-----------|
| `SignInBodySchema` | Auth | `email`, `password` | Login |
| `SignUpBodySchema` | Auth | `name`, `email`, `password` | Cadastro |
| `RequestCodeBodySchema` | Auth | `email` | Solicitar codigo |
| `ValidateCodeBodySchema` | Auth | `code` | Validar codigo |
| `ResetPasswordBodySchema` | Auth | `password` | Redefinir senha |
| `ResetPasswordParamsSchema` | Auth | `_id` | Params da rota |
| `UserBaseSchema` | User | `name`, `email`, `group` | Base de usuario |
| `UserCreateBodySchema` | User | base + `password` | Criacao |
| `UserUpdateBodySchema` | User | base parcial + `password?`, `status?` | Edicao API |
| `UserUpdateFormSchema` | User | base + `password`, `status` | Edicao formulario |
| `UserUpdateParamsSchema` | User | `_id` | Params da rota |
| `UserGroupCreateBodySchema` | Group | `name`, `description`, `permissions` | Criacao de grupo |
| `UserGroupUpdateBodySchema` | Group | `name?`, `description?`, `permissions` | Edicao de grupo |
| `UserGroupUpdateParamsSchema` | Group | `_id` | Params da rota |
| `MenuCreateBodySchema` | Menu | `name`, `type`, `table`, `parent`, `html`, `url` | Criacao de menu |
| `MenuUpdateBodySchema` | Menu | mesmos da criacao | Edicao de menu |
| `MenuUpdateParamsSchema` | Menu | `_id` | Params da rota |
| `TableStyleSchema` | Table | enum | Estilo da tabela |
| `TableVisibilitySchema` | Table | enum | Visibilidade |
| `TableCollaborationSchema` | Table | enum | Colaboracao |
| `TableAdministratorsSchema` | Table | `Array<string>` | IDs de admins |
| `TableFieldOrderListSchema` | Table | `Array<string>` | Ordem na lista |
| `TableFieldOrderFormSchema` | Table | `Array<string>` | Ordem no form |
| `TableCreateBodySchema` | Table | `name`, `owner?`, `logo?`, estilos... | Criacao de tabela |
| `TableUpdateBodySchema` | Table | todos os campos | Edicao de tabela |
| `TableMethodSchema` | Table | `beforeSave`, `afterSave`, `onLoad` | Hooks de codigo |
| `TableUpdateParamsSchema` | Table | `slug` | Params da rota |
| `FieldBaseSchema` | Field | 14 campos de config | Base de campo |
| `FieldCreateBodySchema` | Field | `name`, `type` + base | Criacao de campo |
| `FieldCreateParamsSchema` | Field | `slug` | Params da rota |
| `FieldUpdateBodySchema` | Field | `name`, `type`, `trashed`, `trashedAt` + base | Edicao de campo |
| `FieldUpdateParamsSchema` | Field | `slug`, `_id` | Params da rota |
| `RowDataSchema` | Row | `Record<string, union>` | Dados dinamicos |
| `RowCreateParamsSchema` | Row | `slug` | Params da rota |
| `RowUpdateParamsSchema` | Row | `slug`, `_id` | Params da rota |
| `ProfileUpdateBodySchema` | Profile | `name`, `email`, `group`, senhas... | Edicao de perfil |
| `ProfileUpdateParamsSchema` | Profile | `_id` | Params da rota |
| `SettingUpdateBodySchema` | Settings | 12 campos opcionais | Config do sistema |

---

## 12. Exemplo de Uso com React Hook Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserCreateBodySchema } from '@/lib/schemas';
import type { z } from 'zod';

type FormData = z.infer<typeof UserCreateBodySchema>;

function CreateUserForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(UserCreateBodySchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      group: '',
    },
  });

  const onSubmit = (data: FormData) => {
    // data esta validado conforme o schema
    console.log(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* campos do formulario */}
    </form>
  );
}
```

```typescript
// Validacao manual
import { TableCreateBodySchema } from '@/lib/schemas';

const result = TableCreateBodySchema.safeParse({
  name: 'Minha Tabela',
  style: 'KANBAN',
});

if (result.success) {
  console.log(result.data);
  // { name: 'Minha Tabela', style: 'KANBAN' }
} else {
  console.error(result.error.flatten());
}
```
