# Detalhe da Tabela - Visualizacao com Multiplos Modos

Rota principal de visualizacao de uma tabela especifica. Suporta 9 modos de
visualizacao via `E_TABLE_STYLE`, carregados com lazy loading.

## Rota

| Rota                    | Descricao                                 |
| ----------------------- | ----------------------------------------- |
| `/tables/:slug`         | Visualizacao da tabela com rows paginados |
| `/tables/:slug/methods` | Edicao de metodos JavaScript da tabela    |

## Mapa de Visualizacoes (VIEW_MAP)

| E_TABLE_STYLE | Componente        | Skeleton                  | Extra Props            |
| ------------- | ----------------- | ------------------------- | ---------------------- |
| LIST          | TableListView     | TableListViewSkeleton     | Nao                    |
| GALLERY       | TableGridView     | TableGridViewSkeleton     | Nao                    |
| DOCUMENT      | TableDocumentView | TableDocumentViewSkeleton | Sim (tableSlug, table) |
| CARD          | TableCardView     | TableCardViewSkeleton     | Nao                    |
| MOSAIC        | TableMosaicView   | TableMosaicViewSkeleton   | Nao                    |
| KANBAN        | TableKanbanView   | TableKanbanViewSkeleton   | Sim (tableSlug, table) |
| FORUM         | TableForumView    | TableForumViewSkeleton    | Sim (tableSlug, table) |
| CALENDAR      | TableCalendarView | TableCalendarViewSkeleton | Sim (tableSlug, table) |
| GANTT         | TableGanttView    | TableGanttViewSkeleton    | Sim (tableSlug, table) |

## Arquivos

| Arquivo                    | Tipo       | Descricao                                                               |
| -------------------------- | ---------- | ----------------------------------------------------------------------- |
| `index.tsx`                | Loader     | Valida search (page, perPage, trashed), carrega tableDetail + rowList   |
| `index.lazy.tsx`           | Componente | Layout principal com header, filtros, view dinamica e paginacao         |
| `-table-skeleton.tsx`      | Skeleton   | Spinner central de carregamento                                         |
| `-table-configuration.tsx` | Componente | Dropdown de configuracao: campos, grupos, detalhes, metodos, API, embed |
| `-api-endpoints-modal.tsx` | Modal      | Exibe endpoints REST da API para a tabela                               |
| `-methods-form.tsx`        | Formulario | Campos de codigo IIFE para hooks onLoad, beforeSave, afterSave          |
| `methods.tsx`              | Loader     | Carrega tableDetail para rota de metodos                                |
| `methods.lazy.tsx`         | Componente | Pagina de edicao de metodos com tabs                                    |
| `-table-list-view.tsx`     | View       | DataTable com colunas dinamicas, selecao em lote, acoes por row         |
| `-table-grid-view.tsx`     | View       | Cards em grid com campos dinamicos baseados em layoutFields             |
| `-table-document-view.tsx` | View       | Visualizacao de documento com sidebar, TOC e exportacao PDF             |
| `-table-card-view.tsx`     | View       | Cards compactos com campos dinamicos                                    |
| `-table-mosaic-view.tsx`   | View       | Layout tipo mosaico com campos dinamicos                                |
| `-table-kanban-view.tsx`   | View       | Quadro kanban com drag-and-drop (dnd-kit), colunas por dropdown         |
| `-table-forum-view.tsx`    | View       | Forum com canais, mensagens e documentos                                |
| `-table-calendar-view.tsx` | View       | Calendario com modos mes, semana e agenda                               |
| `-table-gantt-view.tsx`    | View       | Grafico Gantt com timeline e barras arrastaveis                         |
| `-table-*-skeleton.tsx`    | Skeletons  | Um skeleton para cada modo de visualizacao                              |

## Paginacao

- Views LIST, GALLERY, CARD, MOSAIC usam paginacao padrao
- Views KANBAN, DOCUMENT, FORUM, CALENDAR, GANTT forcam `page=1, perPage=100`
  (sem paginacao)

## Acesso Publico

- Permite acesso sem autenticacao para tabelas com visibilidade PUBLIC/OPEN
- Verifica `useAuthStore` para determinar se exibe botoes de navegacao
- Erros de permissao (TABLE_PRIVATE, FORM_VIEW_RESTRICTED, 401, 403) exibem tela
  de acesso negado

## Subdiretorios

| Diretorio | Rota                    | Descricao                                 |
| --------- | ----------------------- | ----------------------------------------- |
| `detail/` | `/tables/:slug/detail`  | Edicao de detalhes/configuracao da tabela |
| `field/`  | `/tables/:slug/field/*` | Gerenciamento de campos                   |
| `row/`    | `/tables/:slug/row/*`   | Gerenciamento de registros (rows)         |
| `group/`  | `/tables/:slug/group/*` | Gerenciamento de grupos de campos         |
