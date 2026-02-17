# Recurso: Tools

O recurso **Tools** fornece ferramentas utilitarias para operacoes avancadas no sistema. Atualmente, contem o endpoint de clonagem de tabelas.

---

## Endpoints

| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| POST | `/tools/clone-table` | Sim | Clonar tabela |

---

## Arquitetura

```
resources/tools/
  clone-table/
    clone-table.controller.ts
    clone-table.validator.ts
    clone-table.use-case.ts
    clone-table.schema.ts
    clone-table.types.ts
    clone-table.constants.ts
    templates/
      kanban-template.ts
      cards-template.ts
      mosaic-template.ts
      document-template.ts
      forum-template.ts
      media-helpers.ts
```

---

## Clonar Tabela

**`POST /tools/clone-table`**

Cria uma copia completa de uma tabela existente ou gera uma nova tabela a partir de um template predefinido. O endpoint e utilizado para criar novas tabelas baseadas em modelos.

### Autenticacao

A autenticacao e obrigatoria (`AuthenticationMiddleware` com `optional: false`). O ID do usuario autenticado e utilizado como `ownerId` da nova tabela.

### Body

```json
{
  "baseTableId": "507f1f77bcf86cd799439011",
  "name": "Minha Nova Tabela"
}
```

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `baseTableId` | string | Sim | ID da tabela base ou ID de template predefinido |
| `name` | string | Sim | Nome da nova tabela (max 40 caracteres) |

### Validacao do Nome

O campo `name` possui as seguintes restricoes:

- Minimo de 1 caractere
- Maximo de 40 caracteres
- Caracteres permitidos: letras (incluindo acentuadas e c cedilha), numeros, espacos, hifen e underscore
- Regex: `/^[a-zA-ZáàâãéèêíïóôõöúçÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ0-9\s\-_]+$/`

### Templates Predefinidos

Se `baseTableId` corresponder a um ID de template predefinido, o sistema cria a tabela a partir de um template em vez de clonar uma tabela existente:

| ID do Template | Tipo | Descricao |
|----------------|------|-----------|
| `KANBAN_TEMPLATE` | Kanban | Tabela de tarefas com colunas de status |
| `CARDS_TEMPLATE` | Cards | Tabela com layout de cards |
| `MOSAIC_TEMPLATE` | Mosaico | Tabela com layout de mosaico |
| `DOCUMENT_TEMPLATE` | Documento | Tabela com indice de documentos |
| `FORUM_TEMPLATE` | Forum | Tabela de canais e mensagens |

Cada template possui sua propria funcao de criacao (ex: `createKanbanTemplate`, `createForumTemplate`) que define campos, grupos e schema especificos.

### Fluxo de Clonagem (Tabela Existente)

Quando `baseTableId` e um ObjectID valido (nao template), o fluxo e:

```
1. Valida que ownerId esta presente
2. Busca a tabela base pelo ID
3. Gera novo slug via slugify(name)
4. Cria campos nativos (trashed, trashedAt, creator, createdAt)
5. Clona campos nao-nativos (preservando todas as configuracoes)
6. Constroi mapa de IDs antigos -> novos (fieldIdMap)
7. Clona grupos (FIELD_GROUP) com seus campos internos
8. Reconstroi o _schema via buildSchema()
9. Remapeia fieldOrderList e fieldOrderForm com novos IDs
10. Cria a nova tabela com todos os dados copiados
11. Retorna a tabela criada e o mapa de IDs
```

### Campos Copiados por Campo

Para cada campo nao-nativo, os seguintes atributos sao copiados:

| Atributo | Descricao |
|----------|-----------|
| `name` | Nome do campo |
| `slug` | Slug do campo |
| `type` | Tipo do campo |
| `required` | Se e obrigatorio |
| `multiple` | Se aceita multiplos valores |
| `format` | Formato de validacao |
| `showInList` | Exibir na listagem |
| `showInForm` | Exibir no formulario |
| `showInDetail` | Exibir no detalhe |
| `showInFilter` | Exibir no filtro |
| `defaultValue` | Valor padrao |
| `locked` | Se esta bloqueado |
| `relationship` | Configuracao de relacionamento |
| `dropdown` | Opcoes de dropdown |
| `category` | Opcoes de categoria |
| `group` | Configuracao de grupo |
| `widthInForm` | Largura no formulario |
| `widthInList` | Largura na listagem |

### Dados Copiados da Tabela

| Atributo | Descricao |
|----------|-----------|
| `name` | Novo nome (informado no payload) |
| `slug` | Novo slug (gerado a partir do nome) |
| `description` | Descricao da tabela base |
| `type` | Tipo da tabela |
| `style` | Estilo visual (TABLE, KANBAN, CARDS, etc.) |
| `visibility` | Configuracao de visibilidade |
| `collaboration` | Configuracao de colaboracao |
| `administrators` | Administradores da tabela base |
| `methods` | Middlewares (beforeSave, afterSave) |
| `fieldOrderList` | Ordem dos campos na listagem (remapeada) |
| `fieldOrderForm` | Ordem dos campos no formulario (remapeada) |
| `groups` | Grupos de campos (clonados) |
| `_schema` | Schema Mongoose (reconstruido) |

> Os registros (rows) da tabela **nao** sao copiados. Apenas a estrutura (campos, schema, configuracao) e clonada.

### Resposta de Sucesso (201)

```json
{
  "tableId": "507f1f77bcf86cd799439099",
  "slug": "minha-nova-tabela",
  "fieldIdMap": {
    "507f1f77bcf86cd799439011": "507f1f77bcf86cd799439051",
    "507f1f77bcf86cd799439012": "507f1f77bcf86cd799439052",
    "507f1f77bcf86cd799439013": "507f1f77bcf86cd799439053"
  }
}
```

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `tableId` | string | ID da nova tabela criada |
| `slug` | string | Slug da nova tabela |
| `fieldIdMap` | Record<string, string> | Mapa de IDs: campo original -> campo clonado |

O `fieldIdMap` e util para o frontend remapear referencias e configuracoes que dependem de IDs de campos especificos.

### Codigos de Erro

| Codigo | Cause | Descricao |
|--------|-------|-----------|
| 400 | OWNER_ID_REQUIRED | ID do proprietario nao encontrado (usuario nao autenticado) |
| 404 | TABLE_NOT_FOUND | Tabela base nao encontrada |
| 500 | CLONE_TABLE_ERROR | Erro interno na clonagem |

---

## Clonagem de Grupos (FIELD_GROUP)

Quando a tabela base possui campos do tipo FIELD_GROUP, o processo de clonagem tambem replica os grupos e seus campos internos:

1. Para cada grupo da tabela base, percorre os campos internos
2. Se o campo ja foi clonado (existe no `fieldIdMap`), reutiliza
3. Se nao, cria um novo campo e adiciona ao mapa
4. Reconstroi o `_schema` do grupo via `buildSchema()`

```typescript
clonedGroups.push({
  slug: group.slug,
  name: group.name,
  fields: groupFields,
  _schema: buildSchema(groupFields),
});
```
