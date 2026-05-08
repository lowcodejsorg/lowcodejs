# Pacote `core`

Pacote de extensões shipado junto da plataforma. Reservado para funcionalidades
oficiais que adotam o modelo de extensão (ao invés de viver no core
"hard-coded"). É **auto-ativado no primeiro boot** — ver
`backend/extensions/CLAUDE.md` (seção "Pacote `core` — exceção de ativação").

## Estrutura

```
core/
├── plugins/
│   └── print-table/                ← Fase 3: plugin de referência (slot table.actions)
├── modules/
│   └── welcome/                    ← Fase 4: módulo de referência (boas-vindas)
└── tools/
    ├── clone-table/                ← Fase 2: primeira tool oficial
    └── tables-import-export/       ← exporta/importa tabelas em JSON (2 endpoints, 1 tool)
```

## Tools

| ID                      | Endpoints                                              | Descrição                                                                                            |
| ----------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `clone-table`           | `POST /tools/clone-table`                              | Clona uma ou mais tabelas com base em modelos existentes ou templates built-in (Kanban, Cards, etc.) |
| `tables-import-export`  | `POST /tools/export-table`, `POST /tools/import-table` | Exporta uma tabela em JSON (estrutura/dados/full) ou importa de um arquivo JSON exportado pela plataforma |

## Plugins

| ID            | Slot           | Descrição                                                              |
| ------------- | -------------- | ---------------------------------------------------------------------- |
| `print-table` | `table.actions` | Botão `window.print()` na toolbar da tabela. Plugin de referência. |

## Modules

| ID        | URL default        | Descrição                                                                |
| --------- | ------------------ | ------------------------------------------------------------------------ |
| `welcome` | `/e/core/welcome`  | Página de boas-vindas com atalhos. Pode ser anexada a um menu custom. |

Cada extensão tem seu próprio CLAUDE.md no subdiretório (quando aplicável).
