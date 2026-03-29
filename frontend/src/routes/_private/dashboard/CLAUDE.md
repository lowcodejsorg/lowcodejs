# Dashboard

Painel administrativo com estatisticas gerais do sistema. Acessivel apenas para
usuarios com role MASTER.

## Arquivos

| Arquivo                | Tipo         | Descricao                                                       |
| ---------------------- | ------------ | --------------------------------------------------------------- |
| `index.tsx`            | Route config | Define head/SEO com titulo "Dashboard"                          |
| `index.lazy.tsx`       | Componente   | Renderiza cards de estatisticas, graficos e atividades recentes |
| `-stat-card.tsx`       | Privado      | Card reutilizavel para exibir uma estatistica com icone         |
| `-chart-tables.tsx`    | Privado      | Grafico de tabelas criadas por mes                              |
| `-chart-users.tsx`     | Privado      | Grafico de usuarios por status (ativos/inativos)                |
| `-recent-activity.tsx` | Privado      | Lista de atividades recentes do sistema                         |
| `-mock-data.ts`        | Privado      | Dados mock para estatisticas, graficos e atividades             |

## Dados Exibidos

- **Cards**: total de tabelas, total de usuarios, total de registros, usuarios
  ativos (com percentual)
- **Graficos**: tabelas criadas por mes (barra), usuarios por status (pizza)
- **Atividades recentes**: lista de acoes recentes (criacao de tabelas,
  usuarios, registros)

## Observacoes

- Atualmente usa dados mock (`-mock-data.ts`), nao consome API real
- Icones via Lucide: `Table`, `Users`, `FileText`, `UserCheck`
- Role: MASTER
