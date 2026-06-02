# Pacote `labgestor`

Extensões específicas do Labgestor (cliente da plataforma LowCodeJS). Começam
**desativadas** — o MASTER ativa em `/extensions`.

## Estrutura

```
labgestor/
└── modules/
    └── dashboard/                ← Dashboard com totais de Projetos, Produtos e Equipamentos
```

## Modules

| ID          | URL default              | Descrição                                                                              |
| ----------- | ------------------------ | -------------------------------------------------------------------------------------- |
| `dashboard` | `/e/labgestor/dashboard` | Cards com totais de registros nas tabelas `projeto`, `produtos` e `equipamento` (lê via `GET /tables/:slug/rows/paginated?perPage=1`, usa `meta.total`). |
