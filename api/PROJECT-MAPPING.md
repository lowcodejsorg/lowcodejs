# LowCodeJS API - Mapeamento Completo do Projeto

> Mapeamento técnico detalhado da arquitetura, componentes e fluxos do projeto

**Última atualização**: 2025-09-30

---

## 📊 Estatísticas do Projeto

### Resumo Geral

- **Total de Controllers**: 49 arquivos
- **Total de Use Cases**: 43 arquivos
- **Total de Models**: 9 modelos Mongoose
- **Total de Validators**: 6 arquivos de validação
- **Total de Middlewares**: 2 arquivos
- **Total de Seeders**: 15 arquivos
- **Domínios de Negócio**: 12 domínios principais

### Distribuição de Código

```
app/
├── controllers/     49 arquivos (.controller.ts)
├── use-case/        43 arquivos (.use-case.ts)
├── model/            9 arquivos (.model.ts)
├── validators/       6 arquivos
├── middlewares/      2 arquivos
├── core/             3 arquivos (entity, either, util)
├── exceptions/       1 arquivo
└── services/         1 arquivo
```

---

## 🏛️ Arquitetura Detalhada

### Padrões Arquiteturais Implementados

#### 1. **Clean Architecture**

```
┌─────────────────────────────────────────┐
│         Controllers Layer               │
│  (HTTP Request/Response Handling)       │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Use Case Layer                  │
│  (Business Logic & Orchestration)       │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Model Layer                     │
│  (Data Access & Persistence)            │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Core Layer                      │
│  (Entities, Types, Utils)               │
└─────────────────────────────────────────┘
```

#### 2. **Functional Error Handling - Either Pattern**

```typescript
// Todas as operações retornam Either<Error, Success>
type Response = Either<ApplicationException, Entity>;

// Left = Erro | Right = Sucesso
if (result.isLeft()) {
  // Trata erro
  throw result.value; // ApplicationException
}
// Processa sucesso
return result.value; // Entity
```

#### 3. **Decorator-Based Routing**

```typescript
@Controller()
export default class {
  @GET({
    url: '/path',
    options: {
      schema: {...},
      preHandler: [AuthenticationMiddleware]
    }
  })
  async handle(request, reply) {}
}
```

---

## 🗂️ Mapeamento de Domínios

### 1. Authentication Domain (8 endpoints)

**Responsabilidade**: Gerenciamento de autenticação e recuperação de senha

#### Controllers (8 arquivos)

- `sign-in.controller.ts` - Login com JWT
- `sign-up.controller.ts` - Registro de usuários
- `sign-out.controller.ts` - Logout/invalidação de token
- `magic-link.controller.ts` - Autenticação via link mágico
- `refresh-token.controller.ts` - Renovação de tokens
- `recovery/request-code.controller.ts` - Solicitar código de recuperação
- `recovery/validate-code.controller.ts` - Validar código
- `recovery/update-password.controller.ts` - Atualizar senha

#### Use Cases (7 arquivos)

- `sign-in.use-case.ts` - Validação e geração de JWT
- `sign-up.use-case.ts` - Criação de usuário e envio de email
- `magic-link.use-case.ts` - Validação de código mágico
- `refresh-token.use-case.ts` - Renovação de tokens JWT
- `recovery/request-code.use-case.ts` - Geração e envio de código
- `recovery/validate-code.use-case.ts` - Validação de código de recuperação
- `recovery/update-password.use-case.ts` - Atualização de senha com hash

#### Fluxos de Autenticação

```
┌─────────────┐
│  Sign In    │
└──────┬──────┘
       │
       ├──> Validate credentials (bcrypt)
       ├──> Generate JWT (RS256)
       ├──> Set httpOnly cookie
       └──> Return user data

┌─────────────┐
│  Sign Up    │
└──────┬──────┘
       │
       ├──> Validate input (Zod)
       ├──> Hash password (bcrypt)
       ├──> Create user (inactive status)
       ├──> Generate validation token
       └──> Send email with magic link

┌─────────────┐
│  Recovery   │
└──────┬──────┘
       │
       ├──> Request Code: Generate 6-digit code
       ├──> Validate Code: Check expiration
       └──> Update Password: Hash and save
```

---

### 2. Collections Domain (7 endpoints)

**Responsabilidade**: Gerenciamento de coleções dinâmicas

#### Controllers (7 arquivos)

- `create.controller.ts` - Criar coleção
- `list-paginated.controller.ts` - Listar com paginação
- `get-by-slug.controller.ts` - Buscar por slug
- `update.controller.ts` - Atualizar coleção
- `delete.controller.ts` - Deletar permanentemente
- `send-to-trash.controller.ts` - Soft delete
- `remove-from-trash.controller.ts` - Restaurar da lixeira

#### Use Cases (8 arquivos)

- `create.use-case.ts` - Criação com schema building
- `list-paginated.use-case.ts` - Listagem com filtros
- `get-by-slug.use-case.ts` - Busca individual
- `update.use-case.ts` - Atualização e rebuild schema
- `delete.use-case.ts` - Deleção permanente
- `send-to-trash.use-case.ts` - Soft delete
- `remove-from-trash.use-case.ts` - Restauração

#### Dynamic Schema Building

```typescript
// Processo de criação de coleção
Create Collection
    │
    ├──> Validate fields configuration
    ├──> Build Mongoose schema dynamically
    │    └──> buildSchema(fields)
    ├──> Create MongoDB collection
    ├──> Store schema in _schema property
    └──> Register Mongoose model

// Schema dinâmico resultante
{
  _schema: {
    "field-slug": { type: "String", required: true },
    "another-field": [{ type: "ObjectId", ref: "OtherCollection" }],
    trashed: { type: "Boolean", default: false },
    trashedAt: { type: "Date", default: null }
  }
}
```

---

### 3. Fields Domain (5 endpoints)

**Responsabilidade**: Gerenciamento de campos de coleções

#### Controllers (5 arquivos)

- `create.controller.ts` - Criar campo
- `get-by-id.controller.ts` - Buscar campo
- `update.controller.ts` - Atualizar configuração
- `send-to-trash.controller.ts` - Soft delete campo
- `remove-from-trash.controller.ts` - Restaurar campo

#### Field Type Mapping

```typescript
const FieldTypeMapper = {
  TEXT_SHORT: 'String',
  TEXT_LONG: 'String',
  DROPDOWN: 'String',
  FILE: 'ObjectId' (ref: Storage),
  DATE: 'Date',
  RELATIONSHIP: 'ObjectId' (ref: CollectionSlug),
  FIELD_GROUP: 'ObjectId' (ref: GroupSlug),
  EVALUATION: 'ObjectId' (ref: Evaluation),
  REACTION: 'ObjectId' (ref: Reaction),
  CATEGORY: 'String'
};
```

#### Field Configuration Options

```typescript
interface FieldConfiguration {
  required: boolean; // Campo obrigatório
  multiple: boolean; // Múltiplos valores
  format: FIELD_FORMAT; // Formato específico
  listing: boolean; // Exibir em listagem
  filtering: boolean; // Permitir filtro
  defaultValue: string; // Valor padrão
  relationship: {
    // Configuração de relacionamento
    collection: { _id; slug };
    field: { _id; slug };
    order: 'asc' | 'desc';
  };
  dropdown: string[]; // Opções de dropdown
  category: Category[]; // Categorias hierárquicas
  group: { _id; slug }; // Grupo de campos
}
```

---

### 4. Rows Domain - **NÚCLEO DO SISTEMA** (9 endpoints)

**Responsabilidade**: Gerenciamento de dados dinâmicos das coleções

#### Controllers (9 arquivos)

- `create.controller.ts` - Criar registro
- `list-paginated.controller.ts` - Listar com filtros avançados
- `get-by-id.controller.ts` - Buscar com population
- `update.controller.ts` - Atualizar registro
- `delete.controller.ts` - Deletar permanentemente
- `send-to-trash.controller.ts` - Soft delete
- `remove-from-trash.controller.ts` - Restaurar
- `reaction.controller.ts` - Adicionar/remover reações
- `evaluation.controller.ts` - Adicionar avaliações

#### Use Cases (9 arquivos)

- `create.use-case.ts` - Validação dinâmica + criação
- `list-paginated.use-case.ts` - Query building + population
- `get-by-id.use-case.ts` - Population estratégica
- `update.use-case.ts` - Validação + atualização
- `delete.use-case.ts` - Deleção com cleanup
- `send-to-trash.use-case.ts` - Soft delete
- `remove-from-trash.use-case.ts` - Restauração
- `reaction.use-case.ts` - Gerenciamento de reações
- `evaluation.use-case.ts` - Gerenciamento de avaliações

#### Advanced Query Building System

```typescript
// Query Builder Features
buildQuery(searchParams, fields) {
  // 1. Field-specific filtering
  "text-field": { $regex: normalize("search"), $options: "i" }

  // 2. Date range filtering
  "date-field-initial": "2024-01-01"
  "date-field-final": "2024-12-31"
  → { "date-field": { $gte: Date, $lte: Date } }

  // 3. Relationship filtering
  "relationship-field": "id1,id2,id3"
  → { "relationship-field": { $in: ["id1", "id2", "id3"] } }

  // 4. Full-text search with normalization
  search: "josé"
  → $or: [
      { field1: { $regex: "[jJ][oOóÓ][sS][eEéÉ]", $options: "i" } },
      { field2: { $regex: "[jJ][oOóÓ][sS][eEéÉ]", $options: "i" } }
    ]

  // 5. Trash filtering
  trashed: "false" → { trashed: false }

  // 6. Field ordering
  "order-field": "asc" → { field: 1 }
}
```

#### Population Strategy (Recursive)

```typescript
// buildPopulate() - Intelligent relationship loading
await buildPopulate(fields)
  │
  ├──> FILE fields
  │    └──> { path: "file-slug" } (ref: Storage)
  │
  ├──> REACTION fields
  │    └──> {
  │          path: "reaction-slug",
  │          populate: { path: "user", select: "name email _id" }
  │        }
  │
  ├──> EVALUATION fields
  │    └──> {
  │          path: "eval-slug",
  │          populate: { path: "user", select: "name email _id" }
  │        }
  │
  ├──> RELATIONSHIP fields (recursive)
  │    └──> Build related collection model
  │         Get related fields
  │         Recursively populate nested relationships
  │
  └──> FIELD_GROUP fields (recursive)
       └──> Build group collection model
            Get group fields
            Recursively populate group relationships
```

#### Social Features System

```typescript
// Reactions (Like/Unlike)
PATCH /collections/:slug/rows/:_id/reaction
{
  type: 'like' | 'unlike',
  field: 'field-slug',
  user: 'user-id'
}
→ Creates/removes Reaction document
→ Adds/removes reference to row field array

// Evaluations (Ratings)
PATCH /collections/:slug/rows/:_id/evaluation
{
  value: number,  // e.g., 1-5 stars
  field: 'field-slug',
  user: 'user-id'
}
→ Creates Evaluation document
→ Adds reference to row field array
→ Allows multiple ratings per user (tracking history)
```

---

### 5. Users Domain (4 endpoints)

**Responsabilidade**: Gerenciamento de usuários do sistema

#### Controllers (4 arquivos)

- `create.controller.ts` - Criar usuário (admin)
- `list-paginated.controller.ts` - Listar usuários
- `get-by-id.controller.ts` - Buscar usuário
- `update.controller.ts` - Atualizar usuário

#### User Lifecycle

```
Create User (Admin)
    │
    ├──> Validate input
    ├──> Hash password
    ├──> Assign to UserGroup
    ├──> Set status (active/inactive)
    └──> Return user data

Update User
    │
    ├──> Check permissions
    ├──> Update fields (name, email, group, status)
    ├──> Hash new password if provided
    └──> Return updated user
```

---

### 6. User Groups Domain (5 endpoints)

**Responsabilidade**: Gerenciamento de grupos e permissões

#### Controllers (5 arquivos)

- `create.controller.ts` - Criar grupo
- `list.controller.ts` - Listar todos
- `list-paginated.controller.ts` - Listar paginado
- `get-by-id.controller.ts` - Buscar grupo
- `update.controller.ts` - Atualizar grupo

#### Permission System

```typescript
interface UserGroup {
  name: string;
  slug: string;
  description: string;
  permissions: Permission[] | string[];
}

// Permissions are checked in ResourceMiddleware
ResourceMiddleware('collections:read')
  │
  ├──> Get user from JWT
  ├──> Check if user.permissions includes 'collections:read'
  ├──> Allow/Deny access
  └──> Return 500 if unauthorized
```

---

### 7. Storage Domain (2 endpoints)

**Responsabilidade**: Upload e gerenciamento de arquivos

#### Controllers (2 arquivos)

- `upload.controller.ts` - Upload de arquivo (multipart)
- `delete.controller.ts` - Deletar arquivo

#### File Upload Flow

```
POST /storage (multipart/form-data)
    │
    ├──> Receive file via @fastify/multipart
    ├──> Generate unique filename
    ├──> Save to _storage/ directory
    ├──> Create Storage document
    │    └──> { url, filename, type }
    └──> Return Storage._id

// File access
GET /storage/:filename
    → Served via @fastify/static
    → Path: _storage/:filename
```

---

### 8. Profile Domain (2 endpoints)

**Responsabilidade**: Gerenciamento de perfil do usuário logado

#### Controllers (2 arquivos)

- `get.controller.ts` - Obter perfil atual
- `update.controller.ts` - Atualizar perfil

#### Profile Update Flow

```
PUT /profile
    │
    ├──> Get user from JWT (request.user.sub)
    ├──> Validate current password if changing password
    ├──> Update allowed fields (name, email)
    ├──> Hash new password if provided
    └──> Return updated profile
```

---

### 9. Settings Domain (2 endpoints)

**Responsabilidade**: Configurações do sistema

#### Controllers (2 arquivos)

- `get.controller.ts` - Obter configurações
- `update.controller.ts` - Atualizar configurações

---

### 10. Permissions Domain (1 endpoint)

**Responsabilidade**: Listagem de permissões disponíveis

#### Controllers (1 arquivo)

- `list.controller.ts` - Listar todas as permissões

---

### 11. Locales Domain (2 endpoints)

**Responsabilidade**: Internacionalização

#### Controllers (2 arquivos)

- `list.controller.ts` - Listar idiomas disponíveis
- `get-by-locale.controller.ts` - Obter traduções por idioma

#### i18n System

```
GET /locales → ['pt-br', 'en-us']
GET /locales/pt-br → Properties file content

Files:
_system/locales/pt-br.properties
_system/locales/en-us.properties
```

---

### 12. System Endpoints (3 endpoints)

**Responsabilidade**: Saúde e documentação da API

#### Controllers (3 arquivos)

- `welcome.controller.ts` - Redireciona para /documentation
- `health-check.controller.ts` - Status da aplicação
- `openapi.json` (kernel.ts) - OpenAPI specification

---

## 🗄️ Database Models (Mongoose)

### Model Files & Schema Details

#### 1. **User Model** (`user.model.ts`)

```typescript
{
  name: String (required),
  email: String (required, unique),
  password: String (required),
  status: Enum['active', 'inactive'] (default: 'inactive'),
  group: ObjectId (ref: 'UserGroup'),
  trashed: Boolean (default: false),
  trashedAt: Date,
  timestamps: true
}
```

#### 2. **UserGroup Model** (`user-group.model.ts`)

```typescript
{
  name: String (required),
  slug: String (required, unique),
  description: String,
  permissions: [ObjectId] (ref: 'Permission'),
  trashed: Boolean,
  trashedAt: Date,
  timestamps: true
}
```

#### 3. **Permission Model** (`permission.model.ts`)

```typescript
{
  name: String (required),
  slug: String (required, unique),
  description: String,
  trashed: Boolean,
  trashedAt: Date,
  timestamps: true
}
```

#### 4. **Collection Model** (`collection.model.ts`)

```typescript
{
  _schema: Mixed (dynamic schema object),
  name: String (required),
  description: String,
  logo: ObjectId (ref: 'Storage'),
  slug: String (required, unique),
  fields: [ObjectId] (ref: 'Field'),
  type: Enum['collection', 'field-group'],
  configuration: {
    style: Enum['gallery', 'list'],
    visibility: Enum['public', 'restricted'],
    collaboration: Enum['open', 'restricted'],
    administrators: [ObjectId] (ref: 'User'),
    owner: ObjectId (ref: 'User', required),
    fields: {
      orderList: [String],
      orderForm: [String]
    }
  },
  trashed: Boolean,
  trashedAt: Date,
  timestamps: true
}
```

#### 5. **Field Model** (`field.model.ts`)

```typescript
{
  name: String (required),
  slug: String (required),
  type: Enum[FIELD_TYPE] (required),
  configuration: {
    required: Boolean,
    multiple: Boolean,
    format: Enum[FIELD_FORMAT],
    listing: Boolean,
    filtering: Boolean,
    defaultValue: String,
    relationship: {
      collection: { _id: ObjectId, slug: String },
      field: { _id: ObjectId, slug: String },
      order: Enum['asc', 'desc']
    },
    dropdown: [String],
    category: [Mixed],
    group: { _id: ObjectId, slug: String }
  },
  trashed: Boolean,
  trashedAt: Date,
  timestamps: true
}
```

#### 6. **Storage Model** (`storage.model.ts`)

```typescript
{
  url: String (required),
  filename: String (required),
  type: String (required),
  trashed: Boolean,
  trashedAt: Date,
  timestamps: true
}
```

#### 7. **ValidationToken Model** (`validation-token.model.ts`)

```typescript
{
  user: ObjectId (ref: 'User', required),
  code: String (required),
  status: Enum['REQUESTED', 'EXPIRED', 'VALIDATED'],
  trashed: Boolean,
  trashedAt: Date,
  timestamps: true
}
```

#### 8. **Reaction Model** (`reaction.model.ts`)

```typescript
{
  user: ObjectId (ref: 'User', required),
  type: Enum['like', 'unlike'] (required),
  trashed: Boolean,
  trashedAt: Date,
  timestamps: true
}
```

#### 9. **Evaluation Model** (`evaluation.model.ts`)

```typescript
{
  user: ObjectId (ref: 'User', required),
  value: Number (required),
  trashed: Boolean,
  trashedAt: Date,
  timestamps: true
}
```

#### Dynamic Row Models (Runtime)

```typescript
// Created dynamically via buildCollection()
Model['collection-slug'] = mongoose.model({
  ...collection._schema, // Dynamic fields
  _id: ObjectId,
  createdAt: Date,
  updatedAt: Date,
  trashed: Boolean,
  trashedAt: Date,
});
```

---

## 🔐 Security & Validation

### Middleware Stack

#### 1. **AuthenticationMiddleware** (`authentication.middleware.ts`)

```typescript
Purpose: Verificar JWT e extrair dados do usuário
Flow:
  │
  ├──> Verify JWT cookie using @fastify/jwt
  ├──> Decode JWT payload (RS256)
  ├──> Set request.user with:
  │    └──> { sub, email, name, group, permissions }
  └──> Return 401 if invalid
```

#### 2. **ResourceMiddleware** (`resource.middleware.ts`)

```typescript
Purpose: Verificar permissões específicas de recurso
Factory Pattern: ResourceMiddleware('resource:action')

Flow:
  │
  ├──> Check if request has ?public=true
  ├──> If public, allow access
  ├──> If not public:
  │    ├──> Get user from request.user
  │    ├──> Check if user.permissions includes resource
  │    └──> Return 500 if unauthorized
  └──> Continue to handler
```

### Validation System (Zod)

#### Validation Files

1. **authentication.validator.ts** - Auth schemas
2. **collections.validator.ts** - Collection schemas
3. **field-collection.validator.ts** - Field schemas
4. **row-collection.validator.ts** - Dynamic row schemas
5. **user-group.validator.ts** - User group schemas
6. **users.ts** - User schemas

#### Dynamic Validation Example

```typescript
// Row validation adapts to collection fields
const CreateRowCollectionSchema = z.record(
  z.string(),
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(z.string()),
    z.array(z.number()),
    z.array(z.object({ _id: z.string().optional() }).loose()),
    z.object({}).loose(),
  ]),
);
```

---

## 🚀 Bootstrapping & Initialization

### Server Startup Sequence

#### 1. **bin/server.ts** - Entry Point

```typescript
1. Load environment variables (start/env.ts)
2. Connect to MongoDB (config/database.config.ts)
3. Initialize Fastify kernel (start/kernel.ts)
4. Register plugins
5. Bootstrap controllers
6. Start HTTP server on configured port
```

#### 2. **start/kernel.ts** - Fastify Configuration

```typescript
Plugin Registration Order:
1. CORS (@fastify/cors)
   └──> Allowed origins, methods, headers
2. Cookie (@fastify/cookie)
   └──> Signed cookies support
3. JWT (@fastify/jwt)
   └──> RS256 algorithm, cookie-based
4. Multipart (@fastify/multipart)
   └──> File upload support
5. Static (@fastify/static)
   └──> /storage/ and /system/ routes
6. Swagger (@fastify/swagger)
   └──> OpenAPI schema generation
7. Scalar (@scalar/fastify-api-reference)
   └──> Interactive API documentation
8. Decorators (fastify-decorators)
   └──> Auto-discover controllers
```

#### 3. **start/env.ts** - Environment Validation

```typescript
Validated Variables (Zod):
- NODE_ENV: development | test | production
- PORT: number (default: 3000)
- DATABASE_URL: string
- JWT_PUBLIC_KEY: string (base64)
- JWT_PRIVATE_KEY: string (base64)
- COOKIE_SECRET: string
- EMAIL_PROVIDER_*: SMTP config
- APP_SERVER_URL: string
- APP_CLIENT_URL: string
```

---

## 📦 Database Seeders

### Seeder Files (15 total)

#### Core Data Seeds

1. **1720448435-permissions.seed.ts** - Sistema de permissões
2. **1720448445-user-group.seed.ts** - Grupos de usuários
3. **1720465892-users.seed.ts** - Usuários do sistema
4. **1720467123-collection-reset.seed.ts** - Reset de coleções

#### Performance Test Seeds

5. **1720468945-collection-professor-100K.seed.ts** - 100k professores
6. **1720470267-collection-professor-1M.seed.ts** - 1M professores
7. **1720471589-collection-professor-10M.seed.ts** - 10M professores
8. **1720472834-collection-student-100K.seed.ts** - 100k estudantes
9. **1720474156-collection-student-1M.seed.ts** - 1M estudantes
10. **1720475478-collection-student-10M.seed.ts** - 10M estudantes
11. **1720475538-collection-class-100K.seed.ts** - 100k turmas
12. **1720475598-collection-class-1M.seed.ts** - 1M turmas
13. **1720475658-collection-class-10M.seed.ts** - 10M turmas
14. **1720475718-collection-populate-professor-100K.seed.ts**
15. **1720475778-collection-populate-professor-1M.seed.ts**

---

## 🐳 Docker & Deployment

### Docker Files

- **Dockerfile.demo** - Demo environment
- **Dockerfile.develop** - Development environment
- **docker-compose.demo.yml** - Demo stack
- **docker-compose.develop.yml** - Development stack
- **docker-compose.mongo.local.yml** - Local MongoDB
- **docker-compose.mongo.demo.yml** - Demo MongoDB
- **docker-compose.mongo.develop.yml** - Development MongoDB

### Traefik Integration (Demo/Develop)

```yaml
labels:
  - traefik.enable=true
  - traefik.http.routers.api.rule=Host(`api.demo.lowcodejs.org`)
  - traefik.http.services.api.loadbalancer.sticky=true
  - traefik.http.services.api.loadbalancer.sticky.cookie.name=sticky
```

---

## 🔄 Data Flow Examples

### Complete Request Flow - Create Row

```
1. HTTP Request
   POST /collections/users/rows
   Body: { name: "John", email: "john@example.com" }
   Cookie: accessToken=jwt_token

2. Fastify Kernel
   ├──> CORS check
   ├──> Cookie parsing
   └──> Route to controller

3. Controller Layer
   ├──> AuthenticationMiddleware
   │    └──> Verify JWT, extract user
   ├──> ResourceMiddleware('collections:write')
   │    └──> Check permissions
   ├──> Zod validation (dynamic schema)
   └──> Call CreateRowUseCase

4. Use Case Layer
   ├──> Get collection by slug
   ├──> Build dynamic Mongoose model
   ├──> Validate field configurations
   ├──> Create row in MongoDB
   └──> Return Either<Exception, Row>

5. Controller Response
   ├──> Check if result.isLeft()
   ├──> If error: return HTTP error
   └──> If success: return row data

6. HTTP Response
   Status: 201 Created
   Body: { _id, name, email, createdAt, ... }
```

### Complete Query Flow - List Rows with Filters

```
1. HTTP Request
   GET /collections/users/rows/paginated?
       page=1&
       perPage=20&
       search=john&
       status=active&
       created-initial=2024-01-01&
       created-final=2024-12-31&
       order-name=asc

2. Query Building (buildQuery)
   ├──> Text search: normalize("john") → "[jJ][oO][hH][nN]"
   ├──> Field filter: { status: "active" }
   ├──> Date range: {
   │    created: {
   │      $gte: Date(2024-01-01 00:00:00),
   │      $lte: Date(2024-12-31 23:59:59)
   │    }
   │   }
   └──> Order: { name: 1 }

3. Population Building (buildPopulate)
   ├──> Get collection fields
   ├──> Find RELATIONSHIP, FILE, REACTION, EVALUATION fields
   ├──> Build recursive population strategy
   └──> Return populate array

4. MongoDB Query
   Model.find(query)
     .populate(populate)
     .sort(order)
     .skip((page - 1) * perPage)
     .limit(perPage)

5. Response
   {
     data: [... rows with populated relationships ...],
     meta: {
       total: 1000,
       page: 1,
       perPage: 20,
       lastPage: 50,
       firstPage: 1
     }
   }
```

---

## 🧩 Utility Functions (Core)

### buildSchema(fields: Field[]): CollectionSchema

```typescript
Purpose: Converter array de Fields em Mongoose schema
Input: Array de Field entities
Output: CollectionSchema object
Logic:
  │
  ├──> Iterate over fields
  ├──> Map FIELD_TYPE to Mongoose type
  ├──> Apply configuration (required, multiple, etc)
  ├──> Handle special types (RELATIONSHIP, FILE, etc)
  └──> Return complete schema object
```

### buildCollection(collection): Promise<Model>

```typescript
Purpose: Criar modelo Mongoose dinâmico em runtime
Input: Collection entity
Output: Mongoose Model
Logic:
  │
  ├──> Delete existing model if exists
  ├──> Create new mongoose.Schema from collection._schema
  ├──> Register model with collection.slug as name
  ├──> Call model.createCollection()
  └──> Return Model instance
```

### buildPopulate(fields): Promise<PopulateArray>

```typescript
Purpose: Gerar estratégia de population recursiva
Input: Array de Fields
Output: Array de objetos { path, populate }
Logic:
  │
  ├──> Filter relationship fields
  ├──> For each relationship:
  │    ├──> Simple refs (FILE) → { path }
  │    ├──> Social (REACTION, EVALUATION) → { path, populate: user }
  │    ├──> RELATIONSHIP → Recursive:
  │    │    ├──> Build related collection model
  │    │    ├──> Get related fields
  │    │    └──> Recursively buildPopulate()
  │    └──> FIELD_GROUP → Recursive:
  │         ├──> Build group collection model
  │         ├──> Get group fields
  │         └──> Recursively buildPopulate()
  └──> Return complete population array
```

### buildQuery(params, fields): MongoQuery

```typescript
Purpose: Construir query MongoDB de parâmetros HTTP
Input: Query params object, Fields array
Output: MongoDB query object
Features:
  ├──> Text normalization with accents
  ├──> Date range queries
  ├──> Field-specific filtering
  ├──> Full-text search across text fields
  ├──> Trash filtering
  └──> Complex $or queries
```

### buildOrder(params, fields): SortObject

```typescript
Purpose: Construir ordenação MongoDB
Input: Query params, Fields array
Output: { [field]: 1 | -1 }
Logic:
  │
  ├──> Look for "order-{field}" params
  ├──> Map to MongoDB sort format
  │    └──> 'asc' → 1, 'desc' → -1
  └──> Return sort object
```

### normalize(search: string): string

```typescript
Purpose: Normalizar texto para busca com acentos
Input: "josé"
Output: "[jJ][oOóÓòÒôÔõÕöÖ][sS][eEéÉèÈêÊëË]"
Supports:
  ├──> Portuguese: á, é, í, ó, ú, ã, õ, ç
  ├──> Spanish: ñ
  └──> French: accents
```

---

## 📊 Performance Considerations

### Database Indexes

```typescript
// Recommended indexes for collections
Collection.index({ slug: 1 }, { unique: true });
Field.index({ slug: 1 });
User.index({ email: 1 }, { unique: true });
UserGroup.index({ slug: 1 }, { unique: true });
Permission.index({ slug: 1 }, { unique: true });

// Dynamic row collections
DynamicModel.index({ trashed: 1 });
DynamicModel.index({ createdAt: -1 });
// + field-specific indexes based on filtering config
```

### Population Optimization

```typescript
// Avoid circular references in buildPopulate()
// Limit population depth
// Use select to limit fields
// Consider lean() for read-only operations
```

### Query Optimization

```typescript
// Use projection to limit returned fields
// Apply pagination limits
// Use indexes for filtering fields
// Consider aggregation for complex queries
```

---

## 🔍 Common Patterns & Best Practices

### 1. Error Handling Pattern

```typescript
// All use cases follow Either pattern
try {
  const entity = await SomeModel.findOne();
  if (!entity) {
    return left(ApplicationException.NotFound('Entity not found'));
  }
  return right(entity);
} catch (error) {
  return left(ApplicationException.InternalServerError());
}
```

### 2. Controller Pattern

```typescript
@Controller()
export default class {
  @POST({
    url: '/path',
    options: {
      schema: { body: ValidationSchema },
      preHandler: [AuthenticationMiddleware],
    },
  })
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const result = await useCase.execute(request.body);

    if (result.isLeft()) {
      throw result.value; // ApplicationException
    }

    return reply.status(201).send(result.value);
  }
}
```

### 3. Dynamic Schema Building Pattern

```typescript
// On collection create/update
const schema = buildSchema(collection.fields);
collection._schema = schema;
await collection.save();

// On row operation
const Model = await buildCollection(collection);
const row = new Model(data);
await row.save();
```

### 4. Population Pattern

```typescript
// Get fields with relationships
const populate = await buildPopulate(collection.fields);

// Query with population
const rows = await Model.find(query).populate(populate).exec();
```

---

## 📚 Additional Resources

### Configuration Files

- **tsconfig.json** - TypeScript configuration with path aliases
- **package.json** - Dependencies and scripts
- **.env.example** - Environment variables template
- **eslint.config.js** - ESLint rules
- **CLAUDE.md** - Comprehensive AI context document
- **API-ENDPOINTS.md** - Complete API reference
- **README.md** - Project documentation

### System Files

- **\_system/locales/** - i18n property files
- **\_storage/** - Uploaded files directory
- **database-data/** - MongoDB data directory (if using local Docker)

---

## 🎯 Key Insights for Development

### When Adding New Features

1. **New Domain?**
   - Create controller directory in `app/controllers/`
   - Create use-case directory in `app/use-case/`
   - Add validator in `app/validators/`
   - Consider if new Model is needed

2. **New Field Type?**
   - Add to `FIELD_TYPE` enum in `core/entity.core.ts`
   - Add mapping in `FieldTypeMapper` in `core/util.core.ts`
   - Update `mapperSchema()` function
   - Update `buildPopulate()` if relationship type

3. **New Permission?**
   - Add to `database/seeders/permissions.seed.ts`
   - Use `ResourceMiddleware('resource:action')` in controller

4. **New Validation?**
   - Create Zod schema in appropriate validator file
   - Add to Fastify route schema
   - Consider dynamic validation for row operations

### Testing Strategy

- Use seeders for test data generation
- Test with different data volumes (100K, 1M, 10M seeds available)
- Verify population depth doesn't cause performance issues
- Check authorization in all protected endpoints

---

**Fim do mapeamento - LowCodeJS API v1.0.0**
