# Import Table

Importa uma tabela a partir de um arquivo JSON exportado pela plataforma.

## Endpoint
`POST /tools/import-table` | Auth: Yes | Permission: nenhuma especifica

## Fluxo
1. Middleware: AuthenticationMiddleware (obrigatorio) | bodyLimit: 50MB
2. Validator: ImportTableValidator - campos: name (string, required, min 1, max 40), fileContent (objeto loose/dinamico)
3. UseCase:
   - Verifica ownerId
   - Valida header: plataforma deve ser "lowcodejs"
   - Gera slug via slugify(name) e verifica unicidade
   - Se tem structure:
     1. Cria campos nativos via fieldRepository.createMany(FIELD_NATIVE_LIST)
     2. Cria campos top-level (nao-grupo) a partir da estrutura exportada
     3. Para cada grupo: cria campo FIELD_GROUP + campos nativos do grupo + subcampos
     4. Resolve relationships (busca tabela/campo pelo slug no banco)
     5. Resolve layoutFields (slug -> novo field ID)
     6. Resolve fieldOrderList/fieldOrderForm (slug -> novo field ID)
     7. Constroi schema via buildSchema()
     8. Cria a tabela via tableRepository.create
     9. Se tem data: constroi tabela dinamica, insere rows via insertOne
   - Se nao tem structure (data-only): nao suportado, retorna erro
   - Retorna { tableId, slug, importedFields, importedRows }
4. Repository: TableContractRepository (findBy, create), FieldContractRepository (create, createMany)

## Regras de Negocio
- Somente arquivos com header.platform === "lowcodejs" sao aceitos
- Slug da nova tabela deve ser unico
- Campos de RELATIONSHIP sao resolvidos: busca tabela/campo relacionado pelo slug no banco atual
- Campos nativos sao recriados para a nova tabela e para cada grupo
- Importacao de dados e feita via insertOne diretamente na collection (bypass de validacoes Mongoose)
- Erros em rows individuais nao interrompem a importacao (continua com as proximas)
- Importacao somente de dados (sem estrutura) nao e suportada na versao atual
- bodyLimit aumentado para 50MB

## Erros Possiveis
| Code | Cause | Quando |
|------|-------|--------|
| 400 | OWNER_ID_REQUIRED | Owner ID ausente |
| 400 | INVALID_PLATFORM | header.platform nao e "lowcodejs" |
| 400 | TABLE_SLUG_ALREADY_EXISTS | Ja existe tabela com o mesmo slug |
| 400 | STRUCTURE_REQUIRED | Tentativa de importar somente dados sem estrutura |
| 500 | IMPORT_TABLE_ERROR | Erro interno durante importacao |

## Testes
- Unit: `import-table.use-case.spec.ts` (nao existe ainda)
- E2E: `import-table.controller.spec.ts` (nao existe ainda)
