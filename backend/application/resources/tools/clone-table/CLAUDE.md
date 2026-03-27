# Clone Table

Clona uma tabela existente ou cria a partir de um template built-in.

## Endpoint
`POST /tools/clone-table` | Auth: Yes | Permission: nenhuma especifica

## Fluxo
1. Middleware: AuthenticationMiddleware (obrigatorio)
2. Validator: CloneTableValidator - campos: baseTableId (string, required, min 1), name (string, required, min 1, max 40, regex: letras/numeros/espacos/hifen/underscore/cedilha)
3. UseCase:
   - Verifica se ownerId esta presente (vem do request.user.sub)
   - Se baseTableId e um template built-in (KANBAN_TEMPLATE, CARDS_TEMPLATE, MOSAIC_TEMPLATE, DOCUMENT_TEMPLATE, FORUM_TEMPLATE, CALENDAR_TEMPLATE): delega para a funcao template correspondente
   - Senao: busca tabela base pelo _id
   - Gera novo slug via slugify(name)
   - Cria campos nativos via fieldRepository.createMany(FIELD_NATIVE_LIST)
   - Clona campos nao-nativos da tabela base
   - Clona grupos e seus campos
   - Constroi schema via buildSchema()
   - Remapeia fieldOrderList e fieldOrderForm com novos IDs
   - Cria a nova tabela via tableRepository.create
   - Retorna { table, fieldIdMap }
4. Repository: TableContractRepository (findBy, create), FieldContractRepository (create, createMany)

## Regras de Negocio
- Templates built-in criam tabelas predefinidas sem necessidade de tabela base no banco
- Para clone de tabela existente: duplica campos, grupos, schema, fieldOrder, methods e layoutFields
- Campos nativos sao recriados (novos IDs), nao copiados
- fieldIdMap mapeia IDs antigos para novos (usado pelo frontend)
- Nome tem restricao de 40 caracteres e caracteres especiais limitados
- A resposta do controller retorna { tableId, slug, fieldIdMap }

## Erros Possiveis
| Code | Cause | Quando |
|------|-------|--------|
| 400 | OWNER_ID_REQUIRED | Owner ID ausente (nao deveria ocorrer com auth) |
| 404 | TABLE_NOT_FOUND | Tabela base nao encontrada |
| 500 | CLONE_TABLE_ERROR | Erro interno durante clonagem |

## Testes
- Unit: `clone-table.use-case.spec.ts`
- E2E: `clone-table.controller.spec.ts`
