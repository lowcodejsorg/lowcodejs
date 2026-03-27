# Builders

Modulos focados para construcao de schemas, modelos, queries e populates Mongoose.
Decompostos do antigo `util.core.ts` monolitico.

## Arquivos

| Arquivo | Exports | Descricao |
|---------|---------|-----------|
| `schema-builder.ts` | `buildSchema()`, `FieldTypeMapper`, `PASSWORD_REGEX` | Converte IField[] em Mongoose schema definition |
| `model-builder.ts` | `buildTable()`, `findReverseRelationships()` | Cria modelo Mongoose dinamico a partir de ITable. Registra hooks beforeSave/afterSave |
| `populate-builder.ts` | `buildPopulate()`, `getRelationship()` | Gera populate paths para relacionamentos, incluindo reverse relationships |
| `query-builder.ts` | `buildQuery()`, `buildOrder()`, `normalize()` | Converte filtros de busca em query MongoDB, com suporte a embedded docs e reverse lookups |
| `index.ts` | Re-export de todos | Barrel file |

## Import

```typescript
// Novo (recomendado)
import { buildTable, buildSchema } from '@application/core/builders';

// Legacy (funciona via facade em util.core.ts)
import { buildTable, buildSchema } from '@application/core/util.core';
```
