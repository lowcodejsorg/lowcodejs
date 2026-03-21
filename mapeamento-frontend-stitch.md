# Mapeamento Completo do Frontend - Para Prompts Google Stitch

## Tech Stack
- **Framework**: React + TanStack Router + TanStack Start (SSR)
- **UI Library**: shadcn/ui (Radix UI + Tailwind CSS v4, estilo "new-york")
- **Estado**: TanStack Query + Zustand
- **Formulários**: TanStack Form + react-hook-form + Zod
- **Editor Rico**: TipTap
- **Tabelas**: TanStack React Table + TanStack Virtual
- **Drag & Drop**: dnd-kit
- **Charts**: Recharts
- **Ícones**: Lucide React
- **PDF**: @react-pdf/renderer
- **Code Editor**: Monaco Editor

---

## PÁGINAS (Routes)

### 1. Login (`/_authentication/_sign-in/`)
- Card centralizado em tela cheia
- Logo no topo
- Formulário com email (ícone mail) e senha (ícone lock, toggle visibilidade)
- Validação Zod (formato email)
- Botão submit com spinner de loading
- Link para cadastro
- **Componentes**: Logo, Button, Field, InputGroup, Spinner, Link

### 2. Cadastro (`/_authentication/sign-up/`)
- Card centralizado em tela cheia
- Logo no topo
- Formulário: nome, email, senha (min 6 chars, uppercase, lowercase, número, char especial), confirmar senha
- Toggle visibilidade para ambos campos de senha
- Link para login
- **Componentes**: Logo, Button, Field, InputGroup, Spinner, Link

### 3. Dashboard (`/_private/dashboard/`)
- Header "Dashboard"
- Grid 4 colunas com StatCards: Total Tabelas, Total Usuários, Total Registros, Usuários Ativos (com %)
- Grid 2 colunas: ChartTables + ChartUsers (Recharts)
- Seção RecentActivity
- **Componentes**: StatCard, ChartTables, ChartUsers, RecentActivity, ícones Lucide

### 4. Lista de Tabelas (`/_private/tables/`)
- Header "Tabelas" com toolbar
- Toolbar: botão lixeira, filtro, importar CSV, nova tabela (baseado em permissões)
- Sidebar de filtros: nome, visibilidade, dono
- Tabela principal com lista paginada
- Pagination no footer
- **Componentes**: FilterSidebar, FilterTrigger, TrashButton, TableTables, Pagination, TableImportDialog, Button

### 5. Detalhe da Tabela (`/_private/tables/$slug/`)
- Header: botão voltar, título da tabela, toolbar com ações
- Sidebar de filtros dinâmica baseada nos campos da tabela
- 9 modos de visualização: LIST, GALLERY, DOCUMENT, CARD, MOSAIC, KANBAN, CALENDAR, FORUM, GANTT
- Seletor de estilo de visualização (dropdown com ícones)
- Pagination e controle per-page
- Suporte a tabelas públicas/privadas
- Lazy loading dos componentes de view
- **Componentes**: TableListView, TableGridView, TableDocumentView, TableCardView, TableMosaicView, TableKanbanView, TableCalendarView, TableForumView, TableGanttView, FilterSidebar, FilterTrigger, TableStyleViewDropdown, Pagination, TableConfigurationDropdown, TrashButton, LoginButton, LoadError

### 6. Configuração da Tabela (`/_private/tables/$slug/detail/`)
- Formulário de configuração da tabela
- Metadados: data criação, dono
- Opções: visibilidade, colaboração, estilo, etc.

### 7. Métodos API da Tabela (`/_private/tables/$slug/methods`)
- Documentação dos endpoints da API da tabela
- CRUD operations

### 8. Criar Campo (`/_private/tables/$slug/field/create/`)
- Formulário de criação de campo
- Seletor de tipo: TEXT_SHORT, TEXT_LONG, DROPDOWN, DATE, RELATIONSHIP, FILE, FIELD_GROUP, REACTION, EVALUATION, CATEGORY
- Configuração por tipo (nome, formato, validação, visibilidade)
- Suporte a grupos de campos
- **Componentes**: CreateFieldForm, field type selector

### 9. Gerenciar Campos (`/_private/tables/$slug/field/management`)
- Lista de campos com drag-to-reorder
- Botões editar/deletar por campo
- Botão criar novo campo
- Toggle de visualização por grupo
- **Componentes**: FieldOrderForm

### 10. Editar Campo (`/_private/tables/$slug/field/$fieldId/`)
- Formulário de edição de propriedades do campo
- Gerenciamento de opções de categoria/dropdown
- Opção de deletar campo

### 11. Criar Registro (`/_private/tables/$slug/row/create/`)
- Formulário dinâmico baseado na estrutura da tabela
- Inputs específicos por tipo de campo
- Pré-seleção de categoria (se vindo de filtro)
- Upload de arquivos, selects de relacionamento, dropdowns
- **Componentes**: CreateRowForm, CreateFormFieldComponent

### 12. Editar Registro (`/_private/tables/$slug/row/$rowId/`)
- Formulário de edição dos dados do registro
- Botão voltar
- Ações: Atualizar, Deletar, Enviar para lixeira, Restaurar
- Dialogs de confirmação para ações destrutivas
- **Componentes**: UpdateRowForm, DeleteDialog, SendToTrashDialog, RemoveFromTrashDialog

### 13. Criar Tabela (`/_private/tables/create/`)
- Formulário de criação de tabela
- Nome e configuração
- Setup inicial de campos

### 14. Clonar Tabela (`/_private/tables/clone/`)
- Seletor de tabela fonte
- Configuração do clone

### 15. Lista de Usuários (`/_private/users/`)
- Restrito a MASTER e ADMINISTRATOR
- Header "Usuários" com toolbar
- Sidebar de filtros
- Tabela: Nome, E-mail, Papel, Status
- Pagination
- Botão novo usuário
- **Componentes**: TableUsers, FilterSidebar, FilterTrigger, Pagination, Button

### 16. Criar Usuário (`/_private/users/create/`)
- Formulário: nome, email, grupo/papel, status

### 17. Editar Usuário (`/_private/users/$userId/`)
- Formulário de edição
- Alterar papel/grupo e status
- Opção deletar

### 18. Lista de Grupos (`/_private/groups/`)
- Restrito a MASTER e ADMINISTRATOR
- Header "Grupos"
- Tabela: Nome, Slug, Descrição
- Filtros e pagination
- **Componentes**: TableGroups, FilterSidebar, FilterTrigger, Pagination

### 19. Criar Grupo (`/_private/groups/create/`)
- Formulário: nome, slug, descrição

### 20. Editar Grupo (`/_private/groups/$groupId/`)
- Formulário de edição
- Configuração de permissões

### 21. Lista de Menus (`/_private/menus/`)
- Restrito a MASTER e ADMINISTRATOR
- Header "Gestão de Menus"
- Toolbar: lixeira, filtro, novo menu
- Tabela: Nome, Slug, Tipo, Criado por, Criado em
- **Componentes**: TableMenus, FilterSidebar, FilterTrigger, TrashButton, Pagination

### 22. Criar Menu (`/_private/menus/create/`)
- Seletor de tipo de menu
- Builder de itens do menu

### 23. Editar Menu (`/_private/menus/$menuId/`)
- Editor de itens do menu
- Configuração de tipo e estrutura

### 24. Perfil (`/_private/profile/`)
- Formulário de edição do perfil do usuário
- Campos: nome, email, grupo (read-only)
- Seção de troca de senha

### 25. Configurações do Sistema (`/_private/settings/`)
- Restrito a MASTER
- Formulário de configurações
- SYSTEM_NAME, SYSTEM_DESCRIPTION, etc.

### 26. Páginas Dinâmicas (`/_private/pages/$slug`)
- CMS: renderiza conteúdo de páginas customizadas

### 27. Ferramentas (`/_private/tools/`)
- Página de utilidades e ferramentas de desenvolvimento

---

## COMPONENTES COMUNS

### Layout & Navegação

| Componente | Arquivo | Descrição |
|---|---|---|
| **Sidebar** | `sidebar.tsx` | Sidebar de navegação com menu hierárquico recursivo (SidebarMenuItemRecursive), logo, botão logout, skeletons de loading |
| **Header** | `header.tsx` | Barra superior com trigger do sidebar, input de busca global, botões perfil/login. Props: routesWithoutSearchInput |
| **Logo** | `logo.tsx` | Imagem do logo do sistema carregada da URL base de storage |
| **Profile** | `profile.tsx` | Dropdown do perfil: avatar com iniciais, nome, email, link perfil, logout com loading |
| **InputSearch** | `input-search.tsx` | Busca global - pesquisa no Enter ou click, atualiza URL params, botão limpar |
| **LoginButton** | `login-button.tsx` | Botão simples que linka para página de login |

### Documentos

| Componente | Arquivo | Descrição |
|---|---|---|
| **DocumentMain** | `document-main.tsx` | Área principal de conteúdo do documento - lista de document rows, contagem de itens filtrados |
| **DocumentSidebar** | `document-sidebar.tsx` | Sidebar de navegação do documento - árvore de categorias com drag-and-drop (dnd-kit), edição inline, adicionar categorias |
| **DocumentSidebarTree** | `document-sidebar-tree.tsx` | Árvore recursiva para categorias - expand/collapse, modo edição, indicadores de drag |
| **DocumentSidebarAddDialog** | `document-sidebar-add-dialog.tsx` | Dialog modal para adicionar nova seção - TanStack Form, label do pai |
| **DocumentRow** | `document-row.tsx` | Linha de documento com blocos de conteúdo (título+body), campos extras, seção colapsável "Mais info", botões editar/adicionar |
| **DocumentHeadingRow** | `document-heading-row.tsx` | Heading dinâmico (h2-h6) com ícone e ações |
| **DocumentToc** | `document-toc.tsx` | Sumário para impressão - achata estrutura da árvore de categorias |
| **DocumentPdf** | `document-pdf.tsx` | Renderizador PDF (react-pdf) - TOC + conteúdo, suporta rich text e markdown |
| **DocumentPrintButton** | `document-print-button.tsx` | Botão de impressão com ícone |

### Células de Tabela (Table Row Cells)

| Componente | Arquivo | Descrição |
|---|---|---|
| **TextShortCell** | `table-row-text-short-cell.tsx` | Exibe texto curto - suporta formatos PASSWORD, EMAIL, URL. Truncado com max-width |
| **TextLongCell** | `table-row-text-long-cell.tsx` | Texto longo - suporta RICH_TEXT e MARKDOWN via ContentViewer |
| **DateCell** | `table-row-date-cell.tsx` | Data formatada com date-fns (locale pt-BR) |
| **DropdownCell** | `table-row-dropdown-cell.tsx` | Valores selecionados como badges coloridos |
| **CategoryCell** | `table-row-category-cell.tsx` | Similar ao dropdown mas para categorias |
| **EvaluationCell** | `table-row-evaluation-cell.tsx` | Sistema de 5 estrelas interativo - rating do usuário atual, média, hover preview |
| **ReactionCell** | `table-row-reaction-cell.tsx` | Botões like/dislike com contagem, reação do usuário highlighted |
| **RelationshipCell** | `table-row-relationship-cell.tsx` | Campo de relacionamento - extrai valor do campo referenciado, exibe como badge list |
| **FileCell** | `table-row-file-cell.tsx` | Lista de arquivos como links. Gallery/Card mostra thumbnails de imagem |
| **FieldGroupCell** | `table-row-field-group-cell.tsx` | Badge com contagem de itens (célula) ou data table completa (detalhe) |
| **UserCell** | `table-row-user-cell.tsx` | Nomes/emails de usuários separados por vírgula |
| **BadgeList** | `table-row-badge-list.tsx` | Lista de badges reutilizável com cores e labels customizáveis |

### Seletores de Tabela

| Componente | Arquivo | Descrição |
|---|---|---|
| **TableCombobox** | `table-combobox.tsx` | Dropdown seletor de tabela - lista todas as tabelas |
| **TableComboboxFiltered** | `table-combobox-filtered.tsx` | Seletor com opções pré-filtradas estáticas |
| **TableComboboxPaginated** | `table-combobox-paginated.tsx` | Seletor com scroll infinito (useInfiniteQuery), busca com debounce, "carregar mais" |
| **TableMultiSelect** | `table-multi-select.tsx` | Seleção múltipla de tabelas com chips |
| **TableStyleView** | `table-style-view.tsx` | Dropdown seletor de estilo: LIST, GALLERY, DOCUMENT, CARD, MOSAIC, KANBAN, FORUM, CALENDAR, GANTT |

### Grupos de Campos

| Componente | Arquivo | Descrição |
|---|---|---|
| **GroupCombobox** | `group-combobox.tsx` | Dropdown seletor de grupo/papel com USER_GROUP_MAPPER |
| **GroupRowFormDialog** | `group-row-form-dialog.tsx` | Dialog para criar/editar itens de grupo - renderiza campos específicos, uploads |
| **GroupRowDeleteDialog** | `group-row-delete-dialog.tsx` | Dialog confirmação de exclusão de item do grupo |
| **GroupRowsDataTable** | `group-rows-data-table.tsx` | Tabela de itens do grupo com ações editar/deletar |

### Filtros

| Componente | Arquivo | Descrição |
|---|---|---|
| **FilterFields** | `filter-fields.tsx` | Builder de formulários de filtro - useFilterState hook, FilterTextShort, FilterDropdown, FilterDate, FilterCategory. Converte filtros para URL params |
| **FilterSidebar** | `filter-sidebar.tsx` | Painel de filtros colapsável - Desktop: sidebar animada. Mobile: Sheet |
| **FilterTrigger** | `filter-trigger.tsx` | Botão de filtro com badge de contagem de filtros ativos |
| **SheetFilter** | `sheet-filter.tsx` | Filtro em Sheet com trigger auto-contido |

### Seletores

| Componente | Arquivo | Descrição |
|---|---|---|
| **FieldCombobox** | `field-combobox.tsx` | Seletor de campo de uma tabela específica |
| **MenuCombobox** | `menu-combobox.tsx` | Seletor hierárquico de menu com breadcrumb, previne seleção de descendentes |
| **PermissionMultiSelect** | `permission-multi-select.tsx` | Multi-select de permissões com chips |
| **UserMultiSelect** | `user-multi-select.tsx` | Multi-select de usuários com busca e paginação, cache de selecionados |

### Upload de Arquivos

| Componente | Arquivo | Descrição |
|---|---|---|
| **FileUpload** | `file-upload.tsx` | Upload base - dropzone com drag-and-drop, lista de arquivos com barras de progresso, validação |
| **FileUploadWithStorage** | `file-upload-with-storage.tsx` | Upload com storage backend - mutations de upload e delete, tracking de storage objects |
| **UploadingContext** | `uploading-context.tsx` | React Context para estado global de uploads - useIsUploading, useUploadingContext |

### Paginação & Ações

| Componente | Arquivo | Descrição |
|---|---|---|
| **Pagination** | `pagination.tsx` | Controles: seletor items/página, botões first/prev/next/last, página atual |
| **TrashButton** | `trash-button.tsx` | Toggle de visualização de lixeira - atualiza URL params |

### Estados de Erro & Loading

| Componente | Arquivo | Descrição |
|---|---|---|
| **AccessDenied** | `access-denied.tsx` | Página de acesso negado - ícone escudo, mensagem, botão voltar |
| **LoadError** | `load-error.tsx` | Estado de erro de carregamento - ícone cloud alert, botão retry |
| **RouteError** | `route-error.tsx` | Error boundary de rota - ícone triângulo alerta, mensagem de erro, retry |
| **RouteNotFound** | `route-not-found.tsx` | Página 404 - ícone search X, botão home |
| **RoutePending** | `route-pending.tsx` | Spinner de loading - ícone loader animado, "Carregando..." |

### Árvore (Tree)

| Componente | Arquivo | Descrição |
|---|---|---|
| **TreeList** | `-tree-list.tsx` | Lista interativa em árvore - expand/collapse, checkboxes, single/multi-select |
| **TreeNode** | `-tree-node.tsx` | Nó de árvore com drag-and-drop (sortable), drag handle e drop indicators |
| **TreeEditor** | `-tree-editor/` | Editor de árvore completo: use-tree hook, use-tree-editor hook, tree-node-item, tree-editor-header, add-node-form, inline-editor-form |

### Datepicker

| Componente | Arquivo | Descrição |
|---|---|---|
| **Datepicker** | `datepicker/datepicker.tsx` | Datepicker principal - suporte a range, mask input formatting |
| **DatepickerCalendar** | `datepicker/datepicker-calendar.tsx` | Vista de calendário |
| **DatepickerDays** | `datepicker/datepicker-days.tsx` | Grid de dias |
| **DatepickerMonths** | `datepicker/datepicker-months.tsx` | Seletor de mês |
| **DatepickerYears** | `datepicker/datepicker-years.tsx` | Seletor de ano |

### Editor Rico (TipTap)

| Componente | Arquivo | Descrição |
|---|---|---|
| **Editor** | `editor/editor.tsx` | Editor de texto rico TipTap - suporte markdown, toolbar com formatação, contagem de caracteres, bubble menu na seleção |
| **Toolbar** | `editor/toolbar.tsx` | Toolbar do editor com botões de formatação |
| **ColorPicker** | `editor/color-picker.tsx` | Seletor de cor |
| **ImageUpload** | `editor/image-upload.tsx` | Upload de imagem no editor |
| **LinkEditBlock** | `editor/link-edit-block.tsx` | Interface de edição de link |
| **TablePicker** | `editor/table-picker.tsx` | Picker para inserir tabela |
| **Viewer** | `editor/viewer.tsx` | Visualizador de conteúdo read-only |
| **Bubbles** | `editor/bubble/` | Menus flutuantes: TextBubble (formatação), LinkBubble (links), ImageBubble (imagens), TableBubble (tabelas) |

### Kanban (12 componentes)

| Componente | Arquivo | Descrição |
|---|---|---|
| **KanbanCard** | `kanban/kanban-card.tsx` | Card individual do kanban |
| **KanbanColumn** | `kanban/kanban-column.tsx` | Coluna com cards |
| **KanbanUnassignedColumn** | `kanban/kanban-unassigned-column.tsx` | Coluna para itens sem categoria |
| **KanbanRowDialog** | `kanban/kanban-row-dialog.tsx` | Dialog de detalhe do registro no kanban |
| **KanbanRowDescription** | `kanban/kanban-row-description.tsx` | Seção de descrição |
| **KanbanRowQuickActions** | `kanban/kanban-row-quick-actions.tsx` | Botões de ação rápida |
| **KanbanRowComments** | `kanban/kanban-row-comments.tsx` | Seção de comentários |
| **KanbanRowTasks** | `kanban/kanban-row-tasks.tsx` | Seção de subtarefas |
| **KanbanRowExtraFields** | `kanban/kanban-row-extra-fields.tsx` | Campos adicionais |
| **KanbanFieldGroupEditor** | `kanban/kanban-field-group-editor.tsx` | Editor de grupo de campos |
| **KanbanCreateCardDialog** | `kanban/kanban-create-card-dialog.tsx` | Dialog criar novo card |
| **KanbanAddListDialog** | `kanban/kanban-add-list-dialog.tsx` | Dialog adicionar nova lista |

### Fórum (10 componentes)

| Componente | Arquivo | Descrição |
|---|---|---|
| **ForumSidebar** | `forum/forum-sidebar.tsx` | Lista de canais |
| **ForumHeader** | `forum/forum-header.tsx` | Header com info do canal |
| **ForumMessagesList** | `forum/forum-messages-list.tsx` | Lista de mensagens do thread |
| **ForumComposer** | `forum/forum-composer.tsx` | Caixa de composição de mensagem |
| **ForumDocuments** | `forum/forum-documents.tsx` | Anexos de documentos |
| **ForumAddChannelDialog** | `forum/forum-add-channel-dialog.tsx` | Criar canal |
| **ForumEditChannelDialog** | `forum/forum-edit-channel-dialog.tsx` | Editar canal |
| **ForumDeleteChannelDialog** | `forum/forum-delete-channel-dialog.tsx` | Confirmar exclusão de canal |
| **ForumDeleteMessageDialog** | `forum/forum-delete-message-dialog.tsx` | Confirmar exclusão de mensagem |
| **ForumUserMultiSelect** | `forum/forum-user-multi-select.tsx` | Seleção de usuários para canais |

### Calendário (6 componentes)

| Componente | Arquivo | Descrição |
|---|---|---|
| **CalendarToolbar** | `calendar/calendar-toolbar.tsx` | Switcher de vista do calendário |
| **CalendarMonthView** | `calendar/calendar-month-view.tsx` | Vista mensal |
| **CalendarWeekView** | `calendar/calendar-week-view.tsx` | Vista semanal |
| **CalendarAgendaView** | `calendar/calendar-agenda-view.tsx` | Vista agenda/lista |
| **CalendarEventDialog** | `calendar/calendar-event-dialog.tsx` | Dialog detalhe/edição de evento |
| **CalendarDeleteDialog** | `calendar/calendar-delete-dialog.tsx` | Confirmar exclusão de evento |

### Gantt (4 componentes)

| Componente | Arquivo | Descrição |
|---|---|---|
| **GanttToolbar** | `gantt/gantt-toolbar.tsx` | Controles do Gantt |
| **GanttTimelineHeader** | `gantt/gantt-timeline-header.tsx` | Header da timeline |
| **GanttLeftPanel** | `gantt/gantt-left-panel.tsx` | Painel de lista de tarefas |
| **GanttBar** | `gantt/gantt-bar.tsx` | Barra de tarefa no timeline |

### Data Table (6 componentes)

| Componente | Arquivo | Descrição |
|---|---|---|
| **DataTable** | `data-table/data-table.tsx` | Wrapper principal TanStack Table |
| **DataTableBody** | `data-table/data-table-body.tsx` | Body com rows |
| **DataTableColumnHeader** | `data-table/data-table-column-header.tsx` | Header com sorting |
| **DataTableColumnToggle** | `data-table/data-table-column-toggle.tsx` | Toggle de visibilidade de colunas |
| **DataTableDraggableHeader** | `data-table/data-table-draggable-header.tsx` | Headers arrastáveis |
| **DataTableResizeHandle** | `data-table/data-table-resize-handle.tsx` | Handle de redimensionamento |

### Code Editor

| Componente | Arquivo | Descrição |
|---|---|---|
| **CodeEditor** | `code-editor/code-editor.tsx` | Editor de código Monaco |
| **CodeEditorInfoModal** | `code-editor/code-editor-info-modal.tsx` | Modal de informações |

### TanStack Form (~58 componentes)

| Componente | Descrição |
|---|---|
| **field-editor.tsx** | Formulário principal de configuração de campo |
| **table-field-type-select.tsx** | Seletor de tipo de campo |
| **field-permission-multi-select.tsx** | Seletor de permissões em formulários |
| **field-file-upload.tsx** | Upload de arquivo em formulário |
| + campos específicos | text, textarea, password, email, URL, date, dropdown, category, file, relationship, user, field group, markdown, rich text, combobox, select relacional |

---

## UI PRIMITIVOS (shadcn/ui) - 33 componentes

Alert, Avatar, Badge, Button (variants: default/destructive/outline/secondary/ghost/link), Calendar, Card, Chart (Recharts), Checkbox, Collapsible, Combobox, Dialog, DropdownMenu, Empty, Field, Form, Input, InputGroup, Item, Label, Pagination, Popover, Select, Separator, Sheet, Sidebar, Skeleton, Sonner (Toast), Spinner, Switch, Table, Tabs, Textarea, Tooltip
