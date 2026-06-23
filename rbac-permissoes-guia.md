# Guia de Permissões (RBAC) — o que cada opção faz

Este guia explica, em linguagem simples, cada opção de permissão da plataforma e
como elas se combinam. Responde diretamente às dúvidas levantadas no QA.

## Visão geral: dois níveis de permissão

1. **Permissões do grupo (globais)** — o que um membro do grupo pode fazer no
   sistema como um todo. Ficam no cadastro do **grupo de usuários**.
2. **Permissões da tabela (bindings)** — a quem cada ação de uma tabela
   específica está liberada (`Público`, um `Grupo`, ou `Ninguém`). Ficam no
   cadastro de **cada tabela**.

O acesso efetivo a uma ação numa tabela é a **interseção** dos dois níveis:

> Para um membro de um grupo realizar uma ação numa tabela, **as duas condições
> precisam ser verdadeiras**: (a) o **grupo** tem a permissão global daquela
> ação **e** (b) o **binding** da tabela libera para esse grupo (ou para
> Público).

### Resposta à dúvida do QA

> "Coloquei uma tabela para mostrar os registros apenas para um grupo
> específico, mas esse grupo não tem a permissão de visualizar registros. Qual o
> comportamento?"

**O grupo NÃO vê os registros.** Liberar a tabela para o grupo (binding) só tem
efeito se o grupo também tiver a permissão global correspondente
(`Visualizar registro`). Faltando qualquer um dos dois, a ação é negada.

### Exceções à interseção

- **`Público`**: libera para qualquer pessoa (inclusive sem login). Não depende
  de permissão de grupo.
- **Dono da tabela** e **membros convidados** (`members[]`, com perfil
  owner/admin/editor/contributor/viewer): são concessões explícitas por tabela e
  **não** dependem da permissão global do grupo.
- **MASTER / ADMINISTRATOR**: têm acesso total (bypass), por papel/fecho de
  grupos.
- **`Criar tabela`**: não existe tabela ainda, então é avaliada **apenas** pela
  permissão global do grupo.

## Permissões do grupo

### Permissões de tabela (12)

| Permissão | O que faz |
|-----------|-----------|
| Criar tabela | Permite criar uma nova tabela. |
| Editar tabela | Permite editar os dados/configuração de uma tabela existente. |
| Remover tabela | Permite remover ou excluir tabelas. |
| Visualizar tabela | Permite visualizar uma tabela existente. |
| Criar campo | Permite criar campos em uma tabela existente. |
| Editar campo | Permite editar campos de uma tabela existente. |
| Remover campo | Permite remover ou excluir campos de uma tabela existente. |
| Visualizar campo | Permite visualizar os campos de uma tabela existente. |
| Criar registro | Permite criar novos registros em uma tabela existente. |
| Editar registro | Permite editar registros de uma tabela existente. |
| Remover registro | Permite remover registros de uma tabela existente. |
| Visualizar registro | Permite visualizar registros de uma tabela existente. |

> Exceto `Criar tabela`, todas só têm efeito numa tabela quando o binding
> daquela tabela também libera (interseção).

### Capacidades de área (7)

Liberam o acesso às áreas do sistema. Não passam por binding.

| Capacidade | O que faz |
|-----------|-----------|
| Gerenciar usuários | Acesso à área de usuários do sistema. |
| Gerenciar menu | Acesso à área de itens de menu. |
| Gerenciar grupos de usuários | Acesso aos grupos de usuários e suas permissões. |
| Gerenciar configurações | Acesso às configurações do sistema. |
| Gerenciar ferramentas | Acesso às ferramentas (extensões do tipo tool). |
| Gerenciar plugins | Acesso aos plugins. |
| Usar o assistente de IA | Acesso ao chat do assistente de IA. |

### Engloba (hierarquia de grupos)

Um grupo pode **englobar** outros grupos. Quem pertence ao grupo herda as
permissões de tudo que ele engloba (fecho transitivo). Ex.: `Gerente` engloba
`Registrado` → membros de `Gerente` têm também as permissões de `Registrado`.

## Permissões da tabela (binding por ação)

Cada uma das 10 ações da tabela (visualizar/editar tabela; criar/editar/remover/
visualizar campo; criar/editar/remover/visualizar registro) recebe um binding:

| Opção | O que faz |
|-------|-----------|
| **Todos (Público)** | Qualquer pessoa, mesmo sem login, pode realizar a ação. |
| **Grupo** | Apenas membros do grupo escolhido **que também tenham a permissão global correspondente** (interseção). |
| **Ninguém** | Ninguém pode realizar a ação (bloqueado). |

### Membros da tabela (perfis)

Independente dos bindings, é possível convidar usuários para a tabela com um
perfil fixo (owner, admin, editor, contributor, viewer). Esse é um acesso
explícito por tabela; `contributor` edita/remove **apenas os próprios**
registros.

## Campos e exportação (mesma regra de interseção)

- **Visibilidade de campo** (`list`/`formulário`/`detalhe`): quando um campo é
  liberado a um **Grupo**, o membro só vê/edita o campo se o grupo também tiver a
  permissão **Visualizar campo** (interseção). `Público` mostra a todos; `Ninguém`
  oculta; dono/privilegiado sempre veem.
- **Exportar/Importar CSV de uma tabela**: quem pode **ver registros**
  (`Visualizar registro`) pode exportar; quem pode **criar registros**
  (`Criar registro`) pode importar — sempre respeitando a interseção. Não é mais
  restrito a MASTER/ADMINISTRATOR.
- **Privilégio (MASTER/ADMINISTRATOR)** é sempre resolvido pelo **fecho de
  grupos** (grupo principal + adicionais + englobados), nunca pelo grupo
  principal isolado. Vale para áreas do sistema, exclusão permanente, sockets e
  proteção de MASTER.

## Onde isso é aplicado no código

- Backend (fonte de verdade): `application/services/permission/permission.service.ts`
  (`checkTableAccess`/`bindingAllows`) e o fecho de grupos em
  `application/services/group-resolver/`.
- Frontend (gating de UX): `src/lib/permission.ts`
  (`resolveUserCapabilities`/`userSatisfiesBinding`) e
  `src/hooks/use-table-permission.ts`.
