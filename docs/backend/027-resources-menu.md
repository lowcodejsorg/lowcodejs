# Recurso: Menu

O recurso **Menu** gerencia os itens de menu da aplicacao. O menu e uma estrutura hierarquica que organiza o acesso a tabelas, paginas, formularios e links externos.

---

## Endpoints

| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| GET | `/menu/paginated` | Sim | Lista paginada |
| GET | `/menu` | Sim | Lista completa |
| GET | `/menu/:_id` | Sim | Detalhes de um item |
| POST | `/menu` | Sim | Criar item de menu |
| PATCH | `/menu/:_id` | Sim | Atualizar item |
| DELETE | `/menu/:_id` | Sim | Deletar item |

> Todos os endpoints requerem autenticacao (`AuthenticationMiddleware` com `optional: false`).

---

## Arquitetura

```
resources/menu/
  paginated/    # GET /menu/paginated
  list/         # GET /menu
  show/         # GET /menu/:_id
  create/       # POST /menu
  update/       # PATCH /menu/:_id
  delete/       # DELETE /menu/:_id
```

---

## Tipos de Menu (`E_MENU_ITEM_TYPE`)

| Tipo | Descricao | Campos Requeridos |
|------|-----------|-------------------|
| `TABLE` | Link para uma tabela | `table` (ID da tabela) |
| `FORM` | Link para formulario de criacao | `table` (ID da tabela) |
| `PAGE` | Pagina com conteudo HTML | `html` (conteudo) |
| `EXTERNAL` | Link externo | `url` (endereco) |
| `SEPARATOR` | Agrupador de subitens | Nenhum adicional |

---

## Hierarquia de Menu

O menu suporta hierarquia via campo `parent` (auto-referencia). Quando um item e adicionado como filho de outro:

1. Se o pai **nao** e do tipo `SEPARATOR`, o sistema automaticamente:
   - Cria uma copia do item pai como filho de si mesmo
   - Converte o pai original em `SEPARATOR`
2. O slug do filho e gerado concatenando o slug do item com o slug do pai

```
// Antes: pai "relatorios" do tipo TABLE
relatorios (TABLE)

// Depois de adicionar filho "vendas":
relatorios-separator (SEPARATOR)
  ├── relatorios (TABLE)     <- copia do pai original
  └── vendas-relatorios (TABLE)  <- novo filho
```

---

## Listagem Paginada

**`GET /menu/paginated`**

### Query Parameters

| Parametro | Tipo | Padrao | Descricao |
|-----------|------|--------|-----------|
| `page` | number | 1 | Numero da pagina |
| `perPage` | number | 50 | Itens por pagina |
| `search` | string | - | Termo de busca |

### Resposta de Sucesso (200)

```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Usuarios",
      "slug": "usuarios",
      "type": "TABLE",
      "table": "507f1f77bcf86cd799439012",
      "url": "/tables/usuarios",
      "parent": null
    }
  ],
  "meta": {
    "total": 10,
    "perPage": 50,
    "page": 1,
    "lastPage": 1,
    "firstPage": 1
  }
}
```

---

## Lista Completa

**`GET /menu`**

Retorna todos os itens de menu sem paginacao. Utilizado para renderizar o menu completo na interface.

---

## Detalhes

**`GET /menu/:_id`**

### Parametros

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `_id` | string | ID do item de menu |

### Resposta de Sucesso (200)

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Usuarios",
  "slug": "usuarios",
  "type": "TABLE",
  "table": "507f1f77bcf86cd799439012",
  "url": "/tables/usuarios",
  "html": null,
  "parent": null,
  "trashed": false,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

---

## Criar Item

**`POST /menu`**

### Body

```json
{
  "name": "Relatorios",
  "type": "TABLE",
  "table": "507f1f77bcf86cd799439012",
  "parent": null
}
```

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `name` | string | Sim | Nome do item |
| `type` | string | Sim | Tipo do item (TABLE, FORM, PAGE, EXTERNAL, SEPARATOR) |
| `table` | string/null | Condicional | ID da tabela (obrigatorio para TABLE e FORM) |
| `parent` | string/null | Nao | ID do item pai para hierarquia |
| `url` | string/null | Condicional | URL (obrigatoria para EXTERNAL) |
| `html` | string/null | Condicional | Conteudo HTML (obrigatorio para PAGE) |

> O `slug` e gerado automaticamente a partir do `name` via `slugify()`.

### Geracao Automatica de URL

O campo `url` e gerado automaticamente com base no tipo:

| Tipo | URL Gerada |
|------|-----------|
| TABLE | `/tables/{table-slug}` |
| FORM | `/tables/{table-slug}/row/create` |
| PAGE | `/pages/{menu-slug}` |
| EXTERNAL | Valor informado no campo `url` |

### Validacoes

- Para tipo `EXTERNAL`: campo `url` e obrigatorio
- Para tipo `PAGE`: campo `html` e obrigatorio
- Para tipo `TABLE` / `FORM`: campo `table` e obrigatorio e deve referenciar uma tabela existente
- Verifica unicidade de slug (nao permite duplicatas)
- Verifica existencia do menu pai quando informado

### Codigos de Erro

| Codigo | Cause | Descricao |
|--------|-------|-----------|
| 400 | INVALID_PARAMETERS | Parametros invalidos (ex: TABLE sem `table`) |
| 404 | PARENT_MENU_NOT_FOUND | Menu pai nao encontrado |
| 404 | TABLE_NOT_FOUND | Tabela referenciada nao encontrada |
| 409 | MENU_ALREADY_EXISTS | Menu com mesmo slug ja existe |
| 500 | CREATE_MENU_ERROR | Erro interno |

### Resposta de Sucesso (201)

Retorna o item de menu criado.

---

## Atualizar Item

**`PATCH /menu/:_id`**

### Parametros

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `_id` | string | ID do item de menu |

### Body

Aceita os mesmos campos da criacao. Todos os campos sao opcionais (atualizacao parcial). A logica de geracao automatica de URL e conversao de pai para SEPARATOR tambem se aplica na atualizacao.

### Validacoes Adicionais

- Verifica que o menu nao referencia a si mesmo como pai
- Verifica unicidade de slug ao alterar nome ou pai
- Mantem logica de conversao de pai para SEPARATOR

### Codigos de Erro

| Codigo | Cause | Descricao |
|--------|-------|-----------|
| 400 | INVALID_PARAMETERS | Parametros invalidos ou auto-referencia |
| 404 | MENU_NOT_FOUND | Item de menu nao encontrado |
| 404 | PARENT_MENU_NOT_FOUND | Menu pai nao encontrado |
| 404 | TABLE_NOT_FOUND | Tabela referenciada nao encontrada |
| 409 | MENU_ALREADY_EXISTS | Menu com mesmo slug ja existe |
| 500 | UPDATE_MENU_ERROR | Erro interno |

### Resposta de Sucesso (200)

Retorna o item de menu atualizado.

---

## Deletar Item

**`DELETE /menu/:_id`**

### Parametros

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `_id` | string | ID do item de menu |

### Codigos de Erro

| Codigo | Cause | Descricao |
|--------|-------|-----------|
| 404 | MENU_NOT_FOUND | Item de menu nao encontrado |
| 500 | DELETE_MENU_ERROR | Erro interno |

### Resposta de Sucesso (200)

Retorna `null` no body.

---

## Modelo de Dados

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `_id` | ObjectId | Identificador unico |
| `name` | string | Nome do item |
| `slug` | string | Slug unico (gerado automaticamente) |
| `type` | E_MENU_ITEM_TYPE | Tipo do item |
| `table` | ObjectId/null | Referencia a tabela (para TABLE/FORM) |
| `parent` | ObjectId/null | Referencia ao item pai (hierarquia) |
| `url` | string/null | URL do item |
| `html` | string/null | Conteudo HTML (para PAGE) |
| `trashed` | boolean | Se esta na lixeira |
| `createdAt` | Date | Data de criacao |
| `updatedAt` | Date | Data de atualizacao |
