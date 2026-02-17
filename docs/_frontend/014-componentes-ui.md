# Componentes UI

Documentacao da biblioteca de componentes UI do frontend LowCodeJS, localizada em `src/components/ui/`. Todos os componentes seguem o padrao shadcn/ui com Radix UI Primitives, estilizados via Tailwind CSS e organizados com o padrao CVA (Class Variance Authority).

---

## Visao Geral

O projeto possui 33 componentes UI reutilizaveis. A maioria e construida sobre Radix UI Primitives, garantindo acessibilidade nativa (ARIA), e estilizada com Tailwind CSS + CVA para variantes tipadas.

---

## Lista Completa de Componentes

| #  | Componente       | Arquivo              | Base                         | Descricao                                    |
|----|------------------|----------------------|------------------------------|----------------------------------------------|
| 1  | Alert            | `alert.tsx`          | HTML nativo                  | Mensagens de alerta com variantes            |
| 2  | Avatar           | `avatar.tsx`         | Radix Avatar                 | Avatar de usuario com fallback               |
| 3  | Badge            | `badge.tsx`          | HTML nativo                  | Badges com variantes de cor                  |
| 4  | Button           | `button.tsx`         | Radix Slot                   | Botao com 6 variantes e 6 tamanhos          |
| 5  | Calendar         | `calendar.tsx`       | react-day-picker              | Seletor de data em calendario               |
| 6  | Card             | `card.tsx`           | HTML nativo                  | Container de conteudo com header/footer      |
| 7  | Chart            | `chart.tsx`          | Recharts                     | Container de graficos com temas              |
| 8  | Checkbox         | `checkbox.tsx`       | Radix Checkbox               | Caixa de selecao acessivel                   |
| 9  | Collapsible      | `collapsible.tsx`    | Radix Collapsible            | Conteudo colapsavel                          |
| 10 | Combobox         | `combobox.tsx`       | Base UI Combobox + dnd-kit   | Select com busca, chips e drag-and-drop      |
| 11 | Dialog           | `dialog.tsx`         | Radix Dialog                 | Modal/dialog com overlay e animacoes         |
| 12 | Dropdown Menu    | `dropdown-menu.tsx`  | Radix DropdownMenu           | Menu suspenso com sub-menus                  |
| 13 | Empty            | `empty.tsx`          | HTML nativo                  | Estado vazio com icone e mensagem            |
| 14 | Field            | `field.tsx`          | HTML nativo + CVA            | Sistema de campos de formulario              |
| 15 | Form             | `form.tsx`           | React Hook Form              | Integracao com React Hook Form               |
| 16 | Input            | `input.tsx`          | HTML nativo                  | Campo de entrada de texto                    |
| 17 | Input Group      | `input-group.tsx`    | HTML nativo + CVA            | Input com addons (icones, botoes)            |
| 18 | Item             | `item.tsx`           | HTML nativo                  | Item generico de lista                       |
| 19 | Label            | `label.tsx`          | Radix Label                  | Label acessivel para campos                  |
| 20 | Pagination       | `pagination.tsx`     | HTML nativo                  | Controles de paginacao                       |
| 21 | Popover          | `popover.tsx`        | Radix Popover                | Popover flutuante                            |
| 22 | Select           | `select.tsx`         | Radix Select                 | Select nativo com opcoes                     |
| 23 | Separator        | `separator.tsx`      | Radix Separator              | Separador visual horizontal/vertical         |
| 24 | Sheet            | `sheet.tsx`          | Radix Dialog                 | Painel lateral deslizante                    |
| 25 | Sidebar          | `sidebar.tsx`        | Composicao interna           | Sistema completo de sidebar                  |
| 26 | Skeleton         | `skeleton.tsx`       | HTML nativo                  | Placeholder de carregamento                  |
| 27 | Sonner           | `sonner.tsx`         | sonner                       | Sistema de notificacoes toast                |
| 28 | Spinner          | `spinner.tsx`        | HTML nativo                  | Indicador de carregamento animado            |
| 29 | Switch           | `switch.tsx`         | Radix Switch                 | Toggle switch acessivel                      |
| 30 | Table            | `table.tsx`          | HTML nativo                  | Tabela semantica com estilos                 |
| 31 | Tabs             | `tabs.tsx`           | Radix Tabs                   | Navegacao por abas                           |
| 32 | Textarea         | `textarea.tsx`       | HTML nativo                  | Area de texto multi-linha                    |
| 33 | Tooltip          | `tooltip.tsx`        | Radix Tooltip                | Dica de contexto ao hover                    |

---

## Padrao CVA + cn()

Os componentes utilizam dois utilitarios fundamentais para estilizacao:

### Class Variance Authority (CVA)

CVA permite definir variantes de estilo tipadas para componentes:

```ts
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  // Classes base aplicadas sempre
  'inline-flex items-center justify-center rounded-md text-sm font-medium',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-white hover:bg-destructive/90',
        outline: 'border bg-background shadow-xs hover:bg-accent',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3',
        lg: 'h-10 rounded-md px-6',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);
```

### Funcao `cn()`

A funcao `cn()` (de `src/lib/utils`) combina `clsx` e `tailwind-merge` para mesclar classes sem conflitos:

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

### Padrao de Uso nos Componentes

```tsx
function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
```

**Nota:** O padrao `data-slot` e utilizado em todos os componentes para facilitar a selecao e estilizacao via CSS e testes.

---

## Componentes em Detalhe

### Button

**Arquivo:** `src/components/ui/button.tsx`

Componente de botao com 6 variantes visuais e 6 opcoes de tamanho.

#### Variantes

| Variante       | Descricao                                 |
|----------------|-------------------------------------------|
| `default`      | Botao primario com fundo solido           |
| `destructive`  | Botao de acao destrutiva (vermelho)       |
| `outline`      | Botao com borda e fundo transparente      |
| `secondary`    | Botao secundario com fundo suave          |
| `ghost`        | Botao transparente com hover              |
| `link`         | Botao estilizado como link                |

#### Tamanhos

| Tamanho    | Dimensoes          |
|------------|---------------------|
| `default`  | `h-9 px-4 py-2`    |
| `sm`       | `h-8 px-3`         |
| `lg`       | `h-10 px-6`        |
| `icon`     | `size-9`           |
| `icon-sm`  | `size-8`           |
| `icon-lg`  | `size-10`          |

#### Propriedade `asChild`

Quando `asChild={true}`, o botao renderiza o elemento filho direto em vez de `<button>`, usando o Radix `Slot`:

```tsx
<Button asChild>
  <a href="/pagina">Link como Botao</a>
</Button>
```

#### Exemplo de Uso

```tsx
import { Button } from '@/components/ui/button';

<Button variant="default" size="default">Salvar</Button>
<Button variant="destructive" size="sm">Excluir</Button>
<Button variant="outline" size="icon"><SearchIcon /></Button>
<Button variant="ghost" size="lg">Cancelar</Button>
```

---

### Field (Sistema de Campos)

**Arquivo:** `src/components/ui/field.tsx`

Sistema composicional de campos de formulario com orientacao responsiva. Utilizado pelos campos do TanStack Form.

#### Subcomponentes

| Componente          | Descricao                                             |
|---------------------|-------------------------------------------------------|
| `FieldSet`          | Container de conjunto de campos (`<fieldset>`)        |
| `FieldLegend`       | Legenda do fieldset com variantes `legend` e `label`  |
| `FieldGroup`        | Grupo de campos com gap automatico                    |
| `Field`             | Campo individual com orientacao (vertical/horizontal) |
| `FieldContent`      | Container do conteudo do campo                        |
| `FieldLabel`        | Label do campo com suporte a checkbox/radio           |
| `FieldTitle`        | Titulo do campo (alternativa a label)                 |
| `FieldDescription`  | Texto descritivo abaixo do campo                      |
| `FieldError`        | Mensagem de erro com suporte a array de erros         |
| `FieldSeparator`    | Separador visual entre campos                         |

#### Orientacoes do Field

```ts
const fieldVariants = cva(
  'group/field flex w-full gap-3',
  {
    variants: {
      orientation: {
        vertical: ['flex-col [&>*]:w-full'],
        horizontal: ['flex-row items-center'],
        responsive: ['flex-col @md/field-group:flex-row'],
      },
    },
    defaultVariants: {
      orientation: 'vertical',
    },
  },
);
```

| Orientacao   | Descricao                                          |
|--------------|-----------------------------------------------------|
| `vertical`   | Label acima do input (padrao)                       |
| `horizontal` | Label e input lado a lado                           |
| `responsive` | Vertical em mobile, horizontal em telas maiores     |

#### FieldError com Array de Erros

O componente `FieldError` aceita tanto `children` quanto um array de erros com deduplicacao automatica:

```tsx
<FieldError errors={field.state.meta.errors} />
```

Se houver multiplos erros, sao renderizados como lista; se apenas um, como texto simples.

#### Exemplo de Uso

```tsx
<Field data-invalid={isInvalid}>
  <FieldLabel htmlFor="nome">Nome</FieldLabel>
  <InputGroup>
    <InputGroupInput
      id="nome"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </InputGroup>
  {isInvalid && <FieldError errors={errors} />}
</Field>
```

---

### Dialog

**Arquivo:** `src/components/ui/dialog.tsx`

Modal acessivel construido sobre Radix Dialog com animacoes de entrada/saida.

#### Subcomponentes

| Componente            | Descricao                                |
|-----------------------|------------------------------------------|
| `Dialog`              | Container raiz                           |
| `DialogTrigger`       | Elemento que abre o dialog               |
| `DialogPortal`        | Portal para renderizar fora da arvore    |
| `DialogOverlay`       | Overlay escuro de fundo                  |
| `DialogContent`       | Conteudo do dialog com animacoes         |
| `DialogHeader`        | Cabecalho do dialog                      |
| `DialogFooter`        | Rodape com botoes de acao                |
| `DialogTitle`         | Titulo acessivel                         |
| `DialogDescription`   | Descricao acessivel                      |
| `DialogClose`         | Botao de fechar                          |

#### Propriedade `showCloseButton`

O `DialogContent` aceita `showCloseButton` (padrao `true`) para controlar a exibicao do botao X:

```tsx
<DialogContent showCloseButton={false}>
  {/* Conteudo sem botao de fechar */}
</DialogContent>
```

#### Exemplo de Uso

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Abrir</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Criar Tabela</DialogTitle>
      <DialogDescription>
        Preencha os dados da nova tabela.
      </DialogDescription>
    </DialogHeader>
    {/* Formulario */}
    <DialogFooter>
      <Button variant="outline">Cancelar</Button>
      <Button>Salvar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### Sidebar (Sistema Completo)

**Arquivo:** `src/components/ui/sidebar.tsx`

Sistema de sidebar composicional com suporte a modo colapsado, mobile (sheet), atalho de teclado e persistencia via cookie.

#### Constantes

| Constante                   | Valor       | Descricao                              |
|-----------------------------|-------------|----------------------------------------|
| `SIDEBAR_COOKIE_NAME`       | `sidebar_state` | Nome do cookie para persistir estado |
| `SIDEBAR_COOKIE_MAX_AGE`    | `604800`    | 7 dias em segundos                     |
| `SIDEBAR_WIDTH`             | `16rem`     | Largura padrão desktop                 |
| `SIDEBAR_WIDTH_MOBILE`      | `18rem`     | Largura no mobile (sheet)              |
| `SIDEBAR_WIDTH_ICON`        | `3rem`      | Largura no modo colapsado (icone)      |
| `SIDEBAR_KEYBOARD_SHORTCUT` | `b`         | Ctrl/Cmd + B para toggle               |

#### Subcomponentes

| Componente               | Descricao                                     |
|--------------------------|-----------------------------------------------|
| `SidebarProvider`        | Contexto + estado + atalho de teclado         |
| `Sidebar`                | Container principal (desktop ou mobile)        |
| `SidebarTrigger`         | Botao para abrir/fechar                        |
| `SidebarRail`            | Barra lateral para resize                      |
| `SidebarInset`           | Area de conteudo principal                     |
| `SidebarInput`           | Campo de busca no sidebar                      |
| `SidebarHeader`          | Cabecalho do sidebar                           |
| `SidebarFooter`          | Rodape do sidebar                              |
| `SidebarContent`         | Area de conteudo scrollavel                    |
| `SidebarGroup`           | Grupo de itens                                 |
| `SidebarGroupLabel`      | Label do grupo                                 |
| `SidebarGroupAction`     | Acao do grupo (ex: botao de adicionar)         |
| `SidebarGroupContent`    | Conteudo do grupo                              |
| `SidebarMenu`            | Lista de menu (`<ul>`)                         |
| `SidebarMenuItem`        | Item de menu (`<li>`)                          |
| `SidebarMenuButton`      | Botao de menu com tooltip e variantes          |
| `SidebarMenuAction`      | Acao do item (visivel no hover)                |
| `SidebarMenuBadge`       | Badge numerico no item                         |
| `SidebarMenuSkeleton`    | Skeleton loading para itens                    |
| `SidebarMenuSub`         | Sub-menu (lista aninhada)                      |
| `SidebarMenuSubItem`     | Item de sub-menu                               |
| `SidebarMenuSubButton`   | Botao de sub-menu                              |
| `SidebarSeparator`       | Separador dentro do sidebar                    |

#### Hook `useSidebar`

```ts
type SidebarContextProps = {
  state: 'expanded' | 'collapsed';
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};
```

#### Propriedades do Sidebar

| Propriedade   | Tipo                                   | Padrao      | Descricao                           |
|---------------|----------------------------------------|-------------|-------------------------------------|
| `side`        | `'left' \| 'right'`                   | `'left'`    | Lado do sidebar                     |
| `variant`     | `'sidebar' \| 'floating' \| 'inset'`  | `'sidebar'` | Estilo visual                       |
| `collapsible` | `'offcanvas' \| 'icon' \| 'none'`     | `'offcanvas'` | Comportamento ao colapsar        |

---

### Combobox (com Drag-and-Drop)

**Arquivo:** `src/components/ui/combobox.tsx`

Componente de selecao avancado construido sobre `@base-ui/react/combobox` com suporte a busca, selecao multipla com chips, e reordenacao via drag-and-drop (`@dnd-kit`).

#### Subcomponentes Base

| Componente          | Descricao                                   |
|---------------------|---------------------------------------------|
| `Combobox`          | Container raiz                              |
| `ComboboxInput`     | Input de busca com trigger e clear opcionais |
| `ComboboxTrigger`   | Botao para abrir o dropdown                 |
| `ComboboxClear`     | Botao para limpar selecao                   |
| `ComboboxContent`   | Popup posicionado com Portal                |
| `ComboboxList`      | Lista scrollavel de opcoes                  |
| `ComboboxItem`      | Item selecionavel com indicador de check    |
| `ComboboxGroup`     | Agrupamento de itens                        |
| `ComboboxLabel`     | Label de grupo                              |
| `ComboboxEmpty`     | Estado vazio quando nenhum item encontrado  |
| `ComboboxSeparator` | Separador entre grupos                      |
| `ComboboxValue`     | Exibicao do valor selecionado               |
| `ComboboxIcon`      | Icone do combobox                           |
| `ComboboxStatus`    | Status de carregamento                      |
| `ComboboxCollection`| Colecao de itens                            |

#### Componentes de Multi-Selecao com Chips

| Componente                | Descricao                                          |
|---------------------------|----------------------------------------------------|
| `ComboboxChips`           | Container de chips selecionados                    |
| `ComboboxChip`            | Chip individual com botao de remover               |
| `ComboboxChipsInput`      | Input dentro da area de chips                      |
| `ComboboxSortableChips`   | Chips com drag-and-drop via dnd-kit                |
| `ComboboxSortableChip`    | Chip individual com handle de arrasto e color picker |

#### Hook `useComboboxAnchor`

```ts
function useComboboxAnchor(): React.RefObject<HTMLDivElement | null>;
```

Retorna uma ref para ser usada como ancora do posicionamento do dropdown.

#### Exemplo de Uso (Selecao Simples)

```tsx
<Combobox value={selected} onValueChange={setSelected}>
  <ComboboxInput placeholder="Buscar..." />
  <ComboboxContent>
    <ComboboxList>
      {items.map((item) => (
        <ComboboxItem key={item.id} value={item.id}>
          {item.label}
        </ComboboxItem>
      ))}
      <ComboboxEmpty>Nenhum resultado</ComboboxEmpty>
    </ComboboxList>
  </ComboboxContent>
</Combobox>
```

#### Exemplo de Uso (Multi-Selecao com Drag-and-Drop)

```tsx
<ComboboxSortableChips
  items={selectedItems}
  onReorder={setSelectedItems}
  onRemove={(id) => removeItem(id)}
  getItemColor={(id) => getColor(id)}
  onItemColorChange={(id, color) => setColor(id, color)}
>
  <ComboboxChipsInput placeholder="Adicionar..." />
</ComboboxSortableChips>
```

---

### Table

**Arquivo:** `src/components/ui/table.tsx`

Componentes semanticos de tabela HTML com estilos Tailwind.

#### Subcomponentes

| Componente      | HTML       | Descricao                            |
|-----------------|------------|--------------------------------------|
| `Table`         | `<table>`  | Tabela com scroll horizontal         |
| `TableHeader`   | `<thead>`  | Cabecalho com borda inferior         |
| `TableBody`     | `<tbody>`  | Corpo da tabela                      |
| `TableFooter`   | `<tfoot>`  | Rodape com fundo suave               |
| `TableRow`      | `<tr>`     | Linha com hover e estado selecionado |
| `TableHead`     | `<th>`     | Celula de cabecalho                  |
| `TableCell`     | `<td>`     | Celula de dados                      |
| `TableCaption`  | `<caption>`| Legenda da tabela                    |

#### Exemplo de Uso

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nome</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Acoes</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {users.map((user) => (
      <TableRow key={user._id}>
        <TableCell>{user.name}</TableCell>
        <TableCell>{user.email}</TableCell>
        <TableCell>
          <Button variant="ghost" size="icon-sm">
            <EditIcon />
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### Input Group

**Arquivo:** `src/components/ui/input-group.tsx`

Sistema de input com addons (icones, botoes, texto) posicionados em qualquer lado.

#### Subcomponentes

| Componente            | Descricao                                     |
|-----------------------|-----------------------------------------------|
| `InputGroup`          | Container do grupo                            |
| `InputGroupAddon`     | Addon com posicionamento (4 direcoes)         |
| `InputGroupButton`    | Botao dentro do addon                         |
| `InputGroupText`      | Texto/icone dentro do addon                   |
| `InputGroupInput`     | Input sem bordas para composicao              |
| `InputGroupTextarea`  | Textarea sem bordas para composicao           |

#### Posicoes do Addon

| Posicao         | Descricao                        |
|-----------------|----------------------------------|
| `inline-start`  | Esquerda do input (padrao)       |
| `inline-end`    | Direita do input                 |
| `block-start`   | Acima do input                   |
| `block-end`     | Abaixo do input                  |

---

### Form (React Hook Form)

**Arquivo:** `src/components/ui/form.tsx`

Integracao com React Hook Form via Context API. Fornece componentes que conectam automaticamente campos de formulario ao estado do form.

**Nota:** Este componente e diferente do sistema TanStack Form usado nos formularios da aplicacao. Ele existe para compatibilidade com componentes que usam React Hook Form.

#### Subcomponentes

| Componente        | Descricao                                          |
|-------------------|-----------------------------------------------------|
| `Form`            | Provider do formulario (alias para `FormProvider`)  |
| `FormField`       | Wrapper do Controller com contexto                  |
| `FormItem`        | Container do campo com ID unico                     |
| `FormLabel`       | Label conectada ao campo                            |
| `FormControl`     | Wrapper do input com ARIA attributes                |
| `FormDescription` | Texto descritivo conectado via aria-describedby     |
| `FormMessage`     | Mensagem de erro do campo                           |

---

## Estrutura de Arquivos

```
src/components/ui/
  alert.tsx           # Mensagens de alerta
  avatar.tsx          # Avatar de usuario
  badge.tsx           # Badges
  button.tsx          # Botao com variantes
  calendar.tsx        # Seletor de data
  card.tsx            # Cards
  chart.tsx           # Graficos
  checkbox.tsx        # Checkbox
  collapsible.tsx     # Colapsavel
  combobox.tsx        # Select com busca e DnD
  dialog.tsx          # Modal
  dropdown-menu.tsx   # Menu dropdown
  empty.tsx           # Estado vazio
  field.tsx           # Sistema de campos
  form.tsx            # React Hook Form
  input.tsx           # Input de texto
  input-group.tsx     # Input com addons
  item.tsx            # Item generico
  label.tsx           # Label
  pagination.tsx      # Paginacao
  popover.tsx         # Popover
  select.tsx          # Select
  separator.tsx       # Separador
  sheet.tsx           # Painel lateral
  sidebar.tsx         # Sistema de sidebar
  skeleton.tsx        # Loading skeleton
  sonner.tsx          # Toast notifications
  spinner.tsx         # Spinner
  switch.tsx          # Toggle switch
  table.tsx           # Tabela HTML
  tabs.tsx            # Navegacao por abas
  textarea.tsx        # Area de texto
  tooltip.tsx         # Tooltip
```
