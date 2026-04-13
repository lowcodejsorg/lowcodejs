# CRUD Action Templates

## Action: create

**HTTP**: `POST /{entities}`
**Status**: `201`
**Validator**: body with all required fields from base + action-specific
**Use-Case Logic**:
1. Check unique constraints (e.g., email, slug)
2. Process data (hash passwords, generate slugs, etc.)
3. Create via repository
4. Return created entity

**Error Cases**:
- `409 Conflict` — entity already exists
- `400 BadRequest` — missing required relationship
- `500 InternalServerError` — unexpected error

```typescript
// Validator
export const {Entity}CreateBodyValidator = {Entity}BaseValidator.extend({
  // action-specific fields (e.g., password)
});

// Use-Case: key logic
const existing = await this.repository.findBy({ email: payload.email, exact: true });
if (existing) {
  return left(HTTPException.Conflict('{Entity} already exists', '{ENTITY}_ALREADY_EXISTS'));
}
const created = await this.repository.create(payload);
return right(created);

// Controller
const body = {Entity}CreateBodyValidator.parse(request.body);
const result = await this.useCase.execute(body);
// ... handle Either
return response.status(201).send(result.value);
```

## Action: show

**HTTP**: `GET /{entities}/:_id`
**Status**: `200`
**Validator**: params with `_id`
**Use-Case Logic**:
1. Find by ID
2. Return entity or 404

**Error Cases**:
- `404 NotFound` — entity not found
- `500 InternalServerError` — unexpected error

```typescript
// Validator
export const {Entity}ShowParamValidator = z.object({
  _id: z.string().min(1, 'ID is required'),
});

// Use-Case: key logic
const entity = await this.repository.findBy({ _id: payload._id, exact: true });
if (!entity) {
  return left(HTTPException.NotFound('{Entity} not found', '{ENTITY}_NOT_FOUND'));
}
return right(entity);

// Controller
const params = {Entity}ShowParamValidator.parse(request.params);
const result = await this.useCase.execute(params);
// ... handle Either
return response.status(200).send(result.value);
```

## Action: paginated

**HTTP**: `GET /{entities}`
**Status**: `200`
**Validator**: query with `page`, `perPage`, `search`, order fields
**Use-Case Logic**:
1. Build sort from order-* query params
2. Fetch data and count from repository
3. Calculate pagination metadata
4. Return `{ meta, data }`

**Error Cases**:
- `500 InternalServerError` — unexpected error

```typescript
// Validator
export const {Entity}PaginatedQueryValidator = z.object({
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(50),
  search: z.string().trim().optional(),
  'order-name': z.enum(['asc', 'desc']).optional(),
  'order-created-at': z.enum(['asc', 'desc']).optional(),
});

// Use-Case: key logic
const sort: Record<string, 'asc' | 'desc'> = {};
if (payload['order-name']) sort.name = payload['order-name'];
if (payload['order-created-at']) sort.createdAt = payload['order-created-at'];

const data = await this.repository.findMany({ ...payload, sort });
const total = await this.repository.count(payload);
const lastPage = Math.ceil(total / payload.perPage);
let firstPage = 0;
if (total > 0) {
  firstPage = 1;
}
const meta = { total, perPage: payload.perPage, page: payload.page, lastPage, firstPage };
return right({ meta, data });

// Controller
const query = {Entity}PaginatedQueryValidator.parse(request.query);
const result = await this.useCase.execute(query);
// ... handle Either
return response.status(200).send(result.value);
```

## Action: update

**HTTP**: `PATCH /{entities}/:_id`
**Status**: `200`
**Validator**: params with `_id` + partial body
**Use-Case Logic**:
1. Check entity exists
2. Validate unique constraints if relevant fields changed
3. Update via repository
4. Return updated entity

**Error Cases**:
- `404 NotFound` — entity not found
- `409 Conflict` — unique constraint violated
- `500 InternalServerError` — unexpected error

```typescript
// Validators
export const {Entity}UpdateParamsValidator = z.object({
  _id: z.string().min(1, 'ID is required'),
});

export const {Entity}UpdateBodyValidator = {Entity}BaseValidator.partial().extend({
  status: z.enum(['active', 'inactive']).optional(),
});

// Use-Case: key logic
const existing = await this.repository.findBy({ _id: payload._id, exact: true });
if (!existing) {
  return left(HTTPException.NotFound('{Entity} not found', '{ENTITY}_NOT_FOUND'));
}
const updated = await this.repository.update(payload);
return right(updated);

// Controller
const params = {Entity}UpdateParamsValidator.parse(request.params);
const body = {Entity}UpdateBodyValidator.parse(request.body);
const result = await this.useCase.execute({ ...params, ...body });
// ... handle Either
return response.status(200).send(result.value);
```

## Action: delete

**HTTP**: `DELETE /{entities}/:_id`
**Status**: `204`
**Validator**: params with `_id`
**Use-Case Logic**:
1. Check entity exists
2. Delete via repository (permanent or soft based on project convention)
3. Return void

**Error Cases**:
- `404 NotFound` — entity not found
- `500 InternalServerError` — unexpected error

```typescript
// Validator
export const {Entity}DeleteParamValidator = z.object({
  _id: z.string().min(1, 'ID is required'),
});

// Use-Case: key logic
const existing = await this.repository.findBy({ _id: payload._id, exact: true });
if (!existing) {
  return left(HTTPException.NotFound('{Entity} not found', '{ENTITY}_NOT_FOUND'));
}
await this.repository.delete(payload._id);
return right(undefined);

// Controller
const params = {Entity}DeleteParamValidator.parse(request.params);
const result = await this.useCase.execute(params);
// ... handle Either
return response.status(204).send();
```

## Action: send-to-trash

**HTTP**: `PATCH /{entities}/:_id/trash`
**Status**: `200`
**Validator**: params with `_id`
**Use-Case Logic**:
1. Check entity exists
2. Set `trashed: true`, `trashedAt: new Date()`
3. Return updated entity

**Error Cases**:
- `404 NotFound` — entity not found
- `500 InternalServerError` — unexpected error

```typescript
// Use-Case: key logic
const existing = await this.repository.findBy({ _id: payload._id, exact: true });
if (!existing) {
  return left(HTTPException.NotFound('{Entity} not found', '{ENTITY}_NOT_FOUND'));
}
const updated = await this.repository.update({
  _id: payload._id,
  trashed: true,
  trashedAt: new Date(),
});
return right(updated);

// Controller route
@PATCH({ url: '/{entities}/:_id/trash', options: { ... } })
```

## Action: remove-from-trash

**HTTP**: `PATCH /{entities}/:_id/restore`
**Status**: `200`
**Validator**: params with `_id`
**Use-Case Logic**:
1. Check entity exists
2. Set `trashed: false`, `trashedAt: null`
3. Return updated entity

**Error Cases**:
- `404 NotFound` — entity not found
- `500 InternalServerError` — unexpected error

```typescript
// Use-Case: key logic
const existing = await this.repository.findBy({ _id: payload._id, exact: true });
if (!existing) {
  return left(HTTPException.NotFound('{Entity} not found', '{ENTITY}_NOT_FOUND'));
}
const updated = await this.repository.update({
  _id: payload._id,
  trashed: false,
  trashedAt: null,
});
return right(updated);

// Controller route
@PATCH({ url: '/{entities}/:_id/restore', options: { ... } })
```

## HTTP Method + Status Code Reference

| Action | Method | URL | Success Status |
|--------|--------|-----|----------------|
| create | POST | `/{entities}` | 201 |
| show | GET | `/{entities}/:_id` | 200 |
| paginated | GET | `/{entities}` | 200 |
| update | PATCH | `/{entities}/:_id` | 200 |
| delete | DELETE | `/{entities}/:_id` | 204 |
| send-to-trash | PATCH | `/{entities}/:_id/trash` | 200 |
| remove-from-trash | PATCH | `/{entities}/:_id/restore` | 200 |

## Framework-Specific Route Decorators

### Fastify Decorators
```typescript
@POST({ url: '/{entities}', options: { onRequest: [...], schema: ... } })
@GET({ url: '/{entities}/:_id', options: { ... } })
@GET({ url: '/{entities}', options: { ... } })
@PATCH({ url: '/{entities}/:_id', options: { ... } })
@DELETE({ url: '/{entities}/:_id', options: { ... } })
@PATCH({ url: '/{entities}/:_id/trash', options: { ... } })
@PATCH({ url: '/{entities}/:_id/restore', options: { ... } })
```

### NestJS
```typescript
@Post() // POST /{entities}
@Get(':id') // GET /{entities}/:id
@Get() // GET /{entities}
@Patch(':id') // PATCH /{entities}/:id
@Delete(':id') // DELETE /{entities}/:id
@Patch(':id/trash') // PATCH /{entities}/:id/trash
@Patch(':id/restore') // PATCH /{entities}/:id/restore
```

### Express Router
```typescript
router.post('/{entities}', ...);
router.get('/{entities}/:id', ...);
router.get('/{entities}', ...);
router.patch('/{entities}/:id', ...);
router.delete('/{entities}/:id', ...);
router.patch('/{entities}/:id/trash', ...);
router.patch('/{entities}/:id/restore', ...);
```

### Hono
```typescript
app.post('/{entities}', ...);
app.get('/{entities}/:id', ...);
app.get('/{entities}', ...);
app.patch('/{entities}/:id', ...);
app.delete('/{entities}/:id', ...);
app.patch('/{entities}/:id/trash', ...);
app.patch('/{entities}/:id/restore', ...);
```
