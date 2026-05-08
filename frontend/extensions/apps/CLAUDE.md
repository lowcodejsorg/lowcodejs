# Pacote `apps` (frontend)

Espelho UI de `backend/extensions/apps/`. Pacote oficial de extensões
**opcionais** — começam desativadas, MASTER ativa em `/extensions`.

## Estrutura

```
apps/
└── modules/
    └── dashboard/
        ├── index.tsx                ← entry default (PageShell + Suspense states)
        ├── stat-card.tsx            ← Card reutilizável de estatística
        ├── chart-tables.tsx         ← Bar chart "tabelas por mês"
        ├── chart-users.tsx          ← Pie chart "usuários por status"
        ├── recent-activity.tsx      ← Lista de últimas atividades (formatDistanceToNow ptBR)
        ├── dashboard-skeleton.tsx   ← Skeleton enquanto a query carrega
        └── use-dashboard-stats.tsx  ← TanStack Query hook → GET /e/apps/dashboard/stats
```

## Entries

| Tipo      | ID          | Path                          | Descrição                                                               |
| --------- | ----------- | ----------------------------- | ----------------------------------------------------------------------- |
| `modules` | `dashboard` | `modules/dashboard/index.tsx` | Painel administrativo com dados reais (URL `/e/apps/dashboard`, MASTER) |

## Convenções

- Entry é `index.tsx` com `export default function ...`
- Subcomponentes em arquivos separados com nome descritivo (sem prefixo `-`,
  diferente de rotas)
- Hooks de query próprios da extensão moram dentro do diretório do módulo
  (`use-*.tsx`) — diferente do `frontend/src/hooks/tanstack-query/` que é
  reservado a recursos do core
