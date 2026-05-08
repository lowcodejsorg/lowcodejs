# Ferramentas

Página listagem das ferramentas (extensões `type=TOOL`) ativadas. Cada tool é
uma extensão acessível em `/tools/$package/$id` — a entry React vive em
`frontend/extensions/<pkg>/tools/<id>/index.tsx`.

## Estrutura

```
tools/
├── index.tsx                 # loader (prefetch active extensions list)
├── index.lazy.tsx            # listagem com cards das tools ativas
└── $package/
    └── $id/
        ├── index.tsx         # loader (prefetch active list)
        └── index.lazy.tsx    # resolve a extensão e lazy-importa o entry
```

## Fluxo

1. Usuário acessa `/tools` → vê os cards das tools ativadas (e empty state se
   não há nenhuma — direciona para `/extensions`)
2. Clica em um card → navega para `/tools/<pkg>/<id>`
3. A rota dinâmica usa `loadExtensionEntry(pkg, 'tools', id)` (de
   `@/lib/extensions-registry`) para lazy-importar o componente da extensão
4. Se a extensão não está ativa ou não existe entry no bundle: `RouteNotFound`

## Permissões

- Restrito a MASTER (atual). `useExtensionsActiveList` carrega só as ativas
- Cada tool pode aplicar suas próprias verificações internas (ex:
  `usePermission().can('CREATE_TABLE')`)

## Sidebar collapsível

Quando há tools ativas, o item "Ferramentas" da sidebar vira collapsible com
elas como filhos (lógica em `useMenuDynamic`). Sem tools, segue como link para
esta listagem.