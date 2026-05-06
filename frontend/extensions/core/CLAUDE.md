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
├── plugins/
│   └── print-table/
│       └── index.tsx       ← componente default do plugin (slot table.actions)
└── modules/
    └── welcome/
        └── index.tsx       ← componente default do módulo (boas-vindas)
```

## Entries

| Tipo | ID | Path | Descrição |
|------|----|----|-----------|
| `tools` | `clone-table` | `tools/clone-table/index.tsx` | UI de clonagem de tabelas (ex-página `/tools` do core) |
| `plugins` | `print-table` | `plugins/print-table/index.tsx` | Botão de impressão na toolbar (slot `table.actions`) |
| `modules` | `welcome` | `modules/welcome/index.tsx` | Página de boas-vindas com atalhos (URL `/e/core/welcome`) |

## Convenções

- O arquivo deve ser `index.tsx` com `export default function ...`
- Pode importar livremente de `@/components/ui/*`, `@/hooks/...`, `@/lib/...`
- Para **tools**: nenhuma prop (página completa)
- Para **plugins**: recebe as props definidas pelo slot via spread do `context`
  do `<ExtensionSlot>`. Ver
  `frontend/src/components/common/extension-slot/CLAUDE.md` para o catálogo
