# Pacote `core`

Pacote de extensões shipado junto da plataforma. Reservado para funcionalidades
oficiais que adotam o modelo de extensão (ao invés de viver no core
"hard-coded").

## Estrutura prevista

```
core/
├── plugins/      ← (Fase 3) ex: export CSV vira plugin
├── modules/      ← (Fase 4)
└── tools/        ← (Fase 2) clone-table migra para cá
```

Na Fase 1, este diretório está vazio — apenas registra o pacote `core` na
estrutura. Migrações ocorrem nas fases seguintes do roadmap (ver
`backend/extensions/CLAUDE.md`).
