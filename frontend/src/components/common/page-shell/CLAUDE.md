# page-shell — Shell de Layout de Página

Componente wrapper que estrutura o layout interno das páginas com slots de
header, conteúdo e footer.

## Arquivos

| Arquivo          | Descrição                                            |
| ---------------- | ---------------------------------------------------- |
| `page-shell.tsx` | Compound component com Root, Header, Content, Footer |
| `index.ts`       | Barrel export                                        |

## Sub-componentes (Compound Pattern)

| Sub-componente      | Classe base                            | Descrição                              |
| ------------------- | -------------------------------------- | -------------------------------------- |
| `PageShell` (Root)  | `flex flex-col h-full overflow-hidden` | Container principal                    |
| `PageShell.Header`  | `shrink-0` + border-bottom opcional    | Cabeçalho fixo com título e ações      |
| `PageShell.Content` | `flex-1 min-h-0 overflow-auto`         | Área de conteúdo scrollável            |
| `PageShell.Footer`  | `shrink-0` + border-top                | Rodapé fixo (paginação, ações globais) |
| `PageHeader`        | Título + botão de voltar opcional      | Cabeçalho de página com navegação      |

## Padrão de Uso

```tsx
<PageShell>
  <PageShell.Header>
    <h1>Título</h1>
    <Button>Ação</Button>
  </PageShell.Header>
  <PageShell.Content>
    {/* conteúdo scrollável */}
  </PageShell.Content>
  <PageShell.Footer>
    <Pagination ... />
  </PageShell.Footer>
</PageShell>
```

- Todos os sub-componentes aceitam `className` para override de estilos
- Atributos `data-slot` em cada sub-componente para hooks de CSS
- `PageHeader` aceita `backTo` (rota) para exibir botão com `ArrowLeftIcon`
