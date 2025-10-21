# Claude Code Context - LowCodeJS API

> Contexto técnico do projeto para assistência de IA

## 📖 Documentação Adicional

Para informações detalhadas sobre arquitetura, fluxos de dados e mapeamento
completo do projeto, consulte:

- **[PROJECT-MAPPING.md](PROJECT-MAPPING.md)** - Mapeamento completo do projeto,
  fluxos detalhados e best practices
- **[API-ENDPOINTS.md](API-ENDPOINTS.md)** - Referência resumida de todos os
  endpoints da API
- **[API-ROUTES-DETAILED.md](API-ROUTES-DETAILED.md)** - ⭐ **Mapeamento detalhado**
  com payloads, responses e HTTP codes
- **[README.md](README.md)** - Documentação do projeto, instalação e uso

## Arquitetura & Stack

### Core Technologies

- **Framework**: Fastify v5.6.0 + TypeScript
- **Database**: MongoDB + Mongoose ODM
- **Authentication**: JWT (RS256) + httpOnly cookies
- **Validation**: Zod schemas
- **Documentation**: Swagger/OpenAPI + Scalar UI
- **File Upload**: Multipart support
- **Architecture**: Clean Architecture + Decorators

### Key Dependencies

```json
{
  "fastify": "^5.6.0",
  "fastify-decorators": "^3.16.1",
  "mongoose": "^8.18.1",
  "@fastify/jwt": "^10.0.0",
  "@fastify/cookie": "^11.0.2",
  "zod": "^4.1.5",
  "bcryptjs": "^3.0.2"
}
```

## Project Structure

```
├── app/                          # Application code
│   ├── controllers/              # HTTP Controllers (organized by domain)
│   │   ├── authentication/       # Login, register, recovery
│   │   ├── collections/          # Dynamic collections management
│   │   ├── fields/              # Collection field definitions
│   │   ├── rows/                # Collection data/records
│   │   ├── users/               # User management
│   │   ├── user-group/          # User groups & permissions
│   │   ├── storage/             # File upload/management
│   │   ├── profile/             # User profile
│   │   ├── permissions/         # Permission system
│   │   ├── setting/             # System settings
│   │   └── locales/             # i18n support
│   ├── core/                    # Core types & entities
│   ├── model/                   # Mongoose models
│   ├── use-case/                # Business logic/use cases
│   ├── services/                # Application services
│   ├── validators/              # Zod validation schemas
│   ├── middlewares/             # Custom middlewares
│   └── exceptions/              # Custom exceptions
├── bin/server.ts                # Application entry point
├── config/                      # Configuration files
│   ├── app.config.ts           # App settings
│   ├── database.config.ts      # MongoDB connection
│   └── email.config.ts         # Email provider
├── start/                       # Bootstrap & initialization
│   ├── kernel.ts               # Fastify instance & plugins
│   └── env.ts                  # Environment variables
├── database/                    # Database seeders
├── _storage/                    # File storage directory
└── _system/                     # System files (locales, etc.)
```

## TypeScript Path Aliases

```json
{
  "@controllers/*": ["./app/controllers/*"],
  "@core/*": ["app/core/*"],
  "@model/*": ["./app/model/*"],
  "@use-case/*": ["./app/use-case/*"],
  "@services/*": ["./app/services/*"],
  "@validators/*": ["./app/validators/*"],
  "@middlewares/*": ["./app/middlewares/*"],
  "@exceptions/*": ["./app/exceptions/*"],
  "@config/*": ["./config/*"],
  "@start/*": ["./start/*"],
  "@database/*": ["./database/*"]
}
```

## Domain Models

### Core Entities

#### User

```typescript
interface User {
  _id: ObjectId;
  name: string;
  email: string;
  password: string;
  status: 'active' | 'inactive';
  group: ObjectId; // ref to UserGroup
  trashed: boolean;
  trashedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Collection (Dynamic Collections)

```typescript
interface Collection {
  _id: ObjectId;
  _schema: CollectionSchema;
  name: string;
  description: string;
  logo: string;
  slug: string;
  fields: Field[];
  type: 'collection' | 'field-group';
  configuration: {
    style: 'gallery' | 'list';
    visibility: 'public' | 'restricted';
    collaboration: 'open' | 'restricted';
    administrators: ObjectId[];
    owner: ObjectId;
    fields: {
      orderList: string[];
      orderForm: string[];
    };
  };
  trashed: boolean;
  trashedAt: Date;
}
```

#### Field (Configurable Fields)

```typescript
interface Field {
  _id: ObjectId;
  name: string;
  slug: string;
  type: FIELD_TYPE;
  configuration: {
    required: boolean;
    multiple: boolean;
    format: FIELD_FORMAT;
    listing: boolean;
    filtering: boolean;
    defaultValue: string;
    relationship: FieldConfigurationRelationship;
    dropdown: string[];
    category: Category[];
    group: FieldConfigurationGroup;
  };
  trashed: boolean;
  trashedAt: Date;
}
```

### Field Types Supported

- `TEXT_SHORT`: Short text (alphanumeric, integer, decimal, URL, email)
- `TEXT_LONG`: Long text/textarea
- `DROPDOWN`: Select options
- `DATE`: Date with multiple formats
- `RELATIONSHIP`: Inter-collection relationships
- `FILE`: File upload
- `FIELD_GROUP`: Grouped fields
- `REACTION`: Like/reaction system
- `EVALUATION`: Rating system
- `CATEGORY`: Hierarchical categorization

## API Patterns

### Controller Structure

```typescript
@Controller()
export default class {
  @GET({ url: '/path', options: { schema: {...} } })
  async handle(request: FastifyRequest, reply: FastifyReply) {
    // Implementation
  }
}
```

### Common HTTP Methods Used

- `@GET` - Retrieve data
- `@POST` - Create resources
- `@PUT` - Update resources
- `@DELETE` - Delete resources

### Authentication Flow

1. JWT tokens signed with RS256 algorithm
2. Stored in httpOnly cookies (`accessToken`)
3. Public/private key pair for signing/verification
4. Cookie-based auth with CORS support

## Key Features

### 1. Dynamic Collections System

- Create collections with configurable fields
- Multiple field types and formats
- Relationships between collections
- Dynamic validation based on field configuration

### 2. Soft Delete (Trash System)

- All entities support `trashed` boolean flag
- `trashedAt` timestamp for deletion tracking
- Restore functionality available

### 3. Permission System

- User groups with granular permissions
- Collection-level administrators
- Owner-based access control

### 4. File Management

- Upload via multipart forms
- Files stored in `_storage/` directory
- Access control integration
- Metadata tracking

### 5. Internationalization

- Multi-language support (pt-BR, en-US)
- Locale files in `_system/locales/`
- Dynamic language switching

## Environment Configuration

### Required Environment Variables

```env
# Server
NODE_ENV=production|development
PORT=3000

# Database
DATABASE_URL=mongodb://user:pass@host:port/db

# JWT Authentication
JWT_PRIVATE_KEY=base64_encoded_private_key
JWT_PUBLIC_KEY=base64_encoded_public_key
COOKIE_SECRET=your_cookie_secret

# Email (optional)
EMAIL_PROVIDER_HOST=smtp.example.com
EMAIL_PROVIDER_PORT=587
EMAIL_PROVIDER_USER=user@example.com
EMAIL_PROVIDER_PASSWORD=password

# URLs
APP_SERVER_URL=http://localhost:3000
APP_CLIENT_URL=http://localhost:5173
```

## Development Commands

```bash
# Development
npm run dev              # Start with tsx watch
npm run build            # TypeScript compilation + tsup
npm start               # Production server
npm run seed            # Run database seeders

# Code Quality
npm run lint            # ESLint
npm run format          # Prettier
```

## Docker Configuration

### Local MongoDB

```yaml
# docker-compose.mongo.local.yml
services:
  local-mongo:
    image: mongo:latest
    container_name: local-mongo
    environment:
      MONGODB_ROOT_USER: local
      MONGODB_ROOT_PASSWORD: local
    volumes:
      - ./database-data:/data/db
```

### Demo Environment

- Uses Traefik for reverse proxy
- SSL/TLS termination
- Health checks configured
- Sticky sessions enabled

## API Documentation

- **Development**: http://localhost:3000/documentation
- **OpenAPI JSON**: http://localhost:3000/openapi.json
- **UI**: Scalar interface with interactive docs

## Security Features

- **Password Hashing**: bcryptjs
- **CORS**: Configured for specific origins
- **Cookie Security**: httpOnly, signed cookies
- **Input Validation**: Zod schemas for all endpoints
- **JWT**: RS256 algorithm with key pairs
- **Rate Limiting**: Built-in protection

## Business Logic Organization

### Use Cases (app/use-case/)

- Authentication flows
- Collection management
- User management
- File operations
- Permission handling

### Services (app/services/)

- Email service
- File service
- Authentication service
- Utility services

## Complete API Endpoint Reference

**Total: 49 endpoints across 12 domains**

### Authentication Domain (8 endpoints)

```
POST   /authentication/sign-in                    # User login
POST   /authentication/sign-up                    # User registration
POST   /authentication/sign-out                   # Sign out (auth required)
POST   /authentication/refresh-token              # Refresh tokens (auth required)
GET    /authentication/magic-link?code=          # Magic link auth
POST   /authentication/recovery/request-code     # Request password recovery
POST   /authentication/recovery/validate-code    # Validate recovery code
PUT    /authentication/recovery/update-password  # Update password
```

### Collections Management (7 endpoints)

```
POST   /collections                    # Create collection (auth required)
GET    /collections/paginated         # List paginated collections (auth required)
GET    /collections/:slug             # Get collection by slug (auth required)
PUT    /collections/:slug             # Update collection (auth required)
DELETE /collections/:slug             # Delete collection (auth required)
PATCH  /collections/:slug/trash       # Send to trash (auth required)
PATCH  /collections/:slug/restore     # Restore from trash (auth required)
```

### Fields Management (5 endpoints)

```
POST   /collections/:slug/fields                # Create field (auth required)
GET    /collections/:slug/fields/:_id          # Get field by ID (auth required)
PUT    /collections/:slug/fields/:_id          # Update field (auth required)
PATCH  /collections/:slug/fields/:_id/trash    # Send field to trash (auth required)
PATCH  /collections/:slug/fields/:_id/restore  # Restore field (auth required)
```

### Rows Management (9 endpoints) - **CORE DATA LAYER**

```
POST   /collections/:slug/rows                      # Create row with dynamic validation
GET    /collections/:slug/rows/paginated           # List rows with complex filtering/search
GET    /collections/:slug/rows/:_id                # Get row with populated relationships
PUT    /collections/:slug/rows/:_id                # Update row with field-specific validation
DELETE /collections/:slug/rows/:_id                # Permanently delete row
PATCH  /collections/:slug/rows/:_id/trash          # Soft delete (move to trash)
PATCH  /collections/:slug/rows/:_id/restore        # Restore from trash
PATCH  /collections/:slug/rows/:_id/reaction       # Social: Add like/unlike reaction
PATCH  /collections/:slug/rows/:_id/evaluation     # Social: Add numeric rating
```

**Advanced Row Features:**

- **Dynamic Schema Validation**: Adapts to collection field configurations
- **Complex Relationships**: Handles nested data and cross-collection references
- **Social Features**: Reactions (like/unlike) and evaluations (ratings) with
  user context
- **Advanced Search**: Full-text search, field-specific filtering, date ranges
- **Soft Delete System**: Trash/restore with timestamp tracking
- **Population Strategies**: Intelligent loading of related data and social
  features

### Users Management (4 endpoints)

```
POST  /users              # Create user (auth required)
GET   /users/paginated   # List paginated users (auth required)
GET   /users/:_id        # Get user by ID (auth required)
PATCH /users/:_id        # Update user (auth required)
```

### User Groups Management (5 endpoints)

```
POST  /user-group              # Create user group (auth required)
GET   /user-group             # List user groups (auth required)
GET   /user-group/paginated   # List paginated user groups (auth required)
GET   /user-group/:_id        # Get user group by ID (auth required)
PATCH /user-group/:_id        # Update user group (auth required)
```

### Storage Management (2 endpoints)

```
POST   /storage         # Upload file (auth required)
DELETE /storage/:_id    # Delete file (auth required)
# Static routes: /storage/* and /system/*
```

### Profile Management (2 endpoints)

```
GET /profile    # Get current user profile (auth required)
PUT /profile    # Update current user profile (auth required)
```

### Settings Management (2 endpoints)

```
GET /setting    # Get application settings (auth required)
PUT /setting    # Update application settings (auth required)
```

### Other Endpoints (9 endpoints)

```
GET /permissions                # List permissions (auth required)
GET /locales/                  # List locales (auth required)
GET /locales/:locale          # Get locale translations (public)
GET /                         # Welcome page (redirects to /documentation)
GET /health-check             # Health check (public)
GET /openapi.json             # OpenAPI spec (public)
GET /documentation            # Scalar API documentation (public)
```

## Validation Schemas (Zod)

### Authentication Validators

- `AuthenticationSignInSchema`: email, password
- `AuthenticationSignUpSchema`: name, email, password
- `AuthenticationMagicLinkSchema`: code
- `AuthenticationRecoveryUpdatePasswordSchema`: password (min 8 chars)
- `AuthenticationRecoveryRequestCodeSchema`: email
- `AuthenticationRecoveryValidateCodeSchema`: code

### Collections Validators

- `CreateCollectionSchema`: name, owner (optional)
- `UpdateCollectionSchema`: name, description, logo, configuration
- `GetCollectionBySlugSchema`: slug
- `ListCollectionPaginatedSchema`: page, perPage, search

### Field Validators

- `CreateFieldCollectionSchema`: name, type (FIELD_TYPE enum), configuration
- `UpdateFieldCollectionSchema`: name, type, configuration, trashed, trashedAt
- `GetFieldCollectionByIdSchema`: \_id

### Row Validators (Dynamic System)

- `CreateRowCollectionSchema`: Dynamic record schema (z.record) adapts to
  collection fields
- `UpdateRowCollectionSchema`: Same as create, handles partial updates
- `GetRowCollectionByIdSchema`: Row ID validation
- `GetRowCollectionSlugSchema`: Collection slug validation
- `ListRowCollectionPaginatedSchema`: Pagination + complex query parameters
- `ReactionRowCollectionSchema`: Social reactions (type: 'like'/'unlike', field,
  user)
- `EvaluationRowCollectionSchema`: Numeric ratings (value: number, field, user)

**Dynamic Validation Features:**

```typescript
// Supports all field types dynamically
z.union([
  z.string(), // TEXT_SHORT, TEXT_LONG, DROPDOWN, CATEGORY
  z.number(), // INTEGER, DECIMAL formats
  z.boolean(), // Boolean fields
  z.null(), // Optional fields
  z.array(z.string()), // Multiple selections (DROPDOWN)
  z.array(z.number()), // Multiple numeric values
  z.array(z.object({ _id: z.string().optional() }).loose()), // FIELD_GROUP arrays
  z.object({}).loose(), // Complex nested objects
]);
```

### User Validators

- `CreateUserSchema`: name, email, password, group
- `UpdateUserSchema`: name, email, group, password (optional), status
- `UpdateUserProfileSchema`: name, email, group, currentPassword, newPassword,
  allowPasswordChange
- `ListUserPaginatedSchema`: page, perPage, search, sub

### User Group Validators

- `CreateUserGroupSchema`: name, description, permissions array
- `UpdateUserGroupSchema`: description, permissions, \_id
- `ListUserGroupPaginatedSchema`: page, perPage, search

## Database Models (Mongoose)

### Core Models (9 total)

#### User Model

```typescript
{
  name: String (required)
  email: String (required)
  password: String (required)
  status: 'active' | 'inactive' (default: 'inactive')
  group: ObjectId (ref: 'UserGroup')
  trashed: Boolean (default: false)
  trashedAt: Date
  timestamps: true
}
```

#### Collection Model

```typescript
{
  _schema: Mixed (dynamic schema)
  name: String (required)
  description: String
  logo: ObjectId (ref: 'Storage')
  slug: String (required)
  fields: [ObjectId] (ref: 'Field')
  type: 'collection' | 'field-group'
  configuration: {
    style: 'gallery' | 'list'
    visibility: 'public' | 'restricted'
    collaboration: 'open' | 'restricted'
    administrators: [ObjectId] (ref: 'User')
    owner: ObjectId (ref: 'User', required)
    fields: { orderList: [String], orderForm: [String] }
  }
  trashed: Boolean
  trashedAt: Date
}
```

#### Field Model

```typescript
{
  name: String (required)
  slug: String
  type: FIELD_TYPE enum (required)
  configuration: {
    required: Boolean
    multiple: Boolean
    format: FIELD_FORMAT enum
    listing: Boolean
    filtering: Boolean
    defaultValue: String
    relationship: { collection: {_id, slug}, field: {_id, slug}, order: 'asc'|'desc' }
    dropdown: [String]
    category: [{ id: String, label: String, children: [Mixed] }]
    group: { _id: ObjectId, slug: String }
  }
  trashed: Boolean
  trashedAt: Date
}
```

#### Other Models

- **UserGroup**: name, slug, description, permissions array
- **Storage**: url, filename, type (for file uploads)
- **ValidationToken**: user, code, status (for auth flows)
- **Permission**: name, slug, description
- **Reaction**: user, type ('like'/'unlike')
- **Evaluation**: user, value (number)

## Use Cases Architecture

**Total: 43 use case files across 9 domains**

### Pattern: Functional Error Handling

- All use cases return `Either<ApplicationException, T>`
- Consistent left-right error handling
- Service decorator pattern with `@Service()`
- Repository pattern with Mongoose models

### Business Logic Organization

1. **Authentication** (7 files): Magic link, sign-in/up, recovery flows
2. **Collections** (8 files): CRUD + trash management + dynamic schema building
3. **Fields** (5 files): Field management with dynamic validation
4. **Rows** (9 files): **CORE DATA LAYER** - Dynamic data operations + social
   features
   - `create.use-case.ts`: Dynamic row creation with field validation
   - `list-paginated.use-case.ts`: Complex querying with population strategies
   - `get-by-id.use-case.ts`: Single row retrieval with relationships
   - `update.use-case.ts`: Field-specific updates maintaining data integrity
   - `delete.use-case.ts`: Permanent deletion with cleanup
   - `send-to-trash.use-case.ts`: Soft delete with timestamp tracking
   - `remove-from-trash.use-case.ts`: Restore from soft delete
   - `reaction.use-case.ts`: Social reaction management (like/unlike)
   - `evaluation.use-case.ts`: Rating system management (numeric scores)
5. **Users** (4 files): User management + profile updates
6. **User Groups** (5 files): Role-based access control
7. **Permissions** (1 file): Permission listing
8. **Profile** (2 files): User profile operations
9. **Storage** (2 files): File upload/delete operations

## Middleware System

### Authentication Middleware

- JWT verification using `request.jwtVerify()`
- Extracts user data from JWT payload
- Sets `request.user` with decoded info
- Returns 401 on authentication failure

### Resource Middleware (Permission-based)

- Factory function: `ResourceMiddleware(resource: string)`
- Checks for resource-specific permissions
- Supports public access via `?public=true` query param
- Validates user permissions against required resource

## Core System Architecture

### Core Entities & Type System (`app/core/entity.core.ts`)

#### **Foundation Types**

```typescript
// Makes specified properties optional while keeping others required
type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

// Base interface for all entities with audit fields
interface Base {
  _id: string;
  createdAt: Date;
  updatedAt: Date | null;
  trashedAt: Date | null;
  trashed: boolean;
}
```

#### **Core Enums**

```typescript
enum TOKEN_STATUS {
  REQUESTED = 'REQUESTED',
  EXPIRED = 'EXPIRED',
  VALIDATED = 'VALIDATED',
}

enum FIELD_TYPE {
  TEXT_SHORT = 'TEXT_SHORT', // Simple text input
  TEXT_LONG = 'TEXT_LONG', // Textarea input
  DROPDOWN = 'DROPDOWN', // Select from options
  DATE = 'DATE', // Date/datetime values
  RELATIONSHIP = 'RELATIONSHIP', // Reference to other collections
  FILE = 'FILE', // File attachments
  FIELD_GROUP = 'FIELD_GROUP', // Nested field groups
  REACTION = 'REACTION', // Like/unlike system
  EVALUATION = 'EVALUATION', // Numeric rating system
  CATEGORY = 'CATEGORY', // Hierarchical categories
}

enum FIELD_FORMAT {
  // TEXT_SHORT formats
  ALPHA_NUMERIC = 'ALPHA_NUMERIC',
  INTEGER = 'INTEGER',
  DECIMAL = 'DECIMAL',
  URL = 'URL',
  EMAIL = 'EMAIL',
  // DATE formats
  DD_MM_YYYY = 'dd/MM/yyyy',
  MM_DD_YYYY = 'MM/dd/yyyy',
  YYYY_MM_DD = 'yyyy/MM/dd',
  DD_MM_YYYY_HH_MM_SS = 'dd/MM/yyyy HH:mm:ss',
  MM_DD_YYYY_HH_MM_SS = 'MM/dd/yyyy HH:mm:ss',
  YYYY_MM_DD_HH_MM_SS = 'yyyy/MM/dd HH:mm:ss',
  DD_MM_YYYY_DASH = 'dd-MM-yyyy',
  MM_DD_YYYY_DASH = 'MM-dd-yyyy',
  YYYY_MM_DD_DASH = 'yyyy-MM-dd',
  // + more dash and time variants
}
```

#### **Authentication Entities**

```typescript
interface JWTPayload {
  sub: string;
  group: Pick<UserGroup, 'name' | 'description' | 'slug'>;
  permissions: string[];
  email: string;
  name: string;
}

interface User extends Base {
  name: string;
  email: string;
  password: string;
  status: 'active' | 'inactive';
  group: string | UserGroup;
}

interface UserGroup extends Base {
  name: string;
  slug: string;
  description: string | null;
  permissions: string[] | Permission[];
}

interface ValidationToken extends Base {
  user: string;
  code: string;
  status: TOKEN_STATUS;
}
```

#### **Dynamic Schema System Entities**

```typescript
interface Collection extends Base {
  _schema: CollectionSchema; // Dynamic MongoDB schema
  name: string;
  description: string | null;
  logo: string | Storage | null;
  slug: string;
  fields: string[] | Field[];
  type: 'collection' | 'field-group';
  configuration: {
    style: 'gallery' | 'list';
    visibility: 'public' | 'restricted';
    collaboration: 'open' | 'restricted';
    administrators: string[] | User[];
    owner: string | User;
    fields: {
      orderList: string[];
      orderForm: string[];
    };
  };
}

interface Field extends Base {
  name: string;
  slug: string;
  type: FIELD_TYPE;
  configuration: {
    required: boolean;
    multiple: boolean;
    format: FIELD_FORMAT | null;
    listing: boolean;
    filtering: boolean;
    defaultValue: string | null;
    relationship: FieldConfigurationRelationship | null;
    dropdown: string[];
    category: Category[];
    group: FieldConfigurationGroup | null;
  };
}

interface Row extends Base, Record<string, any> {
  // Dynamic fields based on collection schema
  [fieldSlug: string]: any;
}
```

#### **Social & Content Entities**

```typescript
interface Reaction extends Base {
  user: string | User;
  type: 'like' | 'unlike';
}

interface Evaluation extends Base {
  user: string | User;
  value: number;
}

interface Storage extends Base {
  url: string;
  filename: string;
  type: string;
}

interface Category {
  id: string;
  label: string;
  children: unknown[];
}
```

#### **Query & Pagination System**

```typescript
interface Search extends Record<string, unknown> {
  page: number;
  perPage: number;
  search?: string;
  trashed?: 'true' | 'false';
  sub?: string;
}

interface Meta {
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
  firstPage: number;
}

interface Paginated<Entity> {
  data: Entity;
  meta: Meta;
}
```

### Either Pattern - Functional Error Handling (`app/core/either.core.ts`)

```typescript
// ERROR case
export class Left<L, R> {
  readonly value: L;
  isRight(): this is Right<L, R> {
    return false;
  }
  isLeft(): this is Left<L, R> {
    return true;
  }
}

// SUCCESS case
export class Right<L, R> {
  readonly value: R;
  isRight(): this is Right<L, R> {
    return true;
  }
  isLeft(): this is Left<L, R> {
    return false;
  }
}

export type Either<L, R> = Left<L, R> | Right<L, R>;

// Factory functions
export const left = <L, R>(value: L): Either<L, R> => new Left(value);
export const right = <L, R>(value: R): Either<L, R> => new Right(value);
```

**Usage in Use Cases:**

```typescript
type Response = Either<ApplicationException, EntityType>;

async execute(payload: any): Promise<Response> {
  try {
    const result = await someOperation();
    return right(result); // Success
  } catch (error) {
    return left(ApplicationException.InternalServerError()); // Error
  }
}
```

### Exception System (`app/exceptions/application.exception.ts`)

#### **ApplicationException Architecture**

```typescript
class ApplicationException extends Error {
  private constructor(
    public readonly message: string,
    public readonly code: number,
    public readonly cause: string,
  ) {
    super(message);
  }

  // Client Errors (4xx)
  static BadRequest(message = 'Bad Request', cause = 'INVALID_PARAMETERS');
  static Unauthorized(
    message = 'Unauthorized',
    cause = 'AUTHENTICATION_REQUIRED',
  );
  static Forbidden(message = 'Forbidden', cause = 'ACCESS_DENIED');
  static NotFound(message = 'Not Found', cause = 'RESOURCE_NOT_FOUND');
  static Conflict(message = 'Conflict', cause = 'CONFLICT_IN_REQUEST');
  static UnprocessableEntity(
    message = 'Unprocessable Entity',
    cause = 'VALIDATION_ERROR',
  );

  // Server Errors (5xx)
  static InternalServerError(
    message = 'Internal Server Error',
    cause = 'SERVER_ERROR',
  );
  static NotImplemented(message = 'Not Implemented', cause = 'NOT_IMPLEMENTED');
  static ServiceUnavailable(
    message = 'Service Unavailable',
    cause = 'SERVICE_UNAVAILABLE',
  );
}
```

**Error Response Structure:**

```typescript
{
  message: string, // Human-readable error message
  code: number,    // HTTP status code (400, 401, 404, 500, etc.)
  cause: string    // Machine-readable error identifier
}
```

### Core Utilities (`app/core/util.core.ts`)

#### **Dynamic Schema Building**

```typescript
// Creates MongoDB schemas dynamically based on field definitions
buildSchema(fields: Field[]): CollectionSchema

// Creates dynamic Mongoose models at runtime
buildCollection(collection): Promise<mongoose.Model>

// Generates complex population queries for relationships
buildPopulate(fields): Promise<{path: string}[]>
```

#### **Query Building System**

```typescript
// Constructs MongoDB queries from search parameters
buildQuery(searchParams, fields): Query

// Text normalization with internationalization support
normalize(search: string): string
// Example: "josé" → "[jJJoOoOsSeE][eEeEe]"
```

**Advanced Query Features:**

```typescript
// Field-specific filtering patterns:
{
  "field-slug": "value",           // Direct field filtering
  "date-field-initial": "2024-01-01", // Date range start
  "date-field-final": "2024-12-31",   // Date range end
  "order-field": "asc",            // Field-based ordering
  search: "text",                  // Full-text search with normalization
  trashed: "false",               // Trash status filtering
  page: 1, perPage: 50           // Pagination
}
```

#### **Text Normalization (Internationalization)**

```typescript
function normalize(search: string): string {
  return escapedSearch
    .replace(/a/gi, '[aáàâãä]')
    .replace(/e/gi, '[eéèêë]')
    .replace(/i/gi, '[iíìîï]')
    .replace(/o/gi, '[oóòôõö]')
    .replace(/u/gi, '[uúùûü]')
    .replace(/c/gi, '[cç]')
    .replace(/n/gi, '[nñ]');
}
```

### Architecture Integration Patterns

#### **Layered Architecture Flow**

1. **Controller → Use Case → Model → Core**
2. **Either Pattern**: All use cases return `Either<ApplicationException, T>`
3. **Dynamic Schema**: Runtime model generation based on field configurations
4. **Type Safety**: Comprehensive TypeScript contracts throughout

#### **Key Strengths**

- **Functional Error Handling**: No unhandled exceptions
- **Dynamic Schema System**: Runtime flexibility without code changes
- **Type Safety**: Complete TypeScript coverage
- **Internationalization**: Built-in text normalization
- **Audit Trail**: Soft delete and timestamp tracking
- **Performance**: Intelligent population and query optimization

## Rows System - Core Data Management Layer

**The heart of the low-code platform - manages dynamic data records**

### Dynamic Schema System

The system builds Mongoose schemas dynamically based on field configurations:

- **Field Type Mapping**: Maps FIELD_TYPE to Mongoose schema types
- **Dynamic Collections**: Collections generate schemas at runtime
- **Relationship Handling**: Complex relationship population strategies
- **Validation Integration**: Zod + Mongoose validation layers

### Row Data Structure

```typescript
// Rows are completely dynamic based on collection fields
{
  _id: ObjectId,
  [fieldSlug]: any, // Dynamic fields based on collection schema
  createdAt: Date,
  updatedAt: Date,
  trashed: boolean,
  trashedAt: Date
}
```

### Field Type Implementation in Rows

```typescript
const FieldTypeMapper: Record<FIELD_TYPE, Schema['type']> = {
  TEXT_SHORT: 'String', // Simple text input
  TEXT_LONG: 'String', // Textarea input
  DROPDOWN: 'String', // Select from predefined options
  FILE: 'ObjectId', // Reference to Storage model
  DATE: 'Date', // Date/datetime values
  RELATIONSHIP: 'ObjectId', // Reference to other collection rows
  FIELD_GROUP: 'ObjectId', // Nested collection data
  EVALUATION: 'ObjectId', // Numeric rating system
  REACTION: 'ObjectId', // Like/unlike system
  CATEGORY: 'String', // Hierarchical categories
};
```

### Row Operations & Features

#### CRUD Operations

- **Create**: Dynamic validation based on collection fields
- **Read**: Complex population of relationships and social data
- **Update**: Field-specific updates with type validation
- **Delete**: Both soft delete (trash) and permanent delete

#### Advanced Query System

```typescript
// Query building supports:
{
  search: "text",           // Full-text search across text fields
  "field-slug": "value",   // Direct field filtering
  "date-field-initial": "2024-01-01", // Date range start
  "date-field-final": "2024-12-31",   // Date range end
  "order-field": "asc",    // Field-based ordering
  trashed: "false",        // Trash status filtering
  page: 1,                 // Pagination
  perPage: 50
}
```

#### Social Features Integration

**Reactions System:**

```typescript
{
  type: 'like' | 'unlike',
  field: 'field-slug',     // Which field the reaction targets
  user: 'user-id'         // Who reacted
}
```

**Evaluation System:**

```typescript
{
  value: number,           // Rating value (e.g., 1-5 stars)
  field: 'field-slug',     // Which field the evaluation targets
  user: 'user-id'         // Who evaluated
}
```

#### Relationship Management

- **Simple References**: Direct ObjectId references to other collections
- **Field Groups**: Nested collections within collections
- **Population Strategy**: Intelligent recursive population of related data
- **Circular Reference Protection**: Prevents infinite population loops

#### Dynamic Validation

```typescript
// Row validation adapts to collection schema
CreateRowCollectionSchema = z.record(
  z.string(),
  z.union([
    z.string(), // Text fields
    z.number(), // Numeric fields
    z.boolean(), // Boolean fields
    z.null(), // Null values
    z.array(z.string()), // Multiple selections
    z.array(z.number()),
    z.array(z.object({ _id: z.string().optional() }).loose()), // Field groups
    z.object({}).loose(), // Complex objects
  ]),
);
```

### Row Use Cases (Business Logic)

1. **create.use-case.ts**: Dynamic row creation with field validation
2. **list-paginated.use-case.ts**: Complex querying with population
3. **get-by-id.use-case.ts**: Single row retrieval with relationships
4. **update.use-case.ts**: Field-specific updates maintaining integrity
5. **delete.use-case.ts**: Permanent deletion with cleanup
6. **send-to-trash.use-case.ts**: Soft delete with timestamp
7. **remove-from-trash.use-case.ts**: Restore from soft delete
8. **reaction.use-case.ts**: Social reaction management
9. **evaluation.use-case.ts**: Rating system management

### Key Architectural Patterns in Rows

- **Dynamic Model Generation**: `buildCollection()` creates models at runtime
- **Population Strategy**: `buildPopulate()` handles complex relationships
- **Query Builder**: `buildQuery()` creates MongoDB queries dynamically
- **Schema Normalization**: `normalize()` handles accented characters in search
- **Either Pattern**: Consistent error handling across all operations

This comprehensive rows system enables the low-code platform to handle
completely dynamic data structures while maintaining type safety, performance,
and data integrity.

---

## 🔧 Debugging & Troubleshooting

### Common Development Patterns

#### **Starting the Development Environment**

```bash
# 1. Start local MongoDB (Docker)
docker-compose -f docker-compose.mongo.local.yml up -d

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your configuration

# 4. Run seeders (optional - populate database)
npm run seed

# 5. Start development server
npm run dev
```

#### **Debugging Dynamic Collections**

```typescript
// Check if collection exists and is properly built
const collection = await Collection.findOne({ slug: 'your-slug' });
console.log('Collection schema:', collection._schema);

// Build and test dynamic model
const Model = await buildCollection(collection);
console.log('Model name:', Model.modelName);
console.log('Model schema:', Model.schema.obj);

// Test population strategy
const populate = await buildPopulate(collection.fields);
console.log('Population strategy:', JSON.stringify(populate, null, 2));
```

#### **Testing Query Building**

```typescript
// Test query building with different parameters
const query = buildQuery(
  {
    search: 'joão',
    status: 'active',
    'created-initial': '2024-01-01',
    'created-final': '2024-12-31',
    trashed: 'false',
  },
  fields,
);

console.log('Generated query:', JSON.stringify(query, null, 2));
// Output includes normalized search with accents
```

#### **JWT Token Debugging**

```typescript
// Decode JWT from cookie
import jwt from 'jsonwebtoken';

const token = request.cookies.accessToken;
const decoded = jwt.verify(token, Buffer.from(Env.JWT_PUBLIC_KEY, 'base64'), {
  algorithms: ['RS256'],
});
console.log('Decoded JWT:', decoded);
```

#### **Mongoose Model Issues**

```typescript
// Clear cached models (useful in development)
if (mongoose.models['collection-slug']) {
  delete mongoose.models['collection-slug'];
}

// Verify model registration
console.log('Registered models:', Object.keys(mongoose.models));

// Check collection existence in MongoDB
const collections = await mongoose.connection.db.listCollections().toArray();
console.log(
  'MongoDB collections:',
  collections.map((c) => c.name),
);
```

### Common Issues & Solutions

#### **Issue 1: "Collection slug not found" Error**

**Causa**: Collection não existe ou slug está incorreto **Solução**:

```typescript
// Verify collection exists
const collection = await Collection.findOne({ slug: 'your-slug' });
if (!collection) {
  console.error('Collection not found');
  // Create collection or fix slug
}
```

#### **Issue 2: Dynamic Schema Not Building Correctly**

**Causa**: Fields não estão configurados corretamente **Solução**:

```typescript
// Check field configurations
const fields = await Field.find({ _id: { $in: collection.fields } });
console.log(
  'Fields:',
  fields.map((f) => ({
    slug: f.slug,
    type: f.type,
    config: f.configuration,
  })),
);

// Rebuild schema manually
const schema = buildSchema(fields);
console.log('Built schema:', schema);
```

#### **Issue 3: Population Not Working**

**Causa**: Relacionamentos não configurados ou modelos não registrados
**Solução**:

```typescript
// Verify relationship configuration
const relationshipFields = fields.filter(
  (f) => f.type === FIELD_TYPE.RELATIONSHIP,
);
relationshipFields.forEach((f) => {
  console.log('Relationship:', {
    field: f.slug,
    collection: f.configuration?.relationship?.collection?.slug,
    field: f.configuration?.relationship?.field?.slug,
  });
});

// Ensure related models are built
const relatedCollection = await Collection.findOne({
  slug: f.configuration.relationship.collection.slug,
});
await buildCollection(relatedCollection);
```

#### **Issue 4: Authentication Errors**

**Causa**: JWT inválido, expirado ou mal configurado **Solução**:

```typescript
// Verify JWT configuration
console.log('JWT Public Key:', Env.JWT_PUBLIC_KEY?.substring(0, 50) + '...');
console.log('JWT Private Key:', Env.JWT_PRIVATE_KEY?.substring(0, 50) + '...');

// Test JWT signing
const testToken = await app.jwt.sign({
  sub: 'test-user-id',
  email: 'test@example.com',
});
console.log('Test token:', testToken);

// Verify token
try {
  const decoded = await app.jwt.verify(testToken);
  console.log('Token valid:', decoded);
} catch (error) {
  console.error('Token invalid:', error);
}
```

#### **Issue 5: CORS Errors**

**Causa**: Origin não está na whitelist **Solução**:

```typescript
// In start/kernel.ts, add your origin
const allowedOrigins = [
  'https://demo.lowcodejs.org',
  'http://localhost:5173',
  'http://localhost:3000',
  'YOUR_ORIGIN_HERE', // Add your origin
];
```

#### **Issue 6: File Upload Not Working**

**Causa**: Multipart não configurado ou diretório de storage não existe
**Solução**:

```bash
# Ensure storage directory exists
mkdir -p _storage

# Check permissions
chmod 755 _storage

# Verify multipart registration in kernel.ts
```

### Performance Debugging

#### **Slow Queries**

```typescript
// Enable MongoDB query logging
mongoose.set('debug', true);

// Measure query performance
console.time('query');
const results = await Model.find(query).populate(populate);
console.timeEnd('query');

// Check indexes
const indexes = await Model.collection.getIndexes();
console.log('Indexes:', indexes);
```

#### **Memory Issues with Large Datasets**

```typescript
// Use lean() for read-only operations
const results = await Model.find(query).lean();

// Use cursor for large datasets
const cursor = Model.find(query).cursor();
for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
  // Process document
}

// Limit population depth
const populate = await buildPopulate(fields);
// Consider limiting depth manually
```

### Testing Strategies

#### **Unit Testing Use Cases**

```typescript
// Example test for a use case
describe('CreateRowUseCase', () => {
  it('should create row with valid data', async () => {
    const result = await createRowUseCase.execute({
      collectionSlug: 'users',
      data: { name: 'John', email: 'john@example.com' },
    });

    expect(result.isRight()).toBe(true);
    expect(result.value).toHaveProperty('_id');
  });

  it('should return error for invalid data', async () => {
    const result = await createRowUseCase.execute({
      collectionSlug: 'users',
      data: { invalid: 'data' },
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value.code).toBe(422);
  });
});
```

#### **Integration Testing Endpoints**

```typescript
// Using Fastify inject (no HTTP server needed)
const response = await app.inject({
  method: 'POST',
  url: '/collections/users/rows',
  headers: {
    cookie: `accessToken=${validToken}`,
  },
  payload: {
    name: 'John Doe',
    email: 'john@example.com',
  },
});

expect(response.statusCode).toBe(201);
expect(response.json()).toHaveProperty('_id');
```

### Useful Commands

```bash
# Check MongoDB connection
npm run dev
# Look for "Mongoose connected" in logs

# Run specific seeder
npx tsx database/seeders/YOUR_SEEDER.ts

# Build and check output
npm run build
ls -la build/

# Check TypeScript types
npx tsc --noEmit

# Lint code
npm run lint

# Format code
npm run format

# View logs in Docker
docker-compose -f docker-compose.demo.yml logs -f api

# Access MongoDB shell (Docker)
docker exec -it local-mongo mongosh -u local -p local

# Check environment variables
node -e "require('dotenv').config(); console.log(process.env)"
```

---

## 📋 Quick Reference

### File Locations

- **Controllers**: `app/controllers/{domain}/*.controller.ts`
- **Use Cases**: `app/use-case/{domain}/*.use-case.ts`
- **Models**: `app/model/*.model.ts`
- **Validators**: `app/validators/*.validator.ts`
- **Core Types**: `app/core/entity.core.ts`
- **Utilities**: `app/core/util.core.ts`
- **Exceptions**: `app/exceptions/application.exception.ts`

### Key Functions

- **buildSchema(fields)**: Create Mongoose schema from fields
- **buildCollection(collection)**: Create dynamic Mongoose model
- **buildPopulate(fields)**: Generate population strategy
- **buildQuery(params, fields)**: Build MongoDB query
- **normalize(text)**: Normalize text for search

### Environment Variables

```env
PORT=3000
DATABASE_URL=mongodb://localhost:27017/lowcodejs
JWT_PRIVATE_KEY=base64_encoded_private_key
JWT_PUBLIC_KEY=base64_encoded_public_key
COOKIE_SECRET=your_secret
```

---

This context provides comprehensive understanding of the entire LowCodeJS API
codebase structure, patterns, and functionality.
