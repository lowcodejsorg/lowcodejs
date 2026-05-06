# Pacote `core`

Pacote de extensões shipado junto da plataforma. Reservado para funcionalidades
oficiais que adotam o modelo de extensão (ao invés de viver no core
"hard-coded"). É **auto-ativado no primeiro boot** — ver
`backend/extensions/CLAUDE.md` (seção "Pacote `core` — exceção de ativação").

## Estrutura

```
core/
├── plugins/                        ← (Fase 3) ex: export CSV vira plugin
├── modules/                        ← (Fase 4)
└── tools/
    └── clone-table/                ← Fase 2: primeira tool oficial
```

## Tools

| ID            | Endpoint              | Descrição                                                                                            |
| ------------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `clone-table` | `POST /tools/clone-table` | Clona uma ou mais tabelas com base em modelos existentes ou templates built-in (Kanban, Cards, etc.) |

Cada tool tem seu próprio CLAUDE.md no subdiretório.
