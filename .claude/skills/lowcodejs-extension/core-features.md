# Catálogo de Features do Core

**Não recrie features que já existem no core.** Use esta lista antes de propor
qualquer extensão. Se houver match, primeiro pergunte ao usuário se quer
estender, customizar ou criar uma variação — não duplicar.

## Tabelas dinâmicas

| Feature | Onde vive | O que faz |
|---------|-----------|-----------|
| CRUD de tabelas | `routes/_private/tables/`, `backend/application/resources/table-base/` | Criar, listar, atualizar, deletar tabelas |
| Visualizações | `components/common/table-views/` (9 tipos) | LIST, GALLERY, DOCUMENT, CARD, MOSAIC, KANBAN, FORUM, CALENDAR, GANTT |
| Campos dinâmicos | 14 tipos em `E_FIELD_TYPE` | Já cobre texto, dropdown, data, relacionamento, arquivo, grupo, reação, avaliação, categoria, usuário |
| Hooks de script | `application/core/table/` | beforeSave / afterSave / onLoad em VM Node |
| Filtros | `components/common/filters/` | Sistema dinâmico de filtros por field |
| Paginação | `components/common/pagination.tsx` | Paginação universal |

## Linhas (rows)

| Feature | Onde vive |
|---------|-----------|
| CRUD de rows | `backend/application/resources/table-rows/` |
| Soft delete + lixeira | Padrão do projeto (`trashed`, `trashedAt`) |
| Bulk trash/restore/delete | `bulk-trash`, `bulk-restore` use-cases |
| Reactions/Evaluations | E_FIELD_TYPE.REACTION, E_FIELD_TYPE.EVALUATION |

## Import / Export

| Feature | Endpoint / Arquivo |
|---------|--------------------|
| Export CSV de rows | `useTableRowsExportCsv()` + `ExportCsvButton` |
| Export/Import tabela JSON (extensão TOOL) | `core/tools/tables-import-export` (`POST /tools/export-table`, `POST /tools/import-table`) |
| Clone tabela (extensão TOOL) | `core/tools/clone-table` (`POST /tools/clone-table`) |

## Storage / Arquivos

| Feature | Onde vive |
|---------|-----------|
| Upload de arquivos | `components/common/file-upload/`, `POST /storage` |
| Local + S3 driver | `Flydrive` em `config/storage.config.ts` |
| Migração entre drivers | `backend/application/resources/storage-migration/` |

## Auth + RBAC

| Feature | Onde vive |
|---------|-----------|
| Sign in / sign up / magic link | `application/resources/authentication/` |
| Reset password | `request-code`, `validate-code`, `reset-password` |
| 4 roles | `MASTER` > `ADMINISTRATOR` > `MANAGER` > `REGISTERED` |
| 12 permissões granulares | `E_TABLE_PERMISSION` |
| Visibilidade de tabela | `E_TABLE_VISIBILITY` (PUBLIC, FORM, OPEN, RESTRICTED, PRIVATE) |

## Menus + navegação

| Feature | Onde vive |
|---------|-----------|
| CRUD de menus | `routes/_private/menus/` |
| Hierarquia (parent/children) | `IMenu.parent` |
| 6 tipos de menu | `TABLE`, `PAGE`, `FORM`, `EXTERNAL`, `SEPARATOR`, `EXTENSION_MODULE` |
| Sidebar dinâmica | `useMenuDynamic` + `Sidebar` |
| Páginas HTML custom | tipo `PAGE` (use isto antes de criar MODULE simples) |

## Settings

| Feature | Onde vive |
|---------|-----------|
| Configurações globais | `routes/_private/settings/`, modelo Setting |
| Branding (logos, system name) | Setting |
| SMTP, OpenAI key | Setting |

## Dashboard

| Feature | Onde vive |
|---------|-----------|
| Dashboard nativo | `routes/_private/dashboard/` (MASTER only) |

## Chat / IA

| Feature | Onde vive |
|---------|-----------|
| Chat com IA + tools MCP | `useChatSocket` + `chat.socket.ts` |
| Lazy load de mensagens | já implementado |

## Greps recomendados

```bash
# Antes de criar plugin de export
grep -rni "export" frontend/src/components/common/

# Antes de criar plugin de filtro
grep -rni "filter" frontend/src/components/common/filters/

# Antes de criar tool
ls backend/extensions/*/tools/

# Antes de criar dashboard
ls frontend/src/routes/_private/dashboard/

# Antes de mexer em auth
ls backend/application/resources/authentication/

# Antes de criar uma página simples (HTML estático)
# → use tipo PAGE do menu (CRUD em /menus/create), NÃO crie MODULE
```

## Sinalize ao usuário

Se a feature pedida pode ser feita com:
- **Tipo `PAGE` do menu** (HTML estático) → sugira isso, evita criar MODULE
- **Hook beforeSave/afterSave** (script no campo) → evita criar plugin
- **Visualização existente** (KANBAN, CALENDAR, etc.) → configure a tabela,
  não crie módulo
- **Permissão granular** → ajustar grupo do usuário, não criar extensão
- **Workshop > escopo por tabela** (já existente) → o plugin pode ser
  scopado por tabela sem código adicional

Sempre pergunte antes de assumir que precisa de extensão nova.
