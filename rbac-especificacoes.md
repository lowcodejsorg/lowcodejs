# RBAC — Especificação Detalhada (2026)

Especificação técnica do sistema de permissões implementado no LowCodeJS. Reflete
o código da branch `feat/rbac-permissions`. Para a visão resumida do modelo, veja
[rbac-base.md](./rbac-base.md); para o guia de usuário, veja
[rbac-permissoes-guia.md](./rbac-permissoes-guia.md).

---

## 1. Permissões (19 no total)

Semeadas por `database/seeders/1720448435-permissions.seed.ts` (upsert por
`slug`). Dividem-se em **permissões de tabela** (12) e **capacidades de área**
(7).

### 1.1 Permissões de tabela (`E_TABLE_PERMISSION`)

| Slug | Descrição |
| --- | --- |
| `CREATE_TABLE` | Criar uma nova tabela. |
| `UPDATE_TABLE` | Editar dados/configuração de uma tabela. |
| `REMOVE_TABLE` | Remover/excluir tabelas. |
| `VIEW_TABLE` | Visualizar uma tabela. |
| `CREATE_FIELD` | Criar campos numa tabela. |
| `UPDATE_FIELD` | Editar campos. |
| `REMOVE_FIELD` | Remover campos. |
| `VIEW_FIELD` | Visualizar campos. |
| `CREATE_ROW` | Criar registros. |
| `UPDATE_ROW` | Editar registros. |
| `REMOVE_ROW` | Remover registros. |
| `VIEW_ROW` | Visualizar registros. |

- `CREATE_TABLE` (e `REMOVE_TABLE`) são avaliadas **só** pela capacidade global do
  grupo (não há binding por tabela para "criar tabela").
- As outras **10 ações** recebem um binding por tabela (ver §3) e seguem a
  **interseção** (capacidade global do grupo **E** binding da tabela).

### 1.2 Capacidades de área (`E_AREA_CAPABILITY`)

Liberam o acesso às áreas do sistema. **Não passam por binding** — são checadas
direto pelo `PermissionMiddleware`.

| Slug | Área |
| --- | --- |
| `MANAGE_USERS` | Usuários |
| `MANAGE_MENU` | Itens de menu |
| `MANAGE_USER_GROUPS` | Grupos de usuários e suas permissões |
| `MANAGE_SETTINGS` | Configurações do sistema |
| `MANAGE_TOOLS` | Ferramentas (extensões tipo tool) |
| `MANAGE_PLUGINS` | Plugins |
| `MANAGE_CHAT` | Assistente de IA (chat) |

---

## 2. Alvo do binding (`E_PERMISSION_TARGET`)

Cada binding é o par `{ kind, group }`:

| `kind` | Significado |
| --- | --- |
| `PUBLIC` | Qualquer pessoa, mesmo sem login. Ignora a interseção. |
| `GROUP` | Apenas membros do grupo (`group` = id do grupo) **que também tenham a capacidade global da ação** (interseção). |
| `NOBODY` | Ninguém pode realizar a ação (bloqueado). |

Tipo: `IPermissionBinding = { kind, group: string | null }` (`group` só é usado
quando `kind === GROUP`).

---

## 3. Permissões da tabela (binding por ação)

`table.permissions` é um mapa parcial **ação → binding** para as 10 ações:

```
viewTable, updateTable,
createField, updateField, removeField, viewField,
createRow, updateRow, removeRow, viewRow
```

- Tabelas novas nascem no preset **RESTRICTED** via `buildDefaultTablePermissions`:
  `VIEW_TABLE` e `VIEW_ROW` liberados para o grupo `Registered`; as demais ações
  como `NOBODY`. O dono entra como membro `OWNER`.
- Ausência de binding para uma ação = ação **negada** (exceto dono/membro/
  privilegiado).

### Presets de colaboração (atalho de UI)

O frontend (`src/lib/table-permission-presets.ts`) oferece presets que apenas
preenchem o mapa de bindings:

| Preset | Efeito |
| --- | --- |
| `PRIVATE` | Tudo `NOBODY` (acesso só por dono/membros). |
| `RESTRICTED` | `VIEW_TABLE`/`VIEW_ROW` → grupo `Registered`. |
| `OPEN` | RESTRICTED + `CREATE_ROW` → `Registered`. |
| `PUBLIC` | `VIEW_TABLE`/`VIEW_ROW` → `PUBLIC`. |
| `SURVEY` | `CREATE_ROW` → `PUBLIC` (formulário público). |
| `CUSTOM` | Detectado quando não bate com nenhum preset. |

---

## 4. Membros da tabela (convidados)

`table.members[]` (`{ user, profile }`) concede acesso explícito por tabela,
independente dos bindings. Os perfis (`E_TABLE_PROFILE`) são avaliados pela
matriz `TABLE_PROFILE_MATRIX`, cujas células são `ALLOW` / `DENY` / `OWN`
(`E_PROFILE_ACCESS`).

| Perfil | View table | Update table | Create field | Update field | Remove field | View field | Create row | Update row | Remove row | View row |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **OWNER** | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW |
| **ADMIN** | ALLOW | DENY | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW |
| **EDITOR** | ALLOW | DENY | DENY | DENY | DENY | DENY | ALLOW | ALLOW | ALLOW | ALLOW |
| **CONTRIBUTOR** | ALLOW | DENY | DENY | DENY | DENY | DENY | ALLOW | OWN | OWN | ALLOW |
| **VIEWER** | ALLOW | DENY | DENY | DENY | DENY | DENY | ALLOW | ALLOW | ALLOW | ALLOW |

- `OWNER` tem acesso total e pode "trocar o dono".
- `CONTRIBUTOR` edita/remove **apenas os próprios** registros (`OWN`) — o
  middleware sinaliza `ownership.ownOnly` e os use-cases comparam `row.creator`.
- `CREATE_TABLE`/`REMOVE_TABLE` são sempre `DENY` na matriz (são globais).

---

## 5. Visibilidade de campo

`field.permissions` = `{ list, form, detail }`, cada um um binding (mesma regra de
interseção das ações de tabela; `GROUP` exige a capacidade `VIEW_FIELD`).

- Enforçado no servidor por `FieldVisibilityService`: remove os valores de campos
  ocultos das respostas de row (`paginated`=list, `show`=detail) e descarta
  escritas em campos ocultos (`create`/`update`/`bulk-update`=form).
- `PUBLIC` mostra a todos; `NOBODY` oculta; **ausência de binding** = visível.
- Campos **nativos** e usuários **privilegiados/dono** nunca são filtrados.
- `field.showInFilter` **não é permissão** — controla apenas a sidebar de filtros.

---

## 6. Visibilidade do menu

`menu.visibility` é um binding (`{ kind, group }`) que define quem vê a opção do
menu. `PUBLIC` = todos (inclusive visitante); `GROUP` = membros do grupo;
`NOBODY` = oculto. Ausência = visível (legado migrado para `PUBLIC`).

---

## 7. Modelo de dados

| Documento | Campos RBAC |
| --- | --- |
| **User** | `group` (principal, `IGroup`), `groups[]` (adicionais, `IGroup[]`) |
| **UserGroup** | `permissions[]` (refs de Permission), `encompasses[]` (ids de grupos englobados) |
| **Table** | `permissions` (mapa ação→binding, `null` em legado pré-migração), `members[]` (`{ user, profile }`), `owner` (ref User) |
| **Field** | `permissions` (`{ list, form, detail }`), `showInFilter` (booleano, não-permissão) |
| **Menu** | `visibility` (binding) |

---

## 8. Enforcement por camada

| Camada | Componente | Responsabilidade |
| --- | --- | --- |
| Middleware | `authentication.middleware` | Extrai/valida JWT, popula `request.user`. |
| Middleware | `permission.middleware` | `PermissionMiddleware(capability)`: exige capacidade de área (fecho de grupos). MASTER bypassa. |
| Middleware | `role.middleware` | `RoleMiddleware([...])`: privilégio por **fecho** (`isMaster`/`isPrivileged`). Usado por setup e storage-migration. |
| Middleware | `table-access.middleware` | `TableAccessMiddleware({ requiredPermission })`: dono → membro (matriz) → binding (interseção). Popula `request.ownership` (`isOwner`/`isAdministrator`/`ownOnly`). |
| Service | `group-resolver` | Fecho transitivo dos grupos, união de capacidades, `isMaster`/`isPrivileged`/`shouldHideMaster`. |
| Service | `permission` | `checkTableAccess`/`bindingAllows` (interseção), `isPublicAccess`. |
| Service | `field-visibility` | Oculta campos e descarta escritas em campos ocultos. |

### Mapa de permissão por endpoint (resumo)

- `table-rows` / `table-group-rows`: `CREATE_ROW`, `VIEW_ROW`, `UPDATE_ROW`,
  `REMOVE_ROW` via `TableAccessMiddleware`.
- `table-fields`: `CREATE_FIELD`, `VIEW_FIELD`, `UPDATE_FIELD`, `REMOVE_FIELD`.
- `table-base`: `CREATE_TABLE`, `VIEW_TABLE`, `UPDATE_TABLE`, `REMOVE_TABLE`.
- **CSV de rows**: exportar exige `VIEW_ROW`; importar exige `CREATE_ROW` (não é
  mais restrito a MASTER/ADMINISTRATOR).
- **CSV cross-tabela** (`table-base/export-csv`): privilegiado (MASTER/
  ADMINISTRATOR) via `RoleMiddleware` (resolvido por fecho).
- `user-groups`, `users`, `menu`: todas as operações de gestão — inclusive
  `paginated` (a listagem da tela) — são guardadas pela capacidade de área via
  `PermissionMiddleware` (`MANAGE_USER_GROUPS` / `MANAGE_USERS` / `MANAGE_MENU`).
  Apenas o endpoint **leve `list`** (existe em `user-groups` e `menu`) fica
  **só autenticado** (`AuthenticationMiddleware`, sem capacidade) para alimentar
  pickers da UI (ex.: seletor de grupo no cadastro de usuário). `users` não tem
  `list` leve — seu `paginated` é gated por `MANAGE_USERS`.
- Troca de **dono** de tabela (`table-base/update`): permitida ao dono atual ou a
  um privilegiado resolvido pelo **fecho** (`GroupResolver.isPrivileged`), não
  pelo `role` do JWT.

---

## 9. JWT (compat)

Payload inalterado (`{ sub, email, role, type }`). O `role` ainda é derivado do
grupo **principal** (`user.group`) só para compatibilidade — **não autoriza**. O
privilégio é sempre resolvido pelo **fecho de grupos**
(`GroupResolver.isPrivileged`), de modo que um MASTER/ADMIN por grupo adicional
ou englobado também é reconhecido.

---

## 10. Migração do modelo legado

O modelo antigo foi **removido** (sem fallback): `table.visibility` /
`collaboration` / `administrators` e `field.showInList` / `showInForm` /
`showInDetail` saíram do schema, dos tipos e dos enums.

Migrations idempotentes (marcadores no Setting singleton), rodadas no boot:

| Migration | Efeito |
| --- | --- |
| 09 `table-permissions` | Backfill de `table.permissions` + `members` a partir de `visibility`/`owner`/`administrators` legados. |
| 10 `field-permissions` | Backfill de `field.permissions.{list,form,detail}` a partir de `showInList/Form/Detail`. |
| 11 `menu-visibility` | Define `menu.visibility = PUBLIC` onde faltava. |
| 12 `drop-legacy-permission-fields` | `$unset` permanente dos campos legados (após os backfills). |

> **Nota — importação de schema**: o endpoint `schema-import` aceita
> `showInList`/`showInForm`/`showInDetail` como **formato de importação**
> (booleanos simples) e converte para o modelo novo via `buildFieldPermissions`.
> Não é dado persistido no formato legado — é apenas o contrato de entrada.

---

## 11. Localização no código

- Enums/builders: `backend/application/core/entity.core.ts`.
- Services: `backend/application/services/{group-resolver,permission,field-visibility}/`.
- Middlewares: `backend/application/middlewares/`.
- Seeders: `backend/database/seeders/`.
- Migrations: `backend/database/migrations/`.
- Frontend: `frontend/src/lib/permission.ts`,
  `frontend/src/hooks/use-table-permission.ts`,
  `frontend/src/lib/menu/`, formulários em
  `frontend/src/routes/_private/{tables,groups,menus,users}/`.

---

## 12. Paridade funcional (garantia de não-regressão)

Esta seção responde diretamente à pergunta *"cada coisa que funcionava antes
continua funcionando nesta versão?"*. O **baseline** é o `main` deployado (já
contém o modelo de grupos + capacidades + bindings + perfis); o **alvo** é o
`main` + o trabalho desta branch. O único delta de **autorização** entre os dois
é a troca de *"privilégio lido do `role` do JWT (grupo principal)"* por
*"privilégio resolvido pelo fecho de grupos"* nos middlewares `permission` e
`role`. Esse delta é **estritamente aditivo**: reconhece privilégio também via
grupo **adicional/englobado**, sem remover nenhum caminho de acesso que já existia.

### 12.1 Matriz por superfície

| Superfície | Guarda (baseline → alvo) | Comportamento | Status |
| --- | --- | --- | --- |
| Áreas Usuários/Menu/Grupos/Configurações/Ferramentas | `PermissionMiddleware(capability)` — inalterado; só o bypass MASTER mudou de JWT→fecho | MASTER bypassa; demais por capacidade no fecho | **Preservado** (+ reconhece MASTER por grupo adicional) |
| Papel de sistema (storage-migration, setup) | `RoleMiddleware([MASTER])` JWT → fecho | Exige MASTER | **Preservado** (+ MASTER por grupo adicional) |
| Export cross-tabela (`table-base/export-csv`) | `RoleMiddleware([MASTER,ADMINISTRATOR])` JWT → fecho | Privilegiado | **Preservado** (+ privilégio por grupo adicional) |
| Acesso a tabela/row/field | `TableAccessMiddleware` — inalterado | dono → perfil de membro → binding (interseção) | **Preservado** |
| Visibilidade de campo | `FieldVisibilityService` — inalterado no servidor | oculta leitura + descarta escrita oculta | **Preservado** |
| Privilegiado vê tudo (tabela/campo) | JWT `role` → `isPrivileged` por fecho | bypass de leitura/escrita | **Preservado** (+ por grupo adicional) |
| CSV import/export de rows | `TableAccessMiddleware` (CREATE_ROW / VIEW_ROW) — inalterado | por permissão de row | **Preservado** |
| Chat / IA | `MANAGE_CHAT` semeado em todos os grupos — inalterado | qualquer logado, revogável por grupo | **Preservado** |

### 12.2 Frontend

As mudanças de frontend desta branch são **espelho** das regras do backend:
`isPrivileged` passou a considerar o fecho completo e a visibilidade de campo
passou a checar `VIEW_FIELD` (interseção), ficando **mais alinhada** ao que o
backend já filtrava. Nenhum dado que o usuário via desaparece — o backend já
removia o valor server-side; a UI apenas para de exibir o campo vazio.

### 12.3 Seeders e capacidades dos grupos de sistema

As capacidades dos 4 grupos de sistema (`1720448445-user-group.seed.ts`) são
**idênticas** ao baseline `main` — ADMINISTRATOR continua com `MANAGE_USERS` +
`MANAGE_MENU` (+ `MANAGE_CHAT`), MANAGER/REGISTERED só `MANAGE_CHAT`. **Não há
mudança de quem acessa o quê** nas áreas de sistema. O seeder usa `$addToSet`/
`$setOnInsert`, preservando customizações manuais já feitas em produção.

> **Conclusão:** o alvo é um **superconjunto** do baseline em termos de acesso
> concedido. Todo caminho de acesso que funcionava no `main` continua funcionando;
> a única diferença observável é que usuários cujo privilégio vinha de um grupo
> **adicional/englobado** (e não do principal) agora são corretamente reconhecidos.

### 12.4 Roteiro de verificação por ambiente

Antes de promover para um ambiente, validar (smoke) por papel:

1. **MASTER** — acessa todas as áreas; bypassa qualquer tabela; storage-migration e setup ok.
2. **ADMINISTRATOR** — acessa Usuários e Menu; **não** acessa Grupos/Configurações/Ferramentas (igual ao `main`); tem acesso total a tabelas (privilegiado).
3. **MANAGER** — cria/gere as próprias tabelas; nas demais, depende de binding/membro; chat ok.
4. **REGISTERED** — vê tabelas e cria rows conforme binding; chat ok.
5. **Visitante (sem login)** — só ações com binding `PUBLIC` (ex.: formulário público / tabela pública).
6. Conferir que as **migrations 09–12** já rodaram (marcadores no Setting) — em base já migrada são no-op.

---

## 13. Revisão dos gaps levantados (estado final)

Itens levantados na revisão camada-a-camada. **Nenhum é regressão desta branch.**
Após verificação direta no código, só **um** (G1) era um gap real; os outros dois
já estavam implementados.

| # | Item | Verdito | Detalhe |
| --- | --- | --- | --- |
| **G1** | Capacidade divergente em **Extensões** (frontend abre `/extensions` com `MANAGE_TOOLS`; backend exige `MANAGE_PLUGINS` no `configure-table-scope`). | **Era gap → corrigido.** | O botão "Configurar" (escopo de plugin) agora só aparece para quem tem `MANAGE_PLUGINS` (`hasAreaCapability` no `extensions/index.lazy.tsx`). A rota segue abrindo com `MANAGE_TOOLS` (list/toggle). Evita 403 ao salvar escopo. Backend já estava correto. |
| **G2** | Suspeita de `menu.visibility` enforçado só no frontend. | **Não é gap.** | O `menu/list` use-case **já filtra server-side** por `visibility` via `MenuVisibility.isVisible` (bypass de privilegiado, ancestor-aware "pai oculto esconde subárvore", + checagem da permissão da tabela vinculada). O endpoint é auth-only só porque a restrição vive no use-case, não no middleware. Itens ocultos **não** trafegam para o cliente. |
| **G3** | Suspeita de `user.groups[]` (multi-grupo) inatribuível. | **Não é gap.** | A atribuição multi-grupo está wired ponta-a-ponta (commit `feat: reescreve modelo de permissoes (RBAC)`): validator (`UserBaseValidator.groups`), schema OpenAPI (`groups` + `additionalProperties:false`), use-cases `create`/`update` (propagam `...payload`), repo Mongoose (grava + popula `groups`), e os formulários de `/users/create` e `/users/:id` (campo `FieldGroupMultiSelect` "Grupos adicionais"). O finding original confundiu `profile/update` (auto-edição, que mexe só no grupo principal) com a gestão de usuários em `/users`. |

