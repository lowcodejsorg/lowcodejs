# `apps/modules` (frontend)

Entries React dos módulos do pacote `apps` (extensões opcionais — começam
desativadas, MASTER ativa em `/extensions`). Módulos são telas com URL própria
(`/e/<pkg>/<id>`), montadas pela rota dinâmica
`routes/_private/e/$package/$id/`. A declaração canônica vive em
`backend/extensions/apps/modules/`.

## Extensões

| ID          | URL default         | Entry                 | Descrição                                      |
| ----------- | ------------------- | --------------------- | ---------------------------------------------- |
| `dashboard` | `/e/apps/dashboard` | `dashboard/index.tsx` | Painel administrativo com dados reais (MASTER) |

## dashboard

Painel com `PageShell` + estados de Suspense. Os dados vêm de
`use-dashboard-stats.tsx` (TanStack Query → `GET /e/apps/dashboard/stats`).
Subcomponentes:

| Arquivo                  | Papel                                                     |
| ------------------------ | --------------------------------------------------------- |
| `stat-card.tsx`          | Card reutilizável de estatística                          |
| `chart-tables.tsx`       | Bar chart "tabelas por mês"                               |
| `chart-users.tsx`        | Pie chart "usuários por status"                           |
| `recent-activity.tsx`    | Lista de atividades recentes (`formatDistanceToNow` ptBR) |
| `dashboard-skeleton.tsx` | Skeleton enquanto a query carrega                         |

## Convenções

- Entry é **index.tsx** com `export default function ...`
- Subcomponentes ficam em arquivos separados com nome descritivo (sem prefixo
  `-`, diferente das rotas)
- O hook de query da extensão mora dentro do próprio diretório do módulo
  (`use-*.tsx`) — `frontend/src/hooks/tanstack-query/` é reservado a recursos do
  core
