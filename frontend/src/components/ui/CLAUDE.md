# Componentes UI (Design System)

Biblioteca de componentes visuais baseada no padrao Radix UI + shadcn/ui,
estilizada com Tailwind CSS v4 e CVA para variantes.

## Stack

| Tecnologia                     | Uso                                                |
| ------------------------------ | -------------------------------------------------- |
| Radix UI / Base UI             | Primitivos acessiveis (dialog, select, tabs, etc.) |
| CVA (class-variance-authority) | Definicao de variantes de estilo tipadas           |
| Tailwind CSS v4                | Classes utilitarias de estilo                      |
| tailwind-merge (via `cn()`)    | Merge seguro de classes Tailwind                   |
| react-hook-form                | Integracao em `form.tsx`                           |
| recharts                       | Base para `chart.tsx`                              |
| @dnd-kit                       | Drag-and-drop em `combobox.tsx` (sortable chips)   |
| sonner                         | Toast notifications em `sonner.tsx`                |

## Padroes

### data-slot

Todo componente exportado recebe `data-slot="nome-do-componente"` no elemento
raiz. Isso permite seletores CSS entre componentes irmaos (ex:
`has-[>[data-slot=field-error]]`).

### CVA variants

Componentes com multiplas aparencias usam `cva()` para definir variantes
tipadas. As variantes sao expostas via `VariantProps<typeof xVariants>` no tipo
das props.

### asChild (Slot)

Componentes como `Button`, `Badge`, `SidebarGroupLabel` e `Item` aceitam
`asChild` que substitui o elemento raiz por um `Slot` do Radix, permitindo
composicao com elementos filhos.

### cn() helper

Todas as `className` props passam por `cn()` (wrapper de `tailwind-merge` +
`clsx`) para merge seguro de classes.

### Compound components

Componentes complexos (Sidebar, Field, Form, Combobox, Card, Table, etc.) sao
exportados como conjuntos de subcomponentes. Cada subcomponente tem seu proprio
`data-slot`.

## Componentes (34 arquivos)

| Arquivo           | Primitivo base                         | CVA |
| ----------------- | -------------------------------------- | --- |
| alert.tsx         | -                                      | Sim |
| avatar.tsx        | @radix-ui/react-avatar                 | Nao |
| badge.tsx         | @radix-ui/react-slot                   | Sim |
| button.tsx        | @radix-ui/react-slot                   | Sim |
| calendar.tsx      | -                                      | Nao |
| card.tsx          | -                                      | Nao |
| chart.tsx         | recharts                               | Nao |
| checkbox.tsx      | @radix-ui/react-checkbox               | Nao |
| collapsible.tsx   | @radix-ui/react-collapsible            | Nao |
| combobox.tsx      | @base-ui/react/combobox                | Nao |
| dialog.tsx        | @radix-ui/react-dialog                 | Nao |
| dropdown-menu.tsx | @radix-ui/react-dropdown-menu          | Nao |
| empty.tsx         | -                                      | Sim |
| field.tsx         | -                                      | Sim |
| form.tsx          | @radix-ui/react-slot + react-hook-form | Nao |
| input.tsx         | -                                      | Nao |
| input-group.tsx   | -                                      | Sim |
| item.tsx          | @radix-ui/react-slot                   | Sim |
| label.tsx         | @radix-ui/react-label                  | Nao |
| pagination.tsx    | -                                      | Nao |
| popover.tsx       | @radix-ui/react-popover                | Nao |
| scroll-area.tsx   | radix-ui (ScrollArea)                  | Nao |
| select.tsx        | @radix-ui/react-select                 | Nao |
| separator.tsx     | @radix-ui/react-separator              | Nao |
| sheet.tsx         | @radix-ui/react-dialog                 | Nao |
| sidebar.tsx       | @radix-ui/react-slot                   | Sim |
| skeleton.tsx      | -                                      | Nao |
| sonner.tsx        | sonner                                 | Nao |
| spinner.tsx       | -                                      | Nao |
| switch.tsx        | @radix-ui/react-switch                 | Nao |
| table.tsx         | -                                      | Nao |
| tabs.tsx          | @radix-ui/react-tabs                   | Nao |
| textarea.tsx      | -                                      | Nao |
| tooltip.tsx       | @radix-ui/react-tooltip                | Nao |

## Como criar um novo componente UI

1. Criar o arquivo `nome.tsx` neste diretorio
2. Importar `cn` de `@/lib/utils` e, se necessario, o primitivo Radix
   correspondente
3. Declarar o componente como `function` (nao arrow function) recebendo
   `className` via `React.ComponentProps<'elemento'>`
4. Adicionar `data-slot="nome"` no elemento raiz
5. Se houver variantes visuais, definir com `cva()` e tipar props com
   `VariantProps`
6. Se precisar de composicao com elemento filho, usar `asChild` + `Slot` do
   Radix
7. Exportar o componente e, se houver, o objeto de variantes (`nomeVariants`)
