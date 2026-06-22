# RBAC — Modelo Base (2026)

Visão concisa do modelo de permissões do LowCodeJS. Para a especificação
detalhada (enums, schema, enforcement por camada, migrations), veja
[rbac-especificacoes.md](./rbac-especificacoes.md). Para o guia em linguagem de
usuário, veja [rbac-permissoes-guia.md](./rbac-permissoes-guia.md).

## 1. Objetivo

Esquema de permissões baseado em **RBAC** que governa tabelas, campos, menu e as
áreas do sistema. Os antigos **4 roles fixos** (MASTER > ADMINISTRATOR > MANAGER
> REGISTERED) **deixaram de ser a fonte de autorização**: continuam existindo
apenas para compatibilidade do JWT. O controle real gira em torno de **grupos
custom + capacidades de área + bindings por ação**.

## 2. Dois níveis de permissão

1. **Capacidades do grupo (globais)** — o que um membro do grupo pode fazer no
   sistema como um todo. Ficam no cadastro do **grupo de usuários**.
2. **Bindings da tabela (por ação)** — a quem cada ação de uma tabela específica
   está liberada (`Público`, um `Grupo`, ou `Ninguém`). Ficam no cadastro de
   **cada tabela**.

### Regra da interseção

> Para um membro de um grupo realizar uma ação numa tabela, **as duas condições
> precisam ser verdadeiras**: (a) o **grupo** tem a permissão global daquela ação
> **E** (b) o **binding** da tabela libera para esse grupo (ou para Público).

Faltando qualquer um dos dois, a ação é negada. Exemplo: liberar `VIEW_ROW` para
o grupo *Vendas* numa tabela só funciona se o grupo *Vendas* também tiver a
permissão global `VIEW_ROW`.

### Exceções à interseção

- **`Público` (PUBLIC)**: libera para qualquer pessoa, inclusive sem login. Não
  depende de capacidade de grupo.
- **Dono da tabela** e **membros convidados** (`members[]`): concessões
  explícitas por tabela; não dependem da capacidade global do grupo.
- **Privilegiado (MASTER / ADMINISTRATOR)**: acesso total (bypass), resolvido
  pelo **fecho de grupos** (nunca pelo `role` isolado do JWT).
- **`Criar tabela` (CREATE_TABLE)**: não existe tabela ainda, então é avaliada
  **apenas** pela capacidade global do grupo.

## 3. Grupos custom e hierarquia (`Engloba`)

- Um usuário pertence a **vários grupos**: um principal (`user.group`) e
  adicionais (`user.groups[]`).
- Um grupo pode **englobar** outros (`encompasses[]`). Quem pertence ao grupo
  herda as capacidades de tudo que ele engloba (**fecho transitivo**). Ex.:
  `Manager` engloba `Registered` → membros de `Manager` têm também as permissões
  de `Registered`.
- O **privilégio** (MASTER/ADMINISTRATOR) e as **capacidades** são sempre
  resolvidos pelo **fecho** (grupo principal + adicionais + englobados), nunca
  pelo grupo principal isolado. Assim, um MASTER/ADMIN por grupo **adicional**
  também é reconhecido.

## 4. Os 4 grupos default

Hierarquia fixa por `encompasses`:
`Master` → `Administrator` → `Manager` → `Registered`.

| Grupo | Engloba | Capacidades de área | Permissões de tabela (globais) |
| --- | --- | --- | --- |
| **Master** | Administrator | todas (7) | todas (12) |
| **Administrator** | Manager | MANAGE_USERS, MANAGE_MENU, MANAGE_CHAT | todas (12) |
| **Manager** | Registered | MANAGE_CHAT | todas (12) |
| **Registered** | — | MANAGE_CHAT | VIEW_TABLE, VIEW_FIELD, VIEW_ROW, CREATE_ROW |

Notas:
- O grupo **Master** tem todas as capacidades e **não pode ser editado nem
  removido** (grupos do sistema são protegidos: Master/Administrator/Manager/
  Registered).
- A diferença prática entre os grupos default está nas **capacidades de área**
  (quem acessa Usuários, Grupos, Configurações etc.) e em quem é **privilegiado**
  (Master/Administrator têm bypass total). Manager e Registered dependem da
  interseção + dono/membros para agir nas tabelas.
- `MANAGE_CHAT` é semeado em todos os grupos (default liberal; revogável por
  grupo via UI).

## 5. Onde está no código

- **Backend (fonte de verdade)**:
  - `application/services/group-resolver/` — fecho de grupos
    (`resolveUserGroupIds`, `resolveCapabilities`, `isPrivileged`, `isMaster`,
    `shouldHideMaster`).
  - `application/services/permission/` — `checkTableAccess` / `bindingAllows`
    (interseção).
  - `application/services/field-visibility/` — filtragem de campos por binding.
  - `application/middlewares/` — `permission` (capacidade de área), `role`
    (privilégio por fecho), `table-access` (binding + membro + dono).
- **Frontend (gating de UX)**:
  - `src/lib/permission.ts` — espelho do backend (`resolveUserCapabilities`,
    `userSatisfiesBinding`, `isPrivileged`).
  - `src/hooks/use-table-permission.ts` — permissões granulares por tabela.
  - `src/lib/menu/menu-access-permissions.ts` + `menu.ts` — gating de rotas/menu.

O backend é sempre a autoridade final; o frontend apenas esconde o que o usuário
não pode fazer.
