# Tables Import/Export (extensão `core/tools/tables-import-export`)

Tool unificada que expõe dois endpoints para exportar e importar tabelas em
JSON. Era o recurso `/tools/{export,import}-table` do core; foi migrado para
extensão como TOOL única (uma página com 2 seções: Importar e Exportar).

## Acesso UI

`/tools/core/tables-import-export` — submenu **Ferramentas** na sidebar (uma
única página com cards de Importar e Exportar lado a lado).

## Endpoints

| Endpoint | Método | bodyLimit | Descrição |
|----------|--------|-----------|-----------|
| `/tools/export-table` | POST | default | Exporta estrutura e/ou dados de uma tabela em JSON |
| `/tools/import-table` | POST | 50 MB | Cria uma nova tabela a partir de um JSON exportado |

Ambos blindados por `ExtensionActiveMiddleware({ pkg: 'core', type: TOOL,
extensionId: 'tables-import-export' })` — desativar a tool em `/extensions`
desliga ambos os endpoints.

## Export

### Validator
`ExportTableValidator`: `slug` (string, required, min 1), `exportType`
(enum: `structure | data | full`).

### Fluxo
1. Auth + ExtensionActive
2. Busca tabela pelo slug
3. Conforme `exportType` monta `header + structure? + data?`
4. `structure`: campos (sem nativos), grupos, layoutFields/fieldOrder
   convertidos pra slugs, methods
5. `data`: rows não-trashed, ignora campos referenciais (RELATIONSHIP, FILE,
   USER, EVALUATION, REACTION, CREATOR)

### Erros
| Code | Cause | Quando |
|------|-------|--------|
| 404 | TABLE_NOT_FOUND | Tabela com o slug não encontrada |
| 500 | EXPORT_TABLE_ERROR | Erro interno |

## Import

### Validator
`ImportTableValidator`: `name` (string, required, min 1, max 40), `fileContent`
(objeto loose).

### Fluxo
1. Auth + ExtensionActive (bodyLimit 50 MB)
2. Valida `header.platform === 'lowcodejs'`
3. Slugify do nome + checa unicidade
4. Cria campos nativos + campos top-level + grupos (cada grupo recria nativos
   + subcampos)
5. Resolve `relationships` (busca tabela/campo por slug no banco atual)
6. Remapeia `layoutFields` e `fieldOrderList/Form` (slug → novo field id)
7. Cria a tabela; se `data`, faz `insertOne` por linha (ignora falhas)

### Erros
| Code | Cause | Quando |
|------|-------|--------|
| 400 | OWNER_ID_REQUIRED | Owner ausente (não deveria com auth) |
| 400 | INVALID_PLATFORM | header.platform diferente de "lowcodejs" |
| 400 | TABLE_SLUG_ALREADY_EXISTS | Slug derivado do nome já existe |
| 400 | STRUCTURE_REQUIRED | Arquivo só com `data`, sem `structure` |
| 500 | IMPORT_TABLE_ERROR | Erro interno |

## Testes
- Unit: `export-table.use-case.spec.ts`, `import-table.use-case.spec.ts`
