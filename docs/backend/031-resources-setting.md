# Recurso: Setting

O recurso **Setting** gerencia as configuracoes globais da aplicacao. Utiliza um padrao de documento unico (singleton) no MongoDB -- apenas um documento de configuracoes existe no banco.

---

## Endpoints

| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| GET | `/setting` | Opcional | Exibir configuracoes |
| PUT | `/setting` | Sim | Atualizar configuracoes |

---

## Arquitetura

```
resources/setting/
  show/      # GET /setting
  update/    # PUT /setting
```

O repositorio `SettingContractRepository` possui metodos especificos para o padrao singleton:

- `get()`: retorna o documento unico de configuracoes
- `update(payload)`: atualiza o documento unico (com `upsert`)

---

## Exibir Configuracoes

**`GET /setting`**

### Autenticacao

A autenticacao e opcional (`AuthenticationMiddleware` com `optional: true`), permitindo que o frontend carregue configuracoes basicas antes do login.

### Comportamento

1. Busca o documento de configuracoes no banco de dados
2. Se nao existir documento, retorna os valores das variaveis de ambiente (`process.env`)
3. O campo `FILE_UPLOAD_ACCEPTED` e convertido de string separada por `;` para array
4. O campo `MODEL_CLONE_TABLES` inclui templates predefinidos (builtin) + tabelas configuradas pelo usuario

### Templates Predefinidos (Builtin)

Os seguintes templates sao sempre incluidos em `MODEL_CLONE_TABLES`, independente da configuracao do banco:

| ID | Nome | Slug | Descricao |
|----|------|------|-----------|
| `KANBAN_TEMPLATE` | Kanban (Tarefas) | kanban-tarefas | Modelo predefinido de tarefas em Kanban |
| `CARDS_TEMPLATE` | Cards | cards | Modelo predefinido para Cards |
| `MOSAIC_TEMPLATE` | Mosaico | mosaico | Modelo predefinido para Mosaico |
| `DOCUMENT_TEMPLATE` | Documento | documento | Modelo predefinido para documento por indice |
| `FORUM_TEMPLATE` | Forum | chat-forum | Modelo predefinido para canais e mensagens em forum |

### Resposta de Sucesso (200)

```json
{
  "LOCALE": "pt-br",
  "FILE_UPLOAD_MAX_SIZE": 10485760,
  "FILE_UPLOAD_ACCEPTED": [".jpg", ".png", ".pdf", ".webp"],
  "FILE_UPLOAD_MAX_FILES_PER_UPLOAD": 5,
  "PAGINATION_PER_PAGE": 50,
  "MODEL_CLONE_TABLES": [
    {
      "_id": "KANBAN_TEMPLATE",
      "name": "Kanban (Tarefas)",
      "slug": "kanban-tarefas",
      "description": "Modelo predefinido de tarefas em Kanban"
    },
    {
      "_id": "CARDS_TEMPLATE",
      "name": "Cards",
      "slug": "cards",
      "description": "Modelo predefinido para Cards"
    },
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Minha Tabela",
      "slug": "minha-tabela",
      "description": "Tabela customizada"
    }
  ],
  "LOGO_SMALL_URL": "/storage/12345678.webp",
  "LOGO_LARGE_URL": "/storage/87654321.webp",
  "EMAIL_PROVIDER_HOST": "smtp.gmail.com",
  "EMAIL_PROVIDER_PORT": 587,
  "EMAIL_PROVIDER_USER": "noreply@example.com",
  "EMAIL_PROVIDER_PASSWORD": "****"
}
```

### Codigos de Erro

| Codigo | Cause | Descricao |
|--------|-------|-----------|
| 500 | SETTINGS_READ_ERROR | Erro ao buscar configuracoes |

---

## Atualizar Configuracoes

**`PUT /setting`**

### Autenticacao

A autenticacao e obrigatoria (`AuthenticationMiddleware` com `optional: false`).

### Body

```json
{
  "LOCALE": "pt-br",
  "FILE_UPLOAD_MAX_SIZE": 10485760,
  "FILE_UPLOAD_ACCEPTED": ".jpg;.png;.pdf;.webp",
  "FILE_UPLOAD_MAX_FILES_PER_UPLOAD": 5,
  "PAGINATION_PER_PAGE": 50,
  "MODEL_CLONE_TABLES": ["507f1f77bcf86cd799439011"],
  "EMAIL_PROVIDER_HOST": "smtp.gmail.com",
  "EMAIL_PROVIDER_PORT": 587,
  "EMAIL_PROVIDER_USER": "noreply@example.com",
  "EMAIL_PROVIDER_PASSWORD": "senha-smtp",
  "LOGO_SMALL_URL": "/storage/12345678.webp",
  "LOGO_LARGE_URL": "/storage/87654321.webp"
}
```

### Campos e Validacao

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `LOCALE` | enum | Sim | Locale da aplicacao: `pt-br` ou `en-us` |
| `FILE_UPLOAD_MAX_SIZE` | number | Sim | Tamanho maximo de arquivo em bytes (min: 1) |
| `FILE_UPLOAD_ACCEPTED` | string | Sim | Extensoes aceitas separadas por `;` (ex: `.jpg;.png;.pdf`) |
| `FILE_UPLOAD_MAX_FILES_PER_UPLOAD` | number | Sim | Maximo de arquivos por upload (min: 1) |
| `PAGINATION_PER_PAGE` | number | Sim | Itens por pagina padrao (min: 1) |
| `MODEL_CLONE_TABLES` | string[] | Nao | Array de IDs de tabelas para clonar |
| `EMAIL_PROVIDER_HOST` | string | Sim | Host do servidor SMTP |
| `EMAIL_PROVIDER_PORT` | number | Sim | Porta do servidor SMTP (min: 1) |
| `EMAIL_PROVIDER_USER` | string | Sim | Usuario SMTP |
| `EMAIL_PROVIDER_PASSWORD` | string | Sim | Senha SMTP |
| `LOGO_SMALL_URL` | string/null | Nao | URL do logo pequeno |
| `LOGO_LARGE_URL` | string/null | Nao | URL do logo grande |

### Processamento do `MODEL_CLONE_TABLES`

Antes de salvar, o sistema filtra os IDs de templates predefinidos (builtin) do array `MODEL_CLONE_TABLES`, mantendo apenas ObjectIDs validos do MongoDB:

```typescript
payload.MODEL_CLONE_TABLES = payload.MODEL_CLONE_TABLES.filter(
  (id) => !BUILTIN_TEMPLATE_IDS.has(id) && mongoose.Types.ObjectId.isValid(id),
);
```

Os templates builtin (`KANBAN_TEMPLATE`, `CARDS_TEMPLATE`, `MOSAIC_TEMPLATE`, `DOCUMENT_TEMPLATE`) sao sempre incluidos automaticamente na leitura, independente de estarem salvos no banco.

### Sincronizacao com Variaveis de Ambiente

Apos salvar no banco, os valores atualizados sao sincronizados com `process.env`:

```typescript
for (const [key, value] of Object.entries(payload)) {
  process.env[key] = String(value);
}
```

### Resposta de Sucesso (200)

Retorna o documento de configuracoes atualizado, com `FILE_UPLOAD_ACCEPTED` convertido para array.

### Codigos de Erro

| Codigo | Cause | Descricao |
|--------|-------|-----------|
| 400 | INVALID_PAYLOAD_FORMAT | Erro de validacao Zod (campos invalidos) |
| 500 | SETTINGS_UPDATE_ERROR | Erro ao atualizar configuracoes |

---

## Padrao Singleton

O modelo Setting utiliza um padrao singleton: apenas um documento existe na collection. O repositorio implementa:

- `get()`: busca o unico documento (`findOne`)
- `update(payload)`: atualiza o unico documento (`findOneAndUpdate` com `upsert: true`)

Nao existem endpoints de criacao ou exclusao. O documento e criado automaticamente no primeiro `update` se nao existir (via `upsert`).
