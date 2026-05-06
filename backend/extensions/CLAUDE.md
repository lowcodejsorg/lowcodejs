# Extensions (backend)

Diretório canônico de extensões do LowCodeJS no backend. **Toda extensão é
declarada aqui** — o loader (`application/core/extensions/loader.ts`) varre
esta pasta no boot, valida cada `manifest.json` e faz upsert na collection
`extensions` do MongoDB. O frontend espelha apenas o código (`frontend/extensions/`),
mas a "fonte de verdade" para o registro no DB é este diretório.

## Tipos de extensão

| Tipo | Descrição | Exemplo | Onde aparece |
|------|-----------|---------|--------------|
| `PLUGIN` | Botão/widget pequeno injetado em um placeholder do core | "Exportar PDF", "Adicionar em lote" | Slot configurado no manifest (ex: `table.actions`) |
| `MODULE` | Tela/dashboard/formulário maior, com URL própria | Dashboard customizado, Homepage | URL default `/e/<pkg>/<id>` ou via Menu custom |
| `TOOL` | Utilitário do sistema, listado no submenu Ferramentas | Clonar tabela, Importar CSV | `/tools/<pkg>/<id>` + sublink na sidebar Ferramentas |

## Estrutura de pastas

```
backend/extensions/
└── <pkg>/                              ← nome do pacote (slug, ex: "core")
    ├── manifest.json                   ← (opcional) metadados do pacote
    ├── CLAUDE.md
    ├── plugins/
    │   └── <id>/
    │       ├── manifest.json           ← obrigatório (tipo=plugin)
    │       ├── controller.ts           ← opcional, se o plugin chamar API
    │       └── use-case.ts
    ├── modules/
    │   └── <id>/
    │       ├── manifest.json           ← obrigatório (tipo=module)
    │       └── controller.ts           ← opcional
    └── tools/
        └── <id>/
            ├── manifest.json           ← obrigatório (tipo=tool)
            └── controller.ts           ← opcional
```

A chave única no DB é o trio `(pkg, type, extensionId)`:

- `pkg` é o nome da pasta direto sob `extensions/`
- `type` é derivado da pasta intermediária (`plugins` → `PLUGIN`, etc.)
- `extensionId` é o nome da pasta da extensão **e** deve bater com `manifest.id`

## `manifest.json`

Schema Zod canônico em `backend/application/core/extensions/manifest.schema.ts`.
Um manifesto mínimo para um plugin:

```json
{
  "id": "export-pdf",
  "type": "PLUGIN",
  "name": "Exportar PDF",
  "description": "Baixa a tabela atual em PDF",
  "version": "1.0.0",
  "author": "Time Core",
  "icon": "FileDown",
  "placement": {
    "slot": "table.actions"
  },
  "requires": {
    "lowcodejs": ">=1.0.0"
  }
}
```

Para `MODULE`:

```json
{
  "id": "homepage",
  "type": "MODULE",
  "name": "Homepage",
  "version": "1.0.0",
  "route": "/e/core/homepage",
  "icon": "HomeIcon"
}
```

Para `TOOL`:

```json
{
  "id": "clone-table",
  "type": "TOOL",
  "name": "Clonar Tabela",
  "version": "1.0.0",
  "icon": "CopyIcon",
  "tool": {
    "submenu": "tables"
  }
}
```

### Campos comuns

| Campo | Tipo | Obrigatório | Notas |
|-------|------|-------------|-------|
| `id` | string slug | sim | deve bater com o nome da pasta |
| `type` | `PLUGIN \| MODULE \| TOOL` | sim | redundante com a pasta, validado |
| `name` | string | sim | label exibido na UI |
| `description` | string \| null | não | exibido no Workshop |
| `version` | string | sim | semver |
| `author` | string \| null | não | |
| `icon` | string \| null | não | nome lucide-react ou path relativo |
| `image` | string \| null | não | preview/screenshot |
| `requires.lowcodejs` | string semver | não | versão mínima da plataforma |
| `requires.extensions` | string[] | não | outras extensões necessárias |
| `placement.slot` | string | apenas PLUGIN | id do slot do core (ver §Slots) |
| `route` | string | apenas MODULE | URL default; default = `/e/<pkg>/<id>` |
| `tool.submenu` | string | opcional TOOL | grupo dentro de Ferramentas |

Campos extras são preservados em `manifestSnapshot` (passthrough Zod) — útil
para configurações específicas da extensão.

## Slots de plugins

Slots são pontos no JSX do core onde plugins são injetados via
`<ExtensionSlot id="...">` (ver
`frontend/src/components/common/extension-slot/CLAUDE.md`). Catálogo atual:

| Slot id | Onde aparece | Context props | Status |
|---------|--------------|---------------|--------|
| `table.actions` | toolbar da página da tabela (linha do view/config) | `{ table, slug }` | instalado |
| `table.filters` | topo da listagem do FilterSidebar | `{ table, fields }` | instalado |
| `table.row.actions` | dropdown de ações por registro (`TableRowActionsMenu`) | `{ table, row, slug }` | instalado |
| `table.bulk-actions` | barra de ações em massa | `{ table, selectedIds }` | reservado (futuro) |
| `app.header.right` | header global | `{ user }` | reservado (futuro) |
| `app.dashboard.widgets` | dashboard | `{}` | reservado (futuro) |

Slots reservados podem ser instalados conforme demanda. A SKILL (Fase 5)
valida `placement.slot` contra os slots ativos.

## Ciclo de vida

1. **Build/deploy**: o código da extensão entra no bundle
2. **Boot**: `loadExtensions()` em `bin/server.ts` varre `extensions/`, valida
   manifestos via Zod, faz `upsert` na collection `extensions`, e marca como
   `available: false` qualquer registro cujo manifesto sumiu
3. **Ativação**: MASTER vai em `/extensions`, liga o switch — grava
   `enabled: true` no DB
4. **Runtime**: o controller da extensão usa `ExtensionActiveMiddleware` para
   responder 404 quando desativada. O frontend usa `loadExtensionEntry` (Vite
   `import.meta.glob`) para lazy-importar entries de tools/modules/plugins

## Pacote `core` — exceção de ativação

O pacote especial `pkg === 'core'` é shipado junto com a plataforma. Para
não quebrar funcionalidades existentes que migraram do core para extensão
(ex: `clone-table`), o loader chama `upsert` com `enabledOnInsert: true`
**apenas** quando o registro é criado pela primeira vez. Toggles subsequentes
do MASTER são preservados — uma vez desligada, fica desligada.

## Permissões

- **Listar/ativar/configurar**: apenas role `MASTER` (via `RoleMiddleware`)
- **Rotas registradas pela extensão**: a extensão escolhe seus middlewares
  (Auth, RoleMiddleware, etc.). Para garantir que uma rota só responda quando
  ativa, use `ExtensionActiveMiddleware({ pkg, type, extensionId })`

## Convenções

- **Sem sandbox**: extensões rodam com privilégios totais — o desenvolvedor
  assume o risco. Use os repos via `getInstanceByToken` ou `@Inject`, igual ao
  core
- **Either pattern**: use-cases retornam `Either<HTTPException, T>`
- **Mensagens em PT-BR**
- **Design system obrigatório no frontend**: importe de `@/components/ui/*`
- O pacote especial `core` é shipado junto da plataforma (Fase 2 migra o
  Clonar Tabela para `core/tools/clone-table/`)

## Como criar uma nova extensão

Use a SKILL `lowcodejs-extension` (Fase 5 do roadmap). Manualmente:

1. Crie `backend/extensions/<pkg>/<type>/<id>/manifest.json`
2. Se houver código backend, adicione `controller.ts` + `use-case.ts` no mesmo
   diretório
3. Se houver código frontend, crie `frontend/extensions/<pkg>/<type>/<id>/index.tsx`
4. Reinicie o backend → o loader registra no DB → ative em `/extensions`
