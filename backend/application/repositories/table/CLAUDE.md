# Table Repository

Repositorio da entidade Table (tabelas dinamicas do low-code).

## Arquivos

| Arquivo | Descricao |
|---------|-----------|
| `table-contract.repository.ts` | Classe abstrata com interface e payload types |
| `table-mongoose.repository.ts` | Implementacao com Mongoose |
| `table-in-memory.repository.ts` | Implementacao em memoria para testes |

## Metodos

| Metodo | Retorno | Descricao |
|--------|---------|-----------|
| `create(payload)` | `ITable` | Cria tabela com schema, campos, metodos, visibilidade |
| `findBy(payload)` | `ITable \| null` | Busca por _id ou slug (exact flag) |
| `findMany(payload)` | `ITable[]` | Query com paginacao, search, filtros |
| `update(payload)` | `ITable` | Atualiza por _id (campos parciais) |
| `updateMany(payload)` | `void` | Atualiza multiplas tabelas por _ids (style, visibility, collaboration) |
| `delete(_id)` | `void` | Remove tabela |
| `count(payload)` | `number` | Conta tabelas matchando query |
| `renameSlug(old, new)` | `void` | Renomeia slug da colecao MongoDB |
| `dropCollection(slug)` | `void` | Remove colecao MongoDB inteira |
| `findByFieldIds(ids)` | `ITable[]` | Busca tabelas que contem determinados fields |

## Payloads

- `TableCreatePayload` - name, slug, _schema, description, logo, fields, type, style, visibility, collaboration, administrators, owner, fieldOrder, methods, groups, order, layoutFields
- `TableQueryPayload` - page, perPage, search, type, owner, trashed, _ids, visibility, sort
- `TableUpdateManyPayload` - _ids + data (style, visibility, collaboration)

## Comportamentos Unicos

- Entidade mais complexa do sistema com muitos campos de configuracao
- `renameSlug` e `dropCollection` operam diretamente na colecao MongoDB
- `findByFieldIds` permite busca reversa (quais tabelas usam um campo)
- Suporte a groups (IGroupConfiguration) e layoutFields
