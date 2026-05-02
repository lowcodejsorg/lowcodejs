# Lib - Utilitarios, Tipos e Configuracao Compartilhados

Diretorio central de utilitarios, tipos TypeScript, schemas Zod, constantes de
dominio e configuracoes de infraestrutura (Axios, TanStack Query). Consumido por
toda a aplicacao frontend.

## Arquivos

| Arquivo                    | Descricao                                                                                                                                                                                                                          |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.ts`                   | Instancia Axios com interceptors: request (resolve baseURL via server function, injeta cookies SSR), response (401 dispara refresh transparente com lock anti-thundering-herd e retenta a request original; so limpa auth + redireciona se o refresh falhar)                                                                                       |
| `calendar-helpers.ts`      | Resolucao de campos de calendario (layoutFields com fallback), normalizacao de eventos (datas, cores, participantes), formatacao de intervalos de tempo                                                                            |
| `constant.ts`              | Enums do dominio (`E_FIELD_TYPE`, `E_FIELD_FORMAT`, `E_ROLE`, `E_TABLE_STYLE`, `E_TABLE_VISIBILITY`, `E_TABLE_PERMISSION`, etc.), arrays de options para selects, mappers de labels, regex de validacao, eventos de chat Socket.IO |
| `document-helpers.ts`      | Helpers para visualizacao documento: resolucao de blocos titulo/corpo, ordenacao por categoria, mapa de profundidade/labels, filtragem de rows por categoria                                                                       |
| `field-masks.ts`           | Mascaras de input para formatos brasileiros (telefone, CPF, CNPJ), resolucao de inputType e inputMode por formato de campo                                                                                                         |
| `form-utils.ts`            | `createFieldErrorSetter()` - seta erros programaticamente em campos TanStack Form (meta + errorMap)                                                                                                                                |
| `forum-helpers.ts`         | Normalizacao de valores para forum: stripHtml, normalizeId/IdList/UserList/StorageList, parse/serialize de reactions, normalizacao de valores de grupo                                                                             |
| `get-api-config.ts`        | Server functions (TanStack Start) que retornam `VITE_API_BASE_URL` e `SERVER_URL` do env validado                                                                                                                                  |
| `handle-api-error.ts`      | Tratamento padronizado de erros Axios: mapeia causes do backend para toasts, suporta handlers customizados por cause e propagacao de erros de campo                                                                                |
| `interfaces.ts`            | Tipos principais do dominio: `IUser`, `ITable`, `IField`, `IRow`, `IMenu`, `IStorage`, `ISetting`, `Meta` (paginacao), `Paginated<T>`, utility types (`Optional`, `Merge`, `ValueOf`)                                              |
| `kanban-helpers.ts`        | Helpers para Kanban: busca de campos por slug/tipo, normalizacao de valores de row, iniciais de usuario, progresso, estilizacao de colunas por cor, build de payload/defaults                                                      |
| `kanban-types.ts`          | Tipo `FieldMap` - mapeamento de campos semanticos do template Kanban (title, description, members, tasks, etc.)                                                                                                                    |
| `layout-field-resolver.ts` | `resolveLayoutField()` - resolve campo por ID configurado em layoutFields, com fallback para primeiro campo do tipo esperado                                                                                                       |
| `layout-pickers.ts`        | `HeaderFilter` e `HeaderSorter` - filtro de campos visiveis em lista e ordenacao por fieldOrderList                                                                                                                                |
| `payloads.ts`              | DTOs tipados para todas as requisicoes API: autenticacao, CRUD de usuarios/grupos/menus/tabelas/campos/rows, perfil, settings, query params com ordenacao                                                                          |
| `query-client.ts`          | Instancia TanStack QueryClient: retry false, refetchOnWindowFocus true, staleTime 1 hora                                                                                                                                           |
| `schemas.ts`               | Schemas Zod compartilhados: autenticacao, usuarios, grupos, menus, tabelas, campos (com sub-schemas de relationship/dropdown/category), rows, perfil, settings                                                                     |
| `seo.ts`                   | `createRouteHead()` - gera meta tags (title, OG, Twitter) integrando com systemName do root loader                                                                                                                                 |
| `table-style.ts`           | Deteccao de templates (isForumTemplate, isKanbanTemplate, isCalendarTemplate) e calculo de estilos de visualizacao permitidos por tabela                                                                                           |
| `table.ts`                 | Utilitarios centrais de tabela: build de default values (create/update), montagem de payload para API, validacao de campos por tipo/formato com regex                                                                              |
| `tanstack-table.d.ts`      | Extensao de tipos do TanStack Table: `ColumnMeta` (label, field) e `TableMeta` (slug, persistKey)                                                                                                                                  |
| `toast.ts`                 | Wrappers para Sonner: `toastSuccess`, `toastError`, `toastInfo`, `toastWarning` com estilo padronizado                                                                                                                             |
| `utils.ts`                 | `cn()` - composicao de classes CSS via clsx + tailwind-merge                                                                                                                                                                       |
| `validation.ts`            | Validadores composiveis para TanStack Form: `requiredString`, `maxLength`, `minLength`, `validEmail`, `validUrl`, `compose()`                                                                                                      |

## Subdiretorios

| Diretorio | Descricao                                                                   |
| --------- | --------------------------------------------------------------------------- |
| `menu/`   | Sistema de menu, RBAC e permissoes por role (possui CLAUDE.md proprio)      |
| `server/` | Server functions para autenticacao e cookies SSR (possui CLAUDE.md proprio) |

## Padroes Principais

### Cliente HTTP (Axios)

A instancia `API` em `api.ts` e o unico ponto de acesso ao backend. O request
interceptor resolve a baseURL via server function (evita expor env vars no
client) e injeta cookies automaticamente em contexto SSR.

O response interceptor trata 401 com renovacao transparente:
- Captura 401, dispara `POST /authentication/refresh-token` (uma unica chamada
  mesmo com varias requests paralelas falhando — usa lock global), e em sucesso
  reenvia a request original com a mesma config
- So limpa o Zustand + redireciona para `/` se o refresh tambem falhar (refresh
  token expirado ou revogado)
- Pula refresh em SSR (`typeof window === 'undefined'`) e em endpoints de auth
  (`/sign-in`, `/sign-up`, `/sign-out`, `/refresh-token`) para evitar loops
- Marca a config com `_retried` para evitar segundo retry

### TanStack Query

O `QueryClient` em `query-client.ts` e instanciado uma unica vez e injetado no
TanStack Router como context. Configuracao: sem retry, staleTime de 1 hora,
refetch ao focar janela.

### Sistema de Tipos

Tres camadas complementares:

- **`constant.ts`** - Enums como objetos `as const` (padrao do projeto, nao usa
  `enum` do TS). Inclui arrays de options para selects com labels em portugues.
- **`interfaces.ts`** - Tipos de dominio que referenciam os enums via
  `ValueOf<typeof E_*>`. Tipo base `Base` com `_id`, timestamps e soft delete.
  `Merge` e `Optional` como utility types.
- **`payloads.ts`** - DTOs separados para cada operacao de API (create, update,
  query). Nao usa inferencia de Zod (exceto `RowData`), tipos sao manuais para
  clareza.

### Validacao

Dois sistemas coexistem:

- **`schemas.ts`** (Zod) - Schemas para validacao de formularios via integracao
  TanStack Form + Zod. Usado nos formularios de CRUD de entidades.
- **`validation.ts`** - Validadores simples e composiveis (`compose()`) para
  campos individuais no TanStack Form. Retornam `{ message }` ou `undefined`.
- **`table.ts`** (`buildFieldValidator`) - Validacao dinamica baseada no tipo e
  formato do campo (IField). Usa regex para formatos brasileiros (CPF, CNPJ,
  telefone).

### Helpers de Visualizacao

Cada estilo de tabela (calendar, document, forum, kanban) possui helpers
dedicados que resolvem campos semanticos via `layoutFields` configurado na
tabela, com fallback por slug ou tipo. O `layout-field-resolver.ts` centraliza
essa logica de resolucao.
