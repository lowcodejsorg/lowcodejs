# Repositories

Camada de acesso a dados com pattern Contract + Implementation.

## Pattern

Cada entidade possui 3 arquivos:
1. **`{entidade}-contract.repository.ts`** - Classe abstrata com metodos e payload types
2. **`{entidade}-mongoose.repository.ts`** - Implementacao com Mongoose (`@Service()` decorator)
3. **`{entidade}-in-memory.repository.ts`** - Implementacao em memoria para testes unitarios

## Metodos Padrao

| Metodo | Descricao |
|--------|-----------|
| `create(payload)` | Cria documento |
| `createMany(payloads)` | Cria multiplos (quando aplicavel) |
| `findBy(payload)` | Busca por _id ou slug |
| `findMany(payload)` | Query com search, paginacao, filtros |
| `update(payload)` | Atualiza por _id |
| `updateMany(payload)` | Atualiza multiplos (quando aplicavel) |
| `delete(_id)` | Soft delete (trashed=true, trashedAt=now) |
| `count(payload)` | Conta documentos matchando query |

## Payloads Tipados

Cada contract define seus proprios tipos:
- `{Entity}CreatePayload` - dados para criacao
- `{Entity}UpdatePayload` - _id + campos parciais
- `{Entity}FindByPayload` - _id ou slug + exact flag
- `{Entity}QueryPayload` - page, perPage, search, trashed, sort, filtros especificos

## Entidades com Repository

| Diretorio | Entidade | Metodos Extras |
|-----------|----------|----------------|
| `user/` | IUser | - |
| `user-group/` | IGroup | - |
| `permission/` | IPermission | - |
| `table/` | ITable | `renameSlug()`, `dropCollection()`, `findByFieldIds()` |
| `field/` | IField | - |
| `storage/` | IStorage | - |
| `validation-token/` | IValidationToken | - |
| `menu/` | IMenu | - |
| `reaction/` | IReaction | - |
| `evaluation/` | IEvaluation | - |
| `setting/` | ISetting | Pattern diferente (key-value no Redis) |

## Registro DI

Todos registrados em `core/di-registry.ts`:
```typescript
injectablesHolder.injectService(UserContractRepository, UserMongooseRepository);
```

## Para Criar Novo Repository

1. Crie `{entidade}-contract.repository.ts` com abstract class e payload types
2. Crie `{entidade}-mongoose.repository.ts` implementando o contract
3. Crie `{entidade}-in-memory.repository.ts` para testes
4. Registre em `core/di-registry.ts`
