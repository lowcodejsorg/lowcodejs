# Tables Import/Export (extensão `core/tools/tables-import-export`)

Tool unificada que expõe dois endpoints para **exportar e importar múltiplas
tabelas** preservando relacionamentos e itens de menu. Antes era recurso
`/tools/{export,import}-table` do core; foi migrado para extensão como TOOL
única (uma página com 2 seções: Importar e Exportar).

## Acesso UI

`/tools/core/tables-import-export` — submenu **Ferramentas** na sidebar (uma
única página com cards de Importar e Exportar lado a lado).

## Endpoints

| Endpoint | Método | bodyLimit | Descrição |
|----------|--------|-----------|-----------|
| `/tools/export-table` | POST | default | Exporta uma ou mais tabelas (estrutura e/ou dados) + itens de menu vinculados em JSON v2 |
| `/tools/import-table` | POST | 50 MB | Recria as tabelas, dados (com remapeamento de relacionamentos) e menus a partir de um JSON v1 ou v2 |

Ambos blindados por `ExtensionActiveMiddleware({ pkg: 'core', type: TOOL,
extensionId: 'tables-import-export' })` — desativar a tool em `/extensions`
desliga ambos os endpoints.

## Formato do arquivo (v2)

```jsonc
{
  "header": {
    "version": "2.0",
    "platform": "lowcodejs",
    "tableName": "Clientes",          // nome da primeira tabela (compat)
    "tableSlug": "clientes",
    "exportedBy": "user@example.com",
    "exportedAt": "2026-05-13T...",
    "exportType": "full",
    "tablesCount": 2,
    "menusCount": 3
  },
  "tables": [
    {
      "structure": { /* campos, grupos, fieldOrder, layoutFields, methods */ },
      "data": {
        "totalRows": 10,
        "rows": [
          { "_originalId": "abc...", "nome": "Acme", "produtos": ["xyz...", "..."] }
        ]
      }
    }
  ],
  "menus": [
    {
      "_originalId": "...",
      "name": "Vendas",
      "slug": "vendas",
      "type": "SEPARATOR",
      "parent": null,
      "tableSlug": null,
      "url": null,
      "html": null,
      "order": 0,
      "isInitial": false,
      "extension": null
    },
    {
      "_originalId": "...",
      "parent": "...",            // _originalId do menu pai (resolvido na importação)
      "type": "TABLE",
      "tableSlug": "clientes",     // resolve para o ID novo após import
      "slug": "menu-clientes",
      "name": "Clientes",
      ...
    }
  ]
}
```

Arquivos v1 (single-table, com `structure` e `data` no topo) continuam
suportados na importação — internamente são normalizados para o formato v2.

## Export

### Validator
`ExportTableValidator`:
- `slugs: string[]` (preferido) **ou** `slug: string` (legado)
- `exportType: 'structure' | 'data' | 'full'`
- `acknowledgeMissingRelationships: boolean` (default `false`)

### Fluxo
1. Auth + `ExtensionActiveMiddleware`
2. Resolve todas as tabelas pelos slugs; falha com `TABLE_NOT_FOUND` se faltar
   alguma
3. Detecta tabelas referenciadas em campos `RELATIONSHIP` (top-level e dentro
   de field groups) que **não** estão na seleção
4. Se houver e `acknowledgeMissingRelationships !== true`, retorna 400
   `MISSING_RELATED_TABLES` com a lista — o frontend mostra o aviso e
   oferece "Voltar para ajustar" ou "Exportar mesmo assim"
5. Para cada tabela: monta `structure` (quando `structure|full`) e/ou `data`
   (quando `data|full`)
   - **Relacionamentos são preservados**: campos RELATIONSHIP exportam os
     IDs originais para serem remapeados na importação
   - Campos referenciais que NÃO viajam: `FILE`, `USER`, `EVALUATION`,
     `REACTION`, `CREATOR`
   - Cada row carrega `_originalId` para o remapeamento
6. Coleta menus que apontam para qualquer tabela selecionada e sobe a árvore
   de pais até o topo. Ancestrais cujo `type=TABLE|FORM` aponta para tabelas
   fora do pacote são exportados como `SEPARATOR`

### Erros
| Code | Cause | Quando |
|------|-------|--------|
| 400 | TABLE_SLUG_REQUIRED | Nenhum slug informado |
| 404 | TABLE_NOT_FOUND | Algum slug não corresponde a uma tabela |
| 400 | MISSING_RELATED_TABLES | Há tabelas referenciadas fora da seleção e `acknowledge` é `false`. `errors.missingTables` traz a lista separada por vírgula |
| 500 | EXPORT_TABLE_ERROR | Erro interno |

## Import

### Validator
`ImportTableValidator`: `fileContent` (objeto loose), `name` (string, opcional,
máx 40 chars) — usado apenas em pacotes single-table para renomear a primeira
tabela.

### Fluxo
1. Auth + `ExtensionActiveMiddleware` (bodyLimit 50 MB)
2. Valida `header.platform === 'lowcodejs'`
3. Normaliza v1 → v2 internamente
4. **Detecta conflitos antes de qualquer escrita**: slugs de tabelas (vs.
   tabelas existentes não-trashed) **e** slugs de menus (vs. menus
   existentes não-trashed). Se houver, aborta com `IMPORT_CONFLICTS` (ou,
   no caso single-table com apenas conflito de tabela, mantém o código
   legado `TABLE_SLUG_ALREADY_EXISTS`)
5. **Fase A — esqueleto das tabelas**: cria fields nativos + top-level +
   grupos. `relationship` para tabelas **dentro do pacote** fica `null`
   nesta fase. `relationship` para tabelas **fora do pacote** é resolvido
   contra o DB atual
6. **Fase B — relacionamentos do pacote**: agora que todas as tabelas existem,
   atualiza fields cujo relationship apontava para outro item do pacote (usando
   os novos `tableId`/`fieldId`)
7. **Fase C — inserção de rows**: por tabela, insere cada row removendo os
   campos RELATIONSHIP (e os de subrows dos field groups). Constrói
   `rowIdMap[originalSlug][_originalId] = newId`
8. **Fase D — backfill de relacionamentos**: percorre as rows e faz `update`
   substituindo os IDs originais pelos novos via `rowIdMap`. IDs cuja tabela
   referenciada não veio no pacote são mantidos como estão
9. **Fase E — menus**: cria em ordem topológica (pais antes dos filhos),
   resolvendo `tableSlug → novo tableId` e `parent → novo parentId`. Menus
   `TABLE/FORM` que apontam para tabelas ausentes viram `SEPARATOR`

### Erros
| Code | Cause | Quando |
|------|-------|--------|
| 400 | OWNER_ID_REQUIRED | Owner ausente (não deveria com auth) |
| 400 | INVALID_PLATFORM | header.platform diferente de "lowcodejs" |
| 400 | TABLE_SLUG_ALREADY_EXISTS | Slug da tabela já existe (single-table) |
| 400 | IMPORT_CONFLICTS | Conflitos detectados (multi-table OU menu). `errors.tables` e `errors.menus` trazem listas |
| 400 | STRUCTURE_REQUIRED | Arquivo sem `structure` (em nenhuma tabela) |
| 500 | IMPORT_TABLE_ERROR | Erro interno |

### Resposta
```jsonc
{
  "tableId": "...",        // primeira tabela (compat)
  "slug": "...",
  "importedFields": 12,
  "importedRows": 30,
  "importedMenus": 3,
  "tables": [
    { "tableId": "...", "slug": "clientes", "name": "Clientes" },
    { "tableId": "...", "slug": "pedidos",  "name": "Pedidos"  }
  ]
}
```

## Testes
- Unit: `export-table.use-case.spec.ts`, `import-table.use-case.spec.ts`
  (cobertura inclui detecção de relationships ausentes, exportação de menus
  com ancestrais, conflitos de slug multi-recurso, importação v1/v2)
