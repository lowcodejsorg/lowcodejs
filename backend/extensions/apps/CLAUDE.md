# Pacote `apps`

Pacote oficial de extensões opcionais do LowCodeJS. Diferente do `pkg=core`
(shipado e auto-ativado), extensões em `apps` começam **desativadas** — o
MASTER ativa em `/extensions` quando quer usar.

## Estrutura

```
apps/
└── modules/
    └── dashboard/                ← Painel administrativo com dados reais (MODULE)
```

## Modules

| ID          | URL default          | Permissões | Descrição |
|-------------|----------------------|------------|-----------|
| `dashboard` | `/e/apps/dashboard`  | MASTER, ADMINISTRATOR | Estatísticas reais do sistema (totais, gráfico mensal, atividades recentes). Endpoint próprio `GET /e/apps/dashboard/stats` blindado por `ExtensionActiveMiddleware` |

## Convenção de pacote

`apps` reúne extensões oficiais de **uso opcional** que estendem o produto sem
serem essenciais (ex: dashboards, relatórios, integrações). Cada extensão tem
`permissions.view` declarado no manifest.
