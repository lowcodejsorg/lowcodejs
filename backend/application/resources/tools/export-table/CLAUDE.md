# Export Table

Exporta a estrutura e/ou dados de uma tabela em formato JSON.

## Endpoint
`POST /tools/export-table` | Auth: Yes | Permission: nenhuma especifica

## Fluxo
1. Middleware: AuthenticationMiddleware (obrigatorio)
2. Validator: ExportTableValidator - campos: slug (string, required, min 1), exportType (enum: structure, data, full)
3. UseCase:
   - Busca tabela pelo slug (exact match)
   - Determina o que exportar baseado em exportType:
     - structure: exporta metadados (campos, grupos, layout, methods)
     - data: exporta rows
     - full: exporta ambos
   - Gera header com versao, plataforma, nome/slug da tabela, quem exportou, quando e tipo
   - Se includeStructure: exporta campos nao-nativos, grupos, fieldOrderList/Form (convertendo IDs para slugs), layoutFields (convertendo IDs para slugs), methods
   - Se includeData: constroi tabela dinamica, busca rows nao-trashed, filtra campos nao-nativos, ignora campos de referencia (RELATIONSHIP, FILE, USER, EVALUATION, REACTION, CREATOR), exporta dados de grupos inline
   - Retorna ExportResult
4. Repository: TableContractRepository (findBy)

## Regras de Negocio
- Campos nativos sao excluidos da exportacao de estrutura
- Campos de referencia (RELATIONSHIP, FILE, USER, EVALUATION, REACTION, CREATOR) sao excluidos da exportacao de dados (ObjectIds nao seriam validos no import)
- fieldOrderList/fieldOrderForm sao convertidos de IDs para slugs na exportacao
- Relationships sao exportados como { tableSlug, fieldSlug, order } em vez de ObjectIds
- userId e userName do usuario autenticado sao incluidos no header
- Formato de exportacao: { header, structure?, data? }

## Erros Possiveis
| Code | Cause | Quando |
|------|-------|--------|
| 404 | TABLE_NOT_FOUND | Tabela com o slug nao encontrada |
| 500 | EXPORT_TABLE_ERROR | Erro interno durante exportacao |

## Testes
- Unit: `export-table.use-case.spec.ts` (nao existe ainda)
- E2E: `export-table.controller.spec.ts` (nao existe ainda)
