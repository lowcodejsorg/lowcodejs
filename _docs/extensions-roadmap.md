# Sistema de Extensões — Ata e Roadmap

> Documento de handoff. Captura toda a decisão arquitetural, o estado da Fase 1
> entregue e o plano para Fase 2+. Foi gerado para permitir continuar o
> trabalho em outra máquina/sessão sem perda de contexto.

## 1. Visão de produto (na voz do solicitante)

> "Sou o responsável por implementar um mecanismo/feature de extensões
> (plugins, módulos e ferramentas). Uma extensão pode ser uma das 3 opções,
> o motor que precisamos desenvolver deve criar skills (.md) para que os devs
> do projeto, ao criar algo que distoa do core da aplicação, a skill desenvolva
> os módulos (plugin, módulo ou ferramenta, dependendo do objetivo)."

### Tipos

| Tipo      | Tamanho | Exemplos do solicitante                                                     | Onde aparece                                         |
|-----------|---------|-----------------------------------------------------------------------------|------------------------------------------------------|
| `PLUGIN`  | pequeno | "Baixar planilha como PDF", "Adicionar em lote", "Exportar CSV"             | Placeholder/slot do core (botão actions, filtro, …) |
| `MODULE`  | maior   | Dashboard customizada para homepage; tela/formulário próprio                | URL default `/e/<pkg>/<id>` ou via Menu custom       |
| `TOOL`    | médio   | Clonar tabela (será migrada do core para extensão)                          | Submenu Ferramentas na sidebar                       |

### Estrutura prevista no FS

```
extensions/
└── <pkg>/
    ├── plugins/<id>/manifest.json + código
    ├── modules/<id>/manifest.json + código
    └── tools/<id>/manifest.json + código
```

Existe espelho `backend/extensions/` (canônico para registry/DB) e
`frontend/extensions/` (apenas código UI).

### Workshop

Item "Extensões" abaixo de "Ferramentas" na sidebar (apenas MASTER) onde
extensões registradas podem ser ativadas/desativadas e (se plugins)
configuradas por escopo de tabela.

### SKILL para desenvolvedores

Será criada na Fase 5. Vai:

- Conhecer o core para evitar redundância
- Forçar uso do design system (`@/components/ui/*`, `dynamic-table/*`)
- Scaffoldar manifest + boilerplate seguindo Either/repo contract/Zod
- Validar contra catálogo de slots

---

## 2. Decisões fechadas

| #  | Pergunta                                                              | Decisão                                                                                                  |
|----|-----------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| 1a | Escopo de plugin (todas as tabelas vs por-tabela)                     | **Por-tabela**, configurável no Workshop. Default `mode=all` no manifest                                |
| 1b | Plugin pode ter configs próprias além de on/off?                      | **Não — zero-config**. Cada plugin codifica suas opções fixas. Sem `configSchema` no manifest            |
| 2  | Sandbox (privilégios de execução)                                     | **Sem sandbox**. Extensões rodam com privilégios totais; desenvolvedor interno assume o risco            |
| 3  | Versão da extensão sobe (manifest.version muda) — reativar?           | **Mantém ativada**. Upsert preserva `enabled` e `tableScope`                                             |
| 4  | Pacote `core` mora onde?                                              | **Repo principal** (`backend/extensions/core/`). Reservado para features oficiais que adotam o modelo    |

### Implicações

- **Sem sandbox**: não há wrapper de segurança nos controllers de extensão. Eles
  usam `@Controller`/`@Inject` igual ao core, podem importar repos via DI, etc.
- **Por-tabela**: model `Extension` tem campo `tableScope: { mode, tableIds }`.
  Endpoint `PATCH /extensions/:_id/table-scope` para configurar
- **Sem configSchema**: manifest é puro metadado + placement. Sem form
  auto-gerado no Workshop (simplifica muito a UI)
- **Versão preserva**: o `upsert` sobrescreve metadados (name, version, etc.)
  mas preserva flags de estado (enabled, tableScope, available é resetado pra
  true no upsert)

---

## 3. Arquitetura (referência rápida)

### Build vs runtime

- **Build-time**: código está no repo, entra no bundle. `npm run build` cobre
  tudo; CI roda lint/typecheck nas extensões
- **Runtime**: ativação via DB (`enabled` no model `Extension`). `MASTER` toca
  no toggle; servidor responde 404 em rotas de extensão desativada

### Discovery

- **Backend**: `loadExtensions()` em `bin/server.ts` faz scan FS de
  `backend/extensions/*/{plugins,modules,tools}/*/manifest.json` no boot,
  valida via Zod e faz upsert
- **Frontend**: `import.meta.glob('./*/{plugins,modules,tools}/*/index.tsx')`
  (a ser introduzido na Fase 3 quando os slots forem renderizados)

### Identidade

- Chave composta única: `(pkg, type, extensionId)`
- `pkg` vem do diretório direto sob `extensions/`
- `type` vem do diretório intermediário (`plugins`/`modules`/`tools`)
- `extensionId` vem do diretório final E deve bater com `manifest.id`

### Manifest

Schema Zod canônico em
`backend/application/core/extensions/manifest.schema.ts`. Campos:

```jsonc
{
  "id": "export-pdf",
  "type": "PLUGIN",                  // PLUGIN | MODULE | TOOL
  "name": "Exportar PDF",
  "description": "...",
  "version": "1.0.0",
  "author": "...",
  "icon": "FileDown",                // lucide-react ou path relativo
  "image": "preview.png",
  "placement": { "slot": "table.actions" },     // PLUGIN
  "route": "/e/core/homepage",                   // MODULE
  "tool": { "submenu": "tables" },               // TOOL
  "requires": { "lowcodejs": ">=1.0.0", "extensions": [] }
}
```

Zod usa `passthrough()`, então campos extras vão pra `manifestSnapshot`.

### Permissões

- Listar/ativar/configurar: `MASTER` (RoleMiddleware)
- Rotas próprias da extensão: extensão escolhe seus middlewares. Para garantir
  que rota só funciona quando ativa: `ExtensionActiveMiddleware({ pkg, type, extensionId })`

---

## 4. Catálogo de slots (referência para Fase 3)

Slots são pontos no JSX onde plugins ativados são renderizados. Não estão
implementados na Fase 1 — só registrados no model. A Fase 3 introduz o
componente `<ExtensionSlot>`.

| Slot id                  | Onde aparece                                       | Context props                              |
|--------------------------|----------------------------------------------------|--------------------------------------------|
| `table.actions`          | barra ao lado de "Adicionar registro"              | `{ table, selection }`                     |
| `table.tools-menu`       | menu de ferramentas no topo da grade               | `{ table, view }`                          |
| `table.filters`          | sidebar de filtros (`filters/filter-sidebar.tsx`)  | `{ table, filters, setFilters }`           |
| `table.row-menu`         | menu de contexto de uma linha                      | `{ table, row }`                           |
| `table.bulk-actions`     | barra de ações em massa (`bulk-action-bar/`)       | `{ table, selectedIds }`                   |
| `app.header.right`       | header global (`layout/header.tsx`)                | `{ user }`                                 |
| `app.dashboard.widgets`  | dashboard                                          | `{}`                                       |

Catálogo final vai pra `backend/extensions/CLAUDE.md` e a SKILL valida
`placement.slot` contra essa lista.

---

## 5. Roadmap (6 fases)

| Fase | Escopo                                                                                                              | Status |
|------|--------------------------------------------------------------------------------------------------------------------|--------|
| 1    | Fundação: model `Extension`, REST list/toggle/scope, loader, Workshop, sidebar                                     | feito |
| 2    | Tools: sub-menu Ferramentas collapsível, rota `/tools/$pkg/$id`, migração de `clone-table` para `core/tools/clone-table`, endpoint `GET /extensions/active`, auto-enable do `pkg=core` | feito |
| 3    | Slots/Plugins: `<ExtensionSlot>` com filtro por `tableScope`, instalação de 3 slots (`table.actions`, `table.filters`, `table.row.actions`), plugin de referência `print-table` | feito |
| 4    | Módulos: rota dinâmica `/e/$pkg/$id`, `E_MENU_ITEM_TYPE.EXTENSION_MODULE`, `permissions.view` por role, módulo de referência `welcome`, integração com form de menu | feito |
| 5    | SKILL `lowcodejs-extension`: scaffold determinístico, catálogo de slots, validação, testes E2E                    | próximo |
| 6    | Polish: versionamento (semver match), `requires.extensions` resolver, hot-reload em dev, telemetria, slots reservados (`table.bulk-actions`, `app.header.right`, `app.dashboard.widgets`), URLs custom para módulos via splat-route | pendente |

---

## 6. Estado da Fase 1 (entregue)

### Arquivos criados (backend)

```
backend/
├── application/
│   ├── core/
│   │   ├── entity.core.ts                          # ADICIONADO IExtension, E_EXTENSION_TYPE
│   │   ├── di-registry.ts                          # ADICIONADO Extension repo
│   │   └── extensions/
│   │       ├── manifest.schema.ts                  # Zod do manifest
│   │       └── loader.ts                           # scan + upsert idempotente
│   ├── middlewares/
│   │   └── extension-active.middleware.ts          # 404 se desativada
│   ├── model/
│   │   └── extension.model.ts                      # Mongoose
│   ├── repositories/extension/
│   │   ├── extension-contract.repository.ts
│   │   ├── extension-mongoose.repository.ts
│   │   └── extension-in-memory.repository.ts
│   └── resources/extensions/
│       ├── CLAUDE.md
│       ├── list/{controller,use-case,schema}.ts
│       ├── toggle/{controller,use-case,validator,schema}.ts
│       └── configure-table-scope/{controller,use-case,validator,schema}.ts
├── bin/
│   └── server.ts                                   # ADICIONADO loadExtensionsRegistry
├── extensions/
│   ├── CLAUDE.md                                   # FONTE CANÔNICA
│   └── core/
│       └── CLAUDE.md
└── CLAUDE.md                                       # ADICIONADO seção Extensões
```

### Arquivos criados (frontend)

```
frontend/
├── src/
│   ├── lib/
│   │   ├── constant.ts                             # ADICIONADO E_EXTENSION_TYPE, EXTENSION_TYPE_LABEL
│   │   ├── interfaces.ts                           # ADICIONADO IExtension, IExtensionTableScope, IExtensionRequires
│   │   ├── payloads.ts                             # ADICIONADO ExtensionTogglePayload, ExtensionConfigureTableScopePayload
│   │   └── menu/
│   │       ├── menu.ts                             # ADICIONADO item Extensões no MASTER
│   │       └── menu-access-permissions.ts          # ADICIONADO /extensions em ROLE_ROUTES.MASTER
│   ├── hooks/tanstack-query/
│   │   ├── _query-keys.ts                          # ADICIONADO extensions keys
│   │   ├── _query-options.ts                       # ADICIONADO extensionListOptions
│   │   ├── use-extensions-read-list.tsx
│   │   ├── use-extension-toggle.tsx
│   │   └── use-extension-configure-table-scope.tsx
│   └── routes/_private/
│       ├── layout.tsx                              # ADICIONADO /extensions em routesWithoutSearchInput
│       └── extensions/
│           ├── CLAUDE.md
│           ├── index.tsx
│           ├── index.lazy.tsx
│           └── -extensions-page-skeleton.tsx
├── extensions/
│   ├── CLAUDE.md                                   # espelho UI
│   └── core/
│       └── .gitkeep
└── CLAUDE.md                                       # ADICIONADO seção Extensões
```

### Como testar (smoke test manual)

```bash
# 1. Backend
cd backend && npm install && npm run dev

# 2. Frontend (outro terminal)
cd frontend && npm install && npm run dev

# 3. Logar como MASTER, ver "Extensões" na sidebar abaixo de "Ferramentas"
# 4. Página /extensions deve mostrar empty state

# 5. Criar manifest de teste
mkdir -p backend/extensions/test/plugins/foo
cat > backend/extensions/test/plugins/foo/manifest.json <<'EOF'
{
  "id": "foo",
  "type": "PLUGIN",
  "name": "Foo Plugin",
  "version": "1.0.0",
  "description": "Teste de smoke",
  "placement": { "slot": "table.actions" }
}
EOF

# 6. Restart backend → log deve mostrar "[Extensions] 1 carregada(s)"
# 7. Refresh /extensions → card aparece, toggle funciona, botão Configurar abre sheet
# 8. Apagar a pasta + restart → extensão fica visível mas com flag "indisponível"
# 9. Tentar habilitar indisponível → erro "EXTENSION_UNAVAILABLE"
```

---

## 6.bis Estado da Fase 2 (entregue)

### Backend

- `backend/application/core/controllers.ts` — `loadControllers` agora também
  varre `backend/extensions/` (qualquer `*.controller.ts` é registrado)
- `backend/application/core/extensions/loader.ts` — `enabledOnInsert: true`
  quando `pkg === 'core'` (apenas no insert; toggles posteriores preservados)
- `backend/application/repositories/extension/extension-contract.repository.ts`
  — `upsert(payload, options?: { enabledOnInsert? })`
- `backend/application/resources/extensions/active/{controller,use-case,schema}.ts`
  — `GET /extensions/active` (auth qualquer user, sem `manifestSnapshot`)
- `backend/extensions/core/tools/clone-table/` — manifest.json + controller
  blindado por `ExtensionActiveMiddleware` + use-case + validator + schema +
  templates (movidos via `git mv` preservando histórico)
- `backend/application/resources/tools/CLAUDE.md` — atualizado: clone-table
  saiu da lista (vive em extensions/)

### Frontend

- `frontend/extensions/core/tools/clone-table/index.tsx` — entry React (UI da
  clonagem), default export
- `frontend/src/lib/extensions-registry.ts` — `loadExtensionEntry(pkg, type, id)`
  via `import.meta.glob`
- `frontend/src/hooks/tanstack-query/use-extensions-active-list.tsx` — hook +
  options para `GET /extensions/active`
- `frontend/src/hooks/tanstack-query/use-menu-dynamic.tsx` — injeta tools
  ativadas como filhas do item "Ferramentas" (collapsible quando há tools)
- `frontend/src/routes/_private/tools/index.{tsx,lazy.tsx}` — virou listagem
  (cards de tools ativas, link para `/extensions` quando vazio)
- `frontend/src/routes/_private/tools/$package/$id/{index.tsx,index.lazy.tsx}`
  — rota dinâmica que resolve a extensão ativa e lazy-importa o entry
- `frontend/src/lib/menu/menu-access-permissions.ts` — `/tools` e
  `/tools/$package/$id` adicionados ao MASTER
- `frontend/src/routes/_private/layout.tsx` — regex `/^\/tools\/.+\/.+$/`
  no `routesWithoutSearchInput`

### Decisões implementadas

| Decisão pendente da Fase 2 | Resolvido como |
|----------------------------|----------------|
| Auto-enable do `pkg=core` | (a) Loader passa `enabledOnInsert: pkg === 'core'` ao repo |
| Endpoint público de extensões ativas | (b) Novo `GET /extensions/active` sem `manifestSnapshot`, auth-only |
| Compat de `/tools/clone-table` | (c) Mantida — mesma URL/route, apenas blindada por middleware. Nenhuma migração de cliente externo necessária |

## 6.ter Estado da Fase 3 (entregue)

### Frontend

- `frontend/src/components/common/extension-slot/{extension-slot.tsx,index.ts,CLAUDE.md}`
  — componente `<ExtensionSlot id="..." context={...}>` com lazy import +
  filtro por `tableScope`
- **3 slots instalados**:
  - `table.actions` em `routes/_private/tables/$slug/index.lazy.tsx` (toolbar)
  - `table.filters` em `components/common/filters/filter-sidebar.tsx` (mobile + desktop)
  - `table.row.actions` em `components/common/table-views/table-row-actions-menu.tsx`
- `components/common/filters/filter-sidebar.tsx` — recebe prop `table`
  opcional para alimentar o slot
- `frontend/extensions/core/plugins/print-table/index.tsx` — plugin de
  referência (`window.print()`) no slot `table.actions`

### Backend

- `backend/extensions/core/plugins/print-table/manifest.json` — manifest do
  plugin de referência. Auto-ativado no primeiro boot por ser `pkg=core`

### Decisões implementadas

| Decisão pendente da Fase 3 | Resolvido como |
|----------------------------|----------------|
| Onde instalar `table.actions` | Toolbar de ações da página da tabela (linha do view/config), antes do botão Registro |
| Onde aplicar filtro `tableScope` | Dentro do `<ExtensionSlot>` — usa `context.table?._id` como chave |
| Plugin de exemplo | Novo plugin `print-table` (window.print) — não toca em export-csv existente |

## 6.quat Estado da Fase 4 (entregue)

### Backend

- **`permissions.view` no manifest** — `IExtensionPermissions = { view: string[] }` em
  `entity.core.ts`, schema Zod em `manifest.schema.ts`, model + repos
  atualizados, loader propaga
- **`GET /extensions/active`** — filtra por `request.user.role` quando
  `permissions.view` é não-vazio
- **`E_MENU_ITEM_TYPE.EXTENSION_MODULE`** — novo valor enum + campo
  `extension: { pkg, extensionId } | null` no Menu model, contract repo,
  validators (create/update) e schemas Fastify
- **Use-cases create/update do menu** — quando `type === EXTENSION_MODULE`,
  validam que extensão existe + está ativa, setam `url = /e/<pkg>/<id>`
- **Module loader** — `core/modules/welcome/manifest.json` (auto-ativado por
  ser `pkg=core`)

### Frontend

- **Tipos**: `IMenuExtensionRef`, `IExtensionPermissions`, `MenuExtensionRefPayload`
  em `interfaces.ts` / `payloads.ts`. Constants atualizadas
- **`/e/$package/$id` rota dinâmica** — `routes/_private/e/$package/$id/{index,index.lazy}.tsx`,
  espelha `tools/$package/$id` mas filtra `type === MODULE`
- **`menu-access-permissions.ts`** — `/e/$package/$id` adicionado a todas as
  roles (módulos podem ser visíveis para qualquer auth user; permissões
  granulares ficam no manifest)
- **`ExtensionModuleSelect`** em `components/common/selectors/` —
  combobox de módulos ativos
- **Form de menu** (create + edit) — select condicional quando
  `type=EXTENSION_MODULE`, schema Zod refine, payload e default values
- **`useMenuDynamic`** — `EXTENSION_MODULE` mapeado a `WrenchIcon` no
  `TYPE_ICONS`; URL `/e/<pkg>/<id>` é resolvida automaticamente pelo backend
- **Módulo welcome** em `frontend/extensions/core/modules/welcome/index.tsx`
  — página com saudação + 3 atalhos para Tabelas/Ferramentas/Extensões

### Decisões implementadas

| Decisão pendente da Fase 4 | Resolvido como |
|----------------------------|----------------|
| Visibilidade do módulo por role | Manifest declara `permissions.view: string[]` (vazio = todos). Backend filtra `/extensions/active` |
| Validação de URL única no menu custom | **Punted** — Fase 4 não suporta URL custom. Menu sempre aponta para a URL canônica `/e/<pkg>/<id>` (auto-derivada). URLs alias ficam para Fase 6 |
| Módulo de exemplo | Página de boas-vindas (`core/modules/welcome`) com atalhos para `/tables`, `/tools` e `/extensions` |

## 7. Fase 5 — Próxima ação detalhada

### Objetivo

Criar a **SKILL `lowcodejs-extension`** que orienta agentes (Claude Code,
outros) a criar extensões corretamente, sem reinventar features que já
existem no core. Skill global em `~/.claude/skills/lowcodejs-extension/`.

### Subtarefas

1. **`SKILL.md`** com as triggers e instruções principais:
   - Quando usar (palavras-chave: "criar plugin", "criar módulo", "novo botão
     na tabela", "criar tela", "exportar X", etc.)
   - Pre-flight obrigatório: ler `_docs/extensions-roadmap.md`,
     `backend/extensions/CLAUDE.md`, `frontend/extensions/CLAUDE.md`
   - Decisão guiada (árvore de perguntas para escolher PLUGIN/MODULE/TOOL)
   - Catálogo de slots com props/context que cada um expõe
   - Catálogo de componentes UI obrigatórios (`@/components/ui/*`,
     `dynamic-table/*`)
2. **Pre-flight de redundância**: comandos grep para verificar se a feature
   já existe no core antes de criar (ex: `Grep "export.*pdf"` antes de criar
   plugin de export PDF)
3. **Scaffold determinístico**: passos exatos para criar um plugin/module/tool:
   - Criar pastas `backend/extensions/<pkg>/<type>/<id>/`
     e `frontend/extensions/<pkg>/<type>/<id>/`
   - Gerar `manifest.json` válido (schema Zod já existe)
   - Gerar boilerplate (controller backend se aplicável; entry React)
   - Atualizar CLAUDE.md do pacote
4. **Validação**: a skill deve verificar que:
   - `manifest.id` bate com nome da pasta
   - `placement.slot` está em catálogo válido (para PLUGIN)
   - Referências usam `@/components/ui/*` (não Radix direto)
5. **Testes**: 1-2 cenários E2E de scaffold (criar um plugin do zero ponta a
   ponta, criar um módulo do zero)

### Decisões pendentes da Fase 5

- **Onde a SKILL mora**: global (`~/.claude/skills/`) ou no repo (
  `.claude/skills/lowcodejs-extension/`)? Recomendação: **no repo** — todo
  dev que clona já recebe a skill, sem setup manual
- **A skill executa código ou só orienta?** Recomendação: **só orienta**, mas
  sugere comandos exatos para o agente rodar (mkdir, write, git mv)
- **Suporte a packages externos** (ex: alguém fork da plataforma adiciona
  pacote `marcos-pdf-tools/`)? Recomendação: skill é agnóstica de pacote —
  funciona pra qualquer `pkg`, com `core` apenas como referência

---

## 8. Open considerations (para depois)

Coisas que apareceram no design mas não foram fechadas; trazer para discussão
nas fases relevantes:

- **Hot-reload em dev**: hoje precisa restartar backend para o loader pegar
  novos manifestos. Idealmente um watcher de FS dispara o loader. Fase 6
- **Versionamento real**: hoje `version` é string livre. Comparar semver para
  detectar major bump e talvez forçar reativação. Fase 6
- **`requires.extensions`**: hoje só metadado. Implementar resolver que
  bloqueia ativação se dependência não está habilitada. Fase 6
- **Prerequisite check no boot**: opcional, alertar no Workshop se um
  manifest declara `requires.lowcodejs: ">=2.0.0"` mas a versão atual é 1.x
- **Marketplace de terceiros**: se um dia for público, sandbox vira
  obrigatório. Hoje o desenho permite adicionar isolamento depois sem
  refator grande
- **Permissão de visualizar Workshop**: hoje só MASTER. Se ADMIN também
  precisar, expandir RoleMiddleware no resource

---

## 9. Como retomar em outra máquina

### No outro PC

```bash
git fetch
git checkout feat/extensions
# ou se preferir:  git pull origin feat/extensions
```

Abrir Claude Code na pasta do repo e iniciar com prompt tipo:

> Continue o sistema de extensões — fase 5. Leia
> `_docs/extensions-roadmap.md` para o contexto completo (decisões, fases
> 1, 2, 3 e 4 entregues, plano detalhado da fase 5 e decisões pendentes).
> Antes de começar a codar, valide comigo as 3 decisões pendentes da Fase 5
> listadas na seção 7.

A nova sessão do Claude vai ler este arquivo + os CLAUDE.md das pastas
afetadas e ter o contexto completo. Conversa atual NÃO viaja entre máquinas.

### Memória local

A "auto memory" do Claude Code (em
`C:\Users\luanm\.claude\projects\…\memory\`) é **per-machine** — não sincroniza.
Tudo que importa para o trabalho está no repo (CLAUDE.md + este roadmap).

---

## 10. Resumo das convenções estabelecidas

Para o agente da nova sessão respeitar:

- **Sem sandbox** nas extensões — escrever código com privilégios totais
- **Either pattern** em todos os use-cases (`Either<HTTPException, T>`)
- **Mensagens de erro em PT-BR**
- **Design system obrigatório no frontend**: sempre `@/components/ui/*` e
  `dynamic-table/*`. Nunca importar Radix direto
- **Repo contract pattern**: cada repositório tem contract + mongoose +
  in-memory + registro no `di-registry.ts`
- **Slugs**: regex `^[a-z0-9][a-z0-9-_]*$` para `pkg`/`extensionId`/`id`
- **Chave composta**: `(pkg, type, extensionId)` é único no DB
- **`available`** é mantido pelo loader; **`enabled`** é alternado pelo MASTER
- **CLAUDE.md em cada pasta nova significativa** (já é norma do repo)
- **Sem documentação spam**: este roadmap é exceção pedida pelo usuário; em
  geral não criar `*.md` extras sem solicitação
