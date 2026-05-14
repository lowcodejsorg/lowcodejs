---
name: lowcodejs-extension
description: Guia para criar extensões (plugins, módulos, ferramentas) no LowCodeJS sem duplicar código do core. Use quando o usuário pedir para criar plugin, módulo, ferramenta, novo botão na tabela, exportador, dashboard customizado, página de boas-vindas, ou qualquer feature que não pertence ao core. Se acionada, leia esta skill ANTES de criar arquivos.
---

# Skill: lowcodejs-extension

Você está sendo solicitado a criar uma extensão no LowCodeJS. Siga esta skill
**à risca** — o sistema de extensões tem convenções específicas que evitam
quebrar funcionalidades existentes.

## 0. Pre-flight obrigatório

Antes de qualquer coisa:

1. **Leia** `_docs/extensions-roadmap.md` (visão geral, decisões fechadas, fases entregues)
2. **Leia** `backend/extensions/CLAUDE.md` (manifest, slots, ciclo de vida, permissões)
3. **Leia** `frontend/extensions/CLAUDE.md` (entries, convenções de componente)
4. Se for **plugin**, leia também `frontend/src/components/common/extension-slot/CLAUDE.md`
5. Consulte os anexos desta skill conforme precisar:
   - `core-features.md` — features que JÁ EXISTEM no core (não duplicar)
   - `references.md` — tipos, enums, hooks e componentes UI disponíveis
   - `templates/plugin.md`, `templates/module.md`, `templates/tool.md` — boilerplate

Não pule — as decisões já fechadas (sem sandbox, escopo por tabela, zero-config,
auto-enable do `core`, etc.) ditam o que é válido.

## 1. Pre-flight de redundância

**A maior cilada é recriar algo que o core já faz.** Antes de propor uma
extensão, rode estes greps e CONFIRME com o usuário se algum hit é a feature
pedida:

```bash
# Features prováveis de duplicação
grep -rn "export.*csv" frontend/src/components/common/   # já existe export-csv-button
grep -rn "clone.*table" backend/extensions/core/         # já é uma extensão
grep -rn "filter" frontend/src/components/common/filters/  # sistema de filtros existe
grep -rn "dashboard" frontend/src/routes/_private/        # já tem dashboard nativo
```

Features já no core (NÃO recriar):
- **Export CSV** de tabelas (`export-csv-button.tsx`)
- **Export/Import JSON** de tabelas (`/tools/export-table`, `/tools/import-table`)
- **Clone tabela** (extensão `core/tools/clone-table` — já existe, não duplique)
- **Filtros dinâmicos** (sistema de `IFilterField` em `components/common/filters/`)
- **Páginas HTML** (tipo `PAGE` no menu)
- **Dashboard** (`/dashboard` rota nativa)
- **Notificações in-app + WebSocket** (`NotificationContractService` no backend,
  sininho + `/notifications` no frontend — ver `references.md` § Notificações
  antes de criar um sistema próprio)

Se a feature pedida é parecida com algo do core, primeiro pergunte ao usuário
se quer **estender** o core ou **substituir**. Substituir é raro — geralmente o
caminho é uma extensão complementar.

## 2. Decisão: PLUGIN, MODULE ou TOOL?

Use esta árvore:

| Pergunta | Resposta | Tipo |
|----------|----------|------|
| É um **botão pequeno** que vai dentro de um placeholder existente (toolbar, dropdown, filtros)? | Sim | **PLUGIN** |
| É uma **tela completa** com URL própria (dashboard, formulário custom, página)? | Sim | **MODULE** |
| É uma **utilidade** acessível via menu Ferramentas (clone, import, export em massa)? | Sim | **TOOL** |

Exemplos canônicos:
- Baixar PDF da tabela atual → **PLUGIN** (slot `table.actions`)
- Página de boas-vindas / homepage → **MODULE**
- Mesclar duas tabelas → **TOOL**

## 3. Catálogo de slots (apenas PLUGIN)

Plugins precisam declarar `placement.slots` (array com 1+ slots) no manifest.
Um mesmo plugin pode ser registrado em múltiplos slots — o entry React é
montado uma vez por slot, recebendo o context daquele slot. Use isso quando a
mesma ação faz sentido em locais diferentes (ex: botão "Exportar" na toolbar
da tabela e no dropdown de ações de cada linha).

Slots **instalados** hoje:

| Slot id | Onde aparece | Context props recebidas |
|---------|--------------|-------------------------|
| `table.actions` | Toolbar da página da tabela (linha do view/config) | `{ table: ITable, slug: string }` |
| `table.filters` | Topo da listagem do FilterSidebar (mobile + desktop) | `{ table?: ITable, fields: IFilterField[] }` |
| `table.row.actions` | Dropdown "Ações" de cada linha (registro) | `{ table?: ITable, row: IRow, slug: string }` |

Slots **reservados** (não instalados — agendar com user antes):
`tables-page.actions`, `tables-page.row.actions`, `table.bulk-actions`,
`app.header.right`, `app.dashboard.widgets`.

**Regra**: NÃO use um slot reservado sem antes adicionar o `<ExtensionSlot>` no
JSX correspondente do core E documentar a context shape.

## 4. Estrutura de pastas (todo tipo)

Toda extensão tem **dois lados** — backend (canônico para registro no DB) e
frontend (código UI). Mesmo plugin frontend-only precisa de manifest backend.

```
backend/extensions/<pkg>/<plugins|modules|tools>/<id>/
  manifest.json                    # OBRIGATÓRIO
  controller.ts (opcional)         # se a extensão chama API custom
  use-case.ts   (opcional)
  validator.ts  (opcional)
  schema.ts     (opcional)

frontend/extensions/<pkg>/<plugins|modules|tools>/<id>/
  index.tsx                        # OBRIGATÓRIO se a extensão tem UI
                                   # export default function (...)
```

Convenções de nomes:
- `pkg`: slug `[a-z0-9][a-z0-9-_]*` (ex: `core`, `marcos-pdf-tools`)
- `id`: slug `[a-z0-9][a-z0-9-_]*` (ex: `export-pdf`, `welcome`)
- O `id` no `manifest.json` **deve bater** com o nome da pasta — o loader
  rejeita se não bater

## 5. `manifest.json` (campos)

Schema canônico em `backend/application/core/extensions/manifest.schema.ts`.

**Mínimo viável (PLUGIN):**
```jsonc
{
  "id": "exemplo",
  "type": "PLUGIN",
  "name": "Exemplo",
  "version": "1.0.0",
  "placement": { "slots": ["table.actions"] }
}
```

Para registrar o mesmo plugin em múltiplos slots, basta adicionar mais ids ao
array. O entry React é montado uma vez por slot e recebe o context do slot
correspondente, **mais a prop `slot: string`** com o id do slot atual —
injetada automaticamente pelo `<ExtensionSlot>`. Use isso para diferenciar a
UI em cada local (ex: `Button` na toolbar vs `DropdownMenuItem` num dropdown).

```jsonc
{
  "id": "export-table",
  "type": "PLUGIN",
  "name": "Exportar tabela",
  "version": "1.0.0",
  "placement": { "slots": ["table.actions", "tables-page.row.actions"] }
}
```

**Mínimo viável (MODULE):**
```jsonc
{
  "id": "exemplo",
  "type": "MODULE",
  "name": "Exemplo",
  "version": "1.0.0"
}
```

**Mínimo viável (TOOL):**
```jsonc
{
  "id": "exemplo",
  "type": "TOOL",
  "name": "Exemplo",
  "version": "1.0.0"
}
```

**Campos opcionais comuns:**
- `description`, `author`, `icon` (nome lucide-react), `image` (preview)
- `requires.lowcodejs` (semver), `requires.extensions` (deps de outras extensões)
- `permissions.view` (array de roles `MASTER|ADMINISTRATOR|MANAGER|REGISTERED`).
  Vazio = todos auth users; preenchido = só essas roles veem (sidebar, slots,
  módulos)

## 6. Entry frontend

**Plugin**: o componente recebe o `context` do slot como props. Tipar conforme
catálogo (§3).

```tsx
// frontend/extensions/<pkg>/plugins/<id>/index.tsx
import type { ITable } from '@/lib/interfaces';

interface Props {
  table?: ITable;
  slug?: string;
}

export default function MyPlugin({ table, slug }: Props): React.JSX.Element {
  // sempre use design system
  return <Button>Ação</Button>;
}
```

**Module / Tool**: sem props (página completa).

```tsx
// frontend/extensions/<pkg>/modules/<id>/index.tsx
export default function MyModule(): React.JSX.Element {
  return (
    <PageShell>
      <PageShell.Header><PageHeader title="..." /></PageShell.Header>
      <PageShell.Content>...</PageShell.Content>
    </PageShell>
  );
}
```

## 7. Design system OBRIGATÓRIO

Use **apenas** componentes de:
- `@/components/ui/*` — primitivos (Button, Card, Sheet, Switch, etc.)
- `@/components/common/dynamic-table/*` — campos tipados, comboboxes, etc.
- `@/components/common/page-shell` — `PageShell`, `PageHeader`
- `@/lib/toast` — toasts padronizados
- `@/hooks/tanstack-query/*` — hooks de dados existentes

**Proibido**:
- Importar Radix direto (`@radix-ui/...`)
- Adicionar nova dependência sem alinhar com o usuário
- CSS custom além de classes Tailwind via `cn()`

## 8. Backend (se a extensão precisar de API)

Apenas para **TOOL** com lógica de negócio, ou **MODULE** que precisa de
endpoint custom. Plugins frontend-only não precisam.

Padrão:
```
backend/extensions/<pkg>/<type>/<id>/
  controller.ts        # @Controller, @POST/@GET, ExtensionActiveMiddleware obrigatório
  use-case.ts          # Either<HTTPException, T>
  validator.ts         # Zod
  schema.ts            # Fastify (com errorBlock)
```

**Sempre** wrap com `ExtensionActiveMiddleware`:

```ts
import { ExtensionActiveMiddleware } from '@application/middlewares/extension-active.middleware';
import { E_EXTENSION_TYPE } from '@application/core/entity.core';

@POST({
  url: '/something',
  options: {
    onRequest: [
      AuthenticationMiddleware({ optional: false }),
      ExtensionActiveMiddleware({
        pkg: 'meu-pkg',
        type: E_EXTENSION_TYPE.TOOL,
        extensionId: 'meu-id',
      }),
    ],
    schema: MySchema,
  },
})
```

O `loadControllers` varre `backend/extensions/` automaticamente — basta criar
o arquivo terminando em `.controller.ts`.

## 9. Convenções herdadas do core

- **Either pattern** em use-cases: `Either<HTTPException, T>` (nunca lance erros)
- **Mensagens em PT-BR** em toda exception e UI
- **Slugs** com regex `^[a-z0-9][a-z0-9-_]*$`
- **Soft delete** quando aplicável (`trashed`, `trashedAt`)
- **Repository contract pattern** se você criar novo repo (contract +
  mongoose + in-memory + register em di-registry)

## 10. Auto-ativação

Extensões em `pkg=core` são auto-ativadas no primeiro boot. Extensões em
outros pacotes começam **desativadas** — o MASTER ativa em `/extensions`.

## 11. Após criar

1. Atualize `backend/extensions/<pkg>/CLAUDE.md` com a nova extensão na tabela
2. Atualize `frontend/extensions/<pkg>/CLAUDE.md` idem
3. Restart do backend → log do loader deve mostrar a extensão carregada
4. Para plugins: manifesto deve declarar slot válido (se não, NÃO renderiza)
5. Para módulos: testar `/e/<pkg>/<id>` antes de anexar a um menu
6. Para tools: testar via sidebar Ferramentas após ativar

## 12. Checklist final (antes de declarar pronto)

- [ ] Manifesto válido (id bate com pasta, type correto, placement.slots
      é array não vazio se plugin, todos os slots existem no catálogo §3)
- [ ] Entry React tem `export default`
- [ ] Imports usam `@/components/ui/*` / `@/hooks/tanstack-query/*` (não Radix)
- [ ] CLAUDE.md do pacote atualizado
- [ ] Se tem controller backend: `ExtensionActiveMiddleware` aplicado
- [ ] Se MODULE com restrição de role: `permissions.view` no manifest
- [ ] Para `pkg !== 'core'`: avisar o user que precisa ativar manualmente em
      `/extensions`

## 13. Erros comuns

- **"Manifest id não bate com pasta"** → o loader rejeitou. Renomeie a pasta
  ou o `id` no manifest
- **Plugin não aparece no slot** → verifique `placement.slots` (case-sensitive,
  cada id deve estar no catálogo §3), se a extensão está `enabled`, e se
  `tableScope` permite a tabela atual
- **Module 404** → confirme que está em `pkg/modules/id/manifest.json` (não
  `pkg/module/...`) e que está ativada
- **Endpoint da extensão retorna 404** → faltou
  `ExtensionActiveMiddleware` ou a extensão está desativada

## 14. Para o usuário

Se o que ele quer:
- **Já existe no core** → diga, e pergunte se quer estender ou criar variação
- **Pode ser feito com tipo `PAGE` do menu** (HTML simples) → sugira isso
  antes de criar MODULE (mais leve)
- **Toca código sensível** (auth, RBAC, schema dinâmico) → confirme escopo
  antes de criar — talvez seja mudança no core, não extensão

Termine sempre com smoke test passo-a-passo (restart backend, ativar em
`/extensions`, testar a feature).
