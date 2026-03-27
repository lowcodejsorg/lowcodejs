# Update Table

Atualiza uma tabela existente, incluindo nome, estilo, visibilidade, administradores e layout.

## Endpoint
`PUT /tables/:slug` | Auth: Sim | Permission: UPDATE_TABLE

## Fluxo
1. Middleware: AuthenticationMiddleware (required), TableAccessMiddleware (UPDATE_TABLE)
2. Validator: TableUpdateBodyValidator - campos: name (string, trim, min 1, max 40, regex), description (string nullable), logo (string nullable), style (TableStyleSchema), visibility (TableVisibilitySchema), collaboration (TableCollaborationSchema), administrators (array string), fieldOrderList (array string), fieldOrderForm (array string), methods (TableMethodSchema), order (TableOrderSchema), layoutFields (TableLayoutFieldsSchema optional). TableUpdateParamsValidator - campos: slug (string, trim)
3. UseCase:
   - Busca tabela por slug exato
   - Valida administradores: todos devem ser usuarios ativos (status ACTIVE, trashed false)
   - Gera novo slug via slugify a partir do novo nome
   - Se slug mudou, verifica unicidade do novo slug
   - Se slug mudou, renomeia colecao e atualiza referencias em campos RELATIONSHIP
   - Atualiza documento da tabela com todos os campos
   - Propaga visibilidade para grupos de campos (FIELD_GROUP) associados
   - Reconstroi tabela dinamica via buildTable
   - Se slug mudou, reconstroi tabelas que tem RELATIONSHIP apontando para esta
4. Repository: TableContractRepository.findBy, TableContractRepository.update, TableContractRepository.renameSlug, TableContractRepository.updateMany, TableContractRepository.findByFieldIds, FieldContractRepository.updateRelationshipTableSlug, FieldContractRepository.findMany, FieldContractRepository.findByRelationshipTableId, UserContractRepository.findMany

## Regras de Negocio
- Nome gera novo slug automaticamente
- Administradores devem ser usuarios ativos
- Rename de slug propaga para colecao MongoDB, campos RELATIONSHIP e tabelas relacionadas
- Visibilidade propaga para sub-tabelas FIELD_GROUP

## Erros Possiveis
| Code | Cause | Quando |
|------|-------|--------|
| 404 | TABLE_NOT_FOUND | Tabela nao encontrada |
| 400 | INACTIVE_ADMINISTRATORS | Administrador inativo ou inexistente |
| 409 | TABLE_ALREADY_EXISTS | Novo slug ja existe |
| 500 | UPDATE_TABLE_ERROR | Erro interno |

## Testes
- Unit: `update.use-case.spec.ts`
- E2E: `update.controller.spec.ts`
