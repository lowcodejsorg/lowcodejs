# Update Field

Atualiza um campo existente de uma tabela, incluindo nome, tipo, visibilidade e configuracoes.

## Endpoint
`PUT /tables/:slug/fields/:_id` | Auth: Sim | Permission: UPDATE_FIELD

## Fluxo
1. Middleware: AuthenticationMiddleware (required), TableAccessMiddleware (UPDATE_FIELD)
2. Validator: TableFieldUpdateBodyValidator - campos: name (string, trim), type (E_FIELD_TYPE enum), trashed (boolean default false), trashedAt (string nullable, transformado em Date) + TableFieldBaseSchema. TableFieldUpdateParamsValidator - campos: slug (string, trim), _id (string, trim)
3. UseCase:
   - Busca tabela por slug exato
   - Busca campo por _id exato
   - Valida restricoes: campo nativo nao pode ser trashed, campo locked (nao-nativo) so permite alteracoes de visibilidade/width, campo nativo so permite visibilidade e width
   - Verifica se e o ultimo campo ativo (nao pode enviar pra lixeira)
   - Gera novo slug (campos nativos mantem slug original)
   - Normaliza group (string -> objeto {slug})
   - Atualiza campo no repositorio
   - Se FIELD_GROUP: gerencia entrada em groups (cria novo ou atualiza slug existente)
   - Atualiza lista de fields na tabela
   - Reconstroi _schema via buildSchema
   - Atualiza tabela
   - Se slug mudou: reconstroi tabela dinamica e renomeia campo na colecao via $rename
   - Retorna campo atualizado
4. Repository: TableContractRepository.findBy, TableContractRepository.update, FieldContractRepository.findBy, FieldContractRepository.update

## Regras de Negocio
- Campos nativos: apenas visibilidade (showIn*) e largura (width*) podem ser alterados
- Campos locked (nao-nativos): mesma restricao de nativos (visibilidade e largura)
- Campos nativos nao podem ser enviados pra lixeira
- Ultimo campo ativo nao pode ser enviado pra lixeira
- Rename de slug propaga para colecao MongoDB via $rename
- Validacao usa metodos privados: canUpdateNativeField, canUpdateLockedField

## Erros Possiveis
| Code | Cause | Quando |
|------|-------|--------|
| 404 | TABLE_NOT_FOUND | Tabela nao encontrada |
| 404 | FIELD_NOT_FOUND | Campo nao encontrado |
| 403 | NATIVE_FIELD_CANNOT_BE_TRASHED | Tentativa de enviar campo nativo pra lixeira |
| 403 | FIELD_LOCKED | Campo locked e alteracao nao permitida |
| 403 | NATIVE_FIELD_RESTRICTED | Alteracao nao permitida em campo nativo |
| 409 | LAST_ACTIVE_FIELD | Ultimo campo ativo nao pode ir pra lixeira |
| 500 | UPDATE_FIELD_TABLE_ERROR | Erro interno |

## Testes
- Unit: `update.use-case.spec.ts`
- E2E: `update.controller.spec.ts`
