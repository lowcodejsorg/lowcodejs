# Pacote `labgestor` (frontend)

Espelho UI de `backend/extensions/labgestor/`. Extensões específicas do
Labgestor — começam desativadas; MASTER ativa em `/extensions`.

## Estrutura

```
labgestor/
└── modules/
    └── dashboard/
        ├── index.tsx                ← entry default (PageShell + cards)
        └── stat-card.tsx            ← Card reutilizável com loading/erro
```

## Entries

| Tipo      | ID          | Path                          | Descrição                                                                                             |
| --------- | ----------- | ----------------------------- | ----------------------------------------------------------------------------------------------------- |
| `modules` | `dashboard` | `modules/dashboard/index.tsx` | Dashboard com cards de totais de `projeto`, `produtos` e `equipamento` (URL `/e/labgestor/dashboard`) |
