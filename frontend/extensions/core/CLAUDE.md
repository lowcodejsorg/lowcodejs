# Pacote `core` (frontend)

Espelho UI do `backend/extensions/core/`. Contém os entries React (componentes)
das extensões oficiais. Vive separado de `frontend/src/` mas é incluído no
projeto TypeScript via `tsconfig.json` (`"include": ["**/*.ts", "**/*.tsx"]`).

## Estrutura

```
core/
├── tools/
│   └── clone-table/
│       └── index.tsx       ← componente default da tool
├── modules/                ← (Fase 4)
└── plugins/                ← (Fase 3)
```

## Entries

| Tipo | ID | Path | Descrição |
|------|----|----|-----------|
| `tools` | `clone-table` | `tools/clone-table/index.tsx` | UI de clonagem de tabelas (ex-página `/tools` do core) |

## Convenções

- O arquivo deve ser `index.tsx` com `export default function ...`
- Pode importar livremente de `@/components/ui/*`, `@/hooks/...`, `@/lib/...`
- A entry recebe (futuramente) props padronizadas por tipo de slot. Para tools,
  hoje recebe nada — é uma página completa
