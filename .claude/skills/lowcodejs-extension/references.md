# Referência Rápida — Extensões LowCodeJS

Anexo da `SKILL.md`. Consultas frequentes sem precisar abrir o repo.

## Slot context types

```ts
// table.actions
interface TableActionsContext {
  table?: ITable;
  slug: string;
}

// table.filters
interface TableFiltersContext {
  table?: ITable;
  fields: IFilterField[];
}

// table.row.actions
interface TableRowActionsContext {
  table?: ITable;
  row: IRow;
  slug: string;
}
```

## Enums de domínio (mais usados)

```ts
import {
  E_FIELD_TYPE,        // TEXT_SHORT | TEXT_LONG | DROPDOWN | DATE | RELATIONSHIP | FILE | FIELD_GROUP | REACTION | EVALUATION | CATEGORY | USER + 5 nativos
  E_FIELD_FORMAT,      // ALPHA_NUMERIC | INTEGER | DECIMAL | URL | EMAIL | PASSWORD | PHONE | CNPJ | CPF | RICH_TEXT | PLAIN_TEXT + formatos de data
  E_ROLE,              // MASTER | ADMINISTRATOR | MANAGER | REGISTERED
  E_TABLE_TYPE,        // TABLE | FIELD_GROUP
  E_TABLE_STYLE,       // LIST | GALLERY | DOCUMENT | CARD | MOSAIC | KANBAN | FORUM | CALENDAR | GANTT
  E_TABLE_VISIBILITY,  // PUBLIC | RESTRICTED | OPEN | FORM | PRIVATE
  E_TABLE_PERMISSION,  // CREATE/UPDATE/REMOVE/VIEW para TABLE/FIELD/ROW
  E_EXTENSION_TYPE,    // PLUGIN | MODULE | TOOL
  E_MENU_ITEM_TYPE,    // TABLE | PAGE | FORM | EXTERNAL | SEPARATOR | EXTENSION_MODULE
} from '@/lib/constant';
```

## Tipos de domínio

```ts
import type {
  ITable, IField, IRow, IUser, IGroup, IMenu, IStorage,
  IExtension, IExtensionTableScope, IExtensionPermissions,
  IFilterField,
  Paginated,
  Meta,
} from '@/lib/interfaces';
```

## Hooks TanStack Query (já existentes)

| Hook | O que faz |
|------|-----------|
| `useReadTable({ slug })` | Detalhes de uma tabela |
| `useReadTableRowPaginated({ slug, search })` | Linhas paginadas |
| `useTableRowsExportCsv()` | Mutation: gerar CSV |
| `useExtensionsActiveList()` | Lista de extensões ativas (já filtrada por role) |
| `useTablesReadPaginatedInfinite()` | Listar tabelas (combobox) |
| `useMenuReadList()` | Menus |
| `useSettingRead()` | Settings do sistema (system name, logos, etc.) |
| `useAuthStore()` | User logado (zustand) |
| `useTablePermission(table)` | `can(E_TABLE_PERMISSION)` para a tabela |
| `usePermission()` | Mesma API, sem tabela específica |

## Componentes UI principais

```ts
// Layout
import { PageShell, PageHeader } from '@/components/common/page-shell';

// Primitivos
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Empty, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';

// Domínio
import { TableMultiSelect } from '@/components/common/dynamic-table/table-selectors/table-multi-select';
import { TableComboboxPaginated } from '@/components/common/dynamic-table/table-selectors/table-combobox-paginated';
```

## Toast

```ts
import { toastSuccess, toastError, toastInfo, toastWarning } from '@/lib/toast';

toastSuccess('Título', 'Mensagem opcional');
toastError('Erro ao X', 'Detalhe');
```

## API client

```ts
import { API } from '@/lib/api';

await API.get('/some/route');
await API.post('/some/route', { data });
await API.patch(`/some/route/${id}`, { data });
```

## Routing

```ts
import { Link, useRouter, useParams, useSearch } from '@tanstack/react-router';

const router = useRouter();
router.navigate({ to: '/tables/$slug', params: { slug } });

<Link to="/tables/$slug" params={{ slug: 'foo' }}>Ir</Link>
```

## TanStack Form (formulários)

```ts
import { useAppForm } from '@/integrations/tanstack-form/form-hook';

const form = useAppForm({
  defaultValues: { name: '', email: '' },
  onSubmit: async ({ value }) => { /* ... */ },
});

<form.AppField name="name">
  {(field) => <field.FieldText label="Nome" />}
</form.AppField>
```

40 field components disponíveis (`base/`, `rich/`, `table-config/`, `table-row/`).

## Notificações (in-app + WebSocket)

Use `NotificationContractService` no backend para disparar notificações para um
ou mais usuários. O serviço persiste o documento no Mongo e emite o evento
`notification:created` no namespace Socket.IO `/notifications` (room `user:<sub>`).
O sininho no frontend (`NotificationBell`) recebe em tempo real e, se o usuário
estiver em outra página com `notificationsEnabled=true`, mostra um toast clicável.

### Backend — disparar uma notificação

```ts
import { Service } from 'fastify-decorators';

import { E_NOTIFICATION_TYPE } from '@application/core/entity.core';
import { NotificationContractService } from '@application/services/notification/notification-contract.service';

@Service()
export default class MeuUseCase {
  constructor(
    private readonly notificationService: NotificationContractService,
  ) {}

  async execute(actorUserId: string, recipientIds: string[]): Promise<void> {
    await this.notificationService.notify({
      userIds: recipientIds,        // será deduplicado e o actor é excluído
      type: E_NOTIFICATION_TYPE.GENERIC,
      title: 'Sua extensão fez algo',
      body: 'Detalhe (até ~200 chars).',
      action: {                     // opcional — clique navega aqui
        type: 'route',              // 'route' (TanStack Router) ou 'url' (window.location)
        href: '/tables/clientes/rows/abc123',
        label: 'Abrir',
      },
      source: {                     // opcional — metadados para a UI
        pkg: 'meu-pacote',
        tableSlug: 'clientes',
        rowId: 'abc123',
        anchorId: 'msg-uuid',       // ex: id da mensagem do forum para scroll
      },
      actorUserId,                  // remove o ator da lista de destinatários
    });
  }
}
```

### Tipos de notificação (`E_NOTIFICATION_TYPE`)

| Type | Usado por | Quando |
|------|-----------|--------|
| `FORUM_MENTION` | core | Usuário mencionado em uma mensagem do fórum |
| `KANBAN_COMMENT_MENTION` | core | Usuário mencionado em comentário de card kanban |
| `ROW_MEMBER_ASSIGNED` | core | Usuário adicionado a campo USER em row KANBAN/CALENDAR |
| `GENERIC` | extensões | Use para qualquer notificação custom |

Adicionar novo type? Acrescente em `E_NOTIFICATION_TYPE` (backend `entity.core.ts`
e frontend `lib/constant.ts`) **e** adicione o enum value no model (`notification.model.ts`).

### Frontend — consultar notificações na sua extensão

Reuse os hooks existentes em vez de criar novos:

```ts
import { useNotificationPaginated } from '@/hooks/tanstack-query/use-notification-paginated';
import { useNotificationUnreadCount } from '@/hooks/tanstack-query/use-notification-unread-count';
import { useNotificationMarkAsRead } from '@/hooks/tanstack-query/use-notification-mark-as-read';
import { useNotificationMarkAllAsRead } from '@/hooks/tanstack-query/use-notification-mark-all-as-read';
import { useNotificationDelete } from '@/hooks/tanstack-query/use-notification-delete';
```

Endpoints REST:

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/notifications/paginated?page=&perPage=&unreadOnly=` | Lista paginada do usuário logado |
| GET | `/notifications/unread-count` | Apenas o contador `{ count }` |
| PATCH | `/notifications/:_id/read` | Marca uma como lida (emite `notification:read`) |
| PATCH | `/notifications/read-all` | Marca todas como lidas (emite `notification:read_all`) |
| DELETE | `/notifications/:_id` | Soft delete |

### Deep-link com anchor

Se a notificação leva a uma área específica (ex.: mensagem no fórum), use
`source.anchorId` e construa o `action.href` com query params que o consumidor
da UI saiba ler. Exemplo do fórum:

```ts
action: {
  type: 'route',
  href: `/tables/${tableSlug}?channelId=${rowId}&messageId=${messageId}`,
  label: 'Abrir mensagem',
},
```

O `TableForumView` lê `channelId` + `messageId` da query e rola até a mensagem.
Siga o mesmo padrão se sua extensão precisar de scroll para um elemento.

### Respeitando preferência do usuário

O backend persiste a notificação **sempre**. A flag `notificationsEnabled` em
`IUser` controla **apenas** o toast visual — o sininho continua atualizando o
unread-count e a página `/notifications` continua acumulando o histórico.

## Backend imports comuns

```ts
import { Service, Controller, GET, POST, PATCH, DELETE, getInstanceByToken } from 'fastify-decorators';
import { left, right, type Either } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import {
  E_EXTENSION_TYPE,
  E_ROLE,
  // tipos
  type IExtension, type ITable, type IUser,
} from '@application/core/entity.core';
import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';
import { RoleMiddleware } from '@application/middlewares/role.middleware';
import { ExtensionActiveMiddleware } from '@application/middlewares/extension-active.middleware';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';
// ... outros repos
```

## Manifest ZodSchema (para validar mentalmente)

Localização: `backend/application/core/extensions/manifest.schema.ts`.

Resumo:
- `id`: slug obrigatório, deve bater com pasta
- `type`: enum obrigatório
- `name`: string obrigatório
- `version`: semver obrigatório
- `description`, `author`, `icon`, `image`: strings opcionais nullable
- `placement.slots`: obrigatório se PLUGIN — array de strings (1 ou mais)
- `route`: opcional se MODULE (default = `/e/<pkg>/<id>`)
- `tool.submenu`: opcional se TOOL
- `requires.lowcodejs`: semver opcional
- `requires.extensions`: array de strings opcional
- `permissions.view`: array de roles opcional (vazio = todos)
- Campos extras: preservados em `manifestSnapshot`
