# Rotas de Menus

Documentacao das rotas de gerenciamento de menus do LowCodeJS, incluindo listagem paginada, criacao e edicao de itens de menu com campos dinamicos por tipo.

**Diretorio fonte:** `frontend/src/routes/_private/menus/`

---

## Visao Geral

O modulo de menus permite criar e gerenciar os itens que compoem a sidebar do sistema. Cada item de menu possui um tipo que determina quais campos adicionais devem ser preenchidos, tornando o formulario dinamico.

| Rota                     | Descricao                          |
|-------------------------|-------------------------------------|
| `/menus`                | Listagem paginada de menus          |
| `/menus/create`         | Formulario de criacao de menu       |
| `/menus/$menuId`        | Visualizacao e edicao de um menu    |

---

## Arquivos do Modulo

| Arquivo                                   | Descricao                                    |
|------------------------------------------|----------------------------------------------|
| `index.tsx`                              | Listagem paginada de menus                    |
| `-table-menus.tsx`                       | Componente de tabela para exibir menus        |
| `-table-menus-skeleton.tsx`              | Skeleton loading da tabela                    |
| `-separator-info.tsx`                    | Card informativo sobre menus separadores      |
| `create/index.tsx`                       | Rota de criacao de menu                       |
| `create/-create-form.tsx`                | Campos do formulario de criacao               |
| `$menuId/index.tsx`                      | Rota de detalhe/edicao de menu                |
| `$menuId/-update-form.tsx`               | Campos do formulario de edicao                |
| `$menuId/-update-form-skeleton.tsx`      | Skeleton loading do formulario de edicao      |
| `$menuId/-view.tsx`                      | Visualizacao somente leitura de um menu       |

---

## Tipos de Menu

O sistema suporta 5 tipos de itens de menu, cada um com campos e comportamentos diferentes:

| Tipo         | Constante                    | Descricao                                    | Campos Especificos         |
|-------------|------------------------------|----------------------------------------------|---------------------------|
| Tabela      | `E_MENU_ITEM_TYPE.TABLE`    | Exibe dados de uma tabela na sidebar          | `table` (obrigatorio)     |
| Pagina      | `E_MENU_ITEM_TYPE.PAGE`     | Exibe conteudo HTML customizado               | `html` (obrigatorio)      |
| Formulario  | `E_MENU_ITEM_TYPE.FORM`     | Exibe formulario baseado em uma tabela        | `table` (obrigatorio)     |
| Link Externo| `E_MENU_ITEM_TYPE.EXTERNAL` | Redireciona para URL externa                  | `url` (obrigatorio)       |
| Separador   | `E_MENU_ITEM_TYPE.SEPARATOR`| Agrupa outros itens (sem navegacao propria)   | Nenhum                    |

### Campos Condicionais por Tipo

| Campo     | TABLE | PAGE | FORM | EXTERNAL | SEPARATOR |
|----------|-------|------|------|----------|-----------|
| Nome     | Sim   | Sim  | Sim  | Sim      | Sim       |
| Tipo     | Sim   | Sim  | Sim  | Sim      | Sim       |
| Menu Pai | Sim   | Sim  | Sim  | Sim      | Nao       |
| Tabela   | Sim   | Nao  | Sim  | Nao      | Nao       |
| HTML     | Nao   | Sim  | Nao  | Nao      | Nao       |
| URL      | Nao   | Nao  | Nao  | Sim      | Nao       |
| Info     | Nao   | Nao  | Nao  | Nao      | Sim       |

---

## Listagem de Menus (`/menus` - `index.tsx`)

### Search Params Validados

```tsx
export const Route = createFileRoute('/_private/menus/')({
  component: RouteComponent,
  validateSearch: z.object({
    page: z.coerce.number().default(1),
    perPage: z.coerce.number().default(50),
  }),
});
```

| Parametro  | Tipo   | Default | Descricao            |
|-----------|--------|---------|----------------------|
| `page`    | number | 1       | Pagina atual         |
| `perPage` | number | 50      | Itens por pagina     |

### Colunas da Tabela

```tsx
const headers = ['Nome', 'Slug', 'Tipo'];
```

### Estados de Carregamento

```tsx
{pagination.status === 'pending' && <TableMenusSkeleton headers={headers} />}
{pagination.status === 'error' && (
  <LoadError message="Houve um erro ao buscar dados dos menus" refetch={pagination.refetch} />
)}
{pagination.status === 'success' && <TableMenus data={pagination.data.data} />}
```

---

## Tabela de Menus (`-table-menus.tsx`)

### Mapeamento de Tipos

```tsx
const TypeMapper = {
  [E_MENU_ITEM_TYPE.PAGE]: 'Pagina',
  [E_MENU_ITEM_TYPE.TABLE]: 'Tabela',
  [E_MENU_ITEM_TYPE.FORM]: 'Formulario',
  [E_MENU_ITEM_TYPE.EXTERNAL]: 'Link Externo',
  [E_MENU_ITEM_TYPE.SEPARATOR]: 'Separador',
};
```

### Badges Coloridos por Tipo

Cada tipo possui uma cor distinta para facil identificacao visual:

| Tipo         | Cor de Fundo         | Cor do Texto         |
|-------------|---------------------|---------------------|
| `PAGE`      | `bg-green-100`      | `text-green-700`    |
| `TABLE`     | `bg-yellow-100`     | `text-yellow-700`   |
| `FORM`      | `bg-blue-100`       | `text-blue-700`     |
| `EXTERNAL`  | `bg-violet-100`     | `text-violet-700`   |
| `SEPARATOR` | `bg-gray-100`       | `text-gray-700`     |

### Estado Vazio

Quando nao ha itens de menu, exibe uma mensagem centralizada:

```tsx
{data.length === 0 && (
  <TableRow>
    <TableCell colSpan={headers.length + 1} className="text-center py-8 text-muted-foreground">
      Nenhum item de menu encontrado
    </TableCell>
  </TableRow>
)}
```

---

## Componente SeparatorInfo (`-separator-info.tsx`)

Card informativo exibido quando o tipo de menu selecionado e `SEPARATOR`:

```tsx
export function SeparatorInfo(): React.JSX.Element {
  return (
    <div className="bg-primary/10 border border-primary/20 rounded-md p-4">
      <div className="flex items-start gap-3">
        <InfoIcon className="size-5 text-primary mt-0.5" />
        <div className="flex flex-col gap-1">
          <h4 className="font-medium text-primary">Menu Separador</h4>
          <p className="text-sm text-primary">
            Este tipo de menu e usado apenas para agrupar outros itens de menu.
            Ele nao possui navegacao propria e serve como um organizador visual
            na estrutura do menu.
          </p>
        </div>
      </div>
    </div>
  );
}
```

Este componente aparece no lugar dos campos condicionais quando o tipo `SEPARATOR` e selecionado.

---

## Criacao de Menu (`/menus/create`)

### Rota (`create/index.tsx`)

```tsx
export const Route = createFileRoute('/_private/menus/create/')({
  component: RouteComponent,
});
```

### Tipo Reativo com `useStore`

O tipo do menu e observado reativamente para controlar quais campos exibir:

```tsx
const menuType = useStore(form.store, (state) => state.values.type) as
  | ValueOf<typeof E_MENU_ITEM_TYPE>
  | '';
```

### Valores Padrao do Formulario

```tsx
export const menuFormDefaultValues: MenuFormType = {
  name: '',
  type: E_MENU_ITEM_TYPE.SEPARATOR,
  table: '',
  html: '',
  url: '',
  parent: '',
};
```

### Campos do Formulario (`-create-form.tsx`)

| Campo      | Componente               | Condicao de Exibicao              | Validacao                          |
|-----------|--------------------------|-----------------------------------|------------------------------------|
| Nome      | `FieldText`              | Sempre                            | `onBlur`: nao pode ser vazio       |
| Tipo      | `FieldMenuTypeSelect`    | Sempre                            | `onBlur`: nao pode ser vazio       |
| Menu Pai  | `FieldMenuCombobox`      | Tipo != `SEPARATOR`               | Nenhuma (opcional)                 |
| Tabela    | `TableComboboxField`     | Tipo == `TABLE` ou `FORM`         | `onBlur`: nao pode ser vazio       |
| HTML      | `FieldEditor`            | Tipo == `PAGE`                    | `onChange`: nao pode ser vazio ou `<p></p>` |
| URL       | `FieldUrl`               | Tipo == `EXTERNAL`                | `onBlur`: nao pode ser vazio + URL valida |

### Exemplo de Campo Condicional

```tsx
{/* Campo Tabela - Condicional para tipos TABLE e FORM */}
{(menuType === E_MENU_ITEM_TYPE.TABLE ||
  menuType === E_MENU_ITEM_TYPE.FORM) && (
  <form.AppField
    name="table"
    validators={{
      onBlur: ({ value }) => {
        if (value.trim() === '') {
          return { message: 'Tabela e obrigatoria' };
        }
        return undefined;
      },
    }}
  >
    {(field) => (
      <field.TableComboboxField
        label="Tabela"
        placeholder="Selecione uma tabela..."
        disabled={isPending}
        required
      />
    )}
  </form.AppField>
)}
```

### Payload de Submissao

Campos vazios sao convertidos para `null` antes do envio:

```tsx
await _create.mutateAsync({
  name: value.name,
  type: value.type,
  parent: value.parent || null,
  table: value.table || null,
  html: value.html || null,
  url: value.url || null,
});
```

### Tratamento de Erros na Criacao

| Codigo | Causa                     | Acao                                                    |
|--------|---------------------------|---------------------------------------------------------|
| 404    | `PARENT_MENU_NOT_FOUND`   | Erro no campo parent: "Menu pai nao encontrado"          |
| 409    | `MENU_ALREADY_EXISTS`     | Erro no campo nome: "Ja existe um menu com este nome"    |
| 404    | `TABLE_NOT_FOUND`         | Erro no campo tabela: "Tabela nao encontrada"            |
| 400    | `INVALID_PARAMETERS`      | Erro no campo tabela: "Tabela e obrigatoria para este tipo" |
| 400    | `INVALID_PAYLOAD_FORMAT`  | Erros de validacao por campo                             |
| 500    | `CREATE_MENU_ERROR`       | Toast de erro generico                                   |

---

## Detalhes e Edicao de Menu (`/menus/$menuId`)

### Modos de Visualizacao

```tsx
const [mode, setMode] = React.useState<'show' | 'edit'>('show');
```

### Visualizacao Somente Leitura (`-view.tsx`)

O componente exibe campos diferentes com base no tipo do menu:

```tsx
{data.type !== E_MENU_ITEM_TYPE.SEPARATOR && (
  <div className="space-y-1">
    <p className="text-sm font-medium">Menu Pai</p>
    <p className="text-sm text-muted-foreground">
      {data.parent?.name || 'Nenhum (raiz)'}
    </p>
  </div>
)}

{(data.type === E_MENU_ITEM_TYPE.TABLE ||
  data.type === E_MENU_ITEM_TYPE.FORM) && (
  <div className="space-y-1">
    <p className="text-sm font-medium">Tabela</p>
    <p className="text-sm text-muted-foreground">{data.table?.name || '-'}</p>
  </div>
)}
```

| Tipo         | Campos Exibidos na Visualizacao                           |
|-------------|----------------------------------------------------------|
| `TABLE`     | Nome, Tipo, Menu Pai, Tabela                              |
| `PAGE`      | Nome, Tipo, Menu Pai, Conteudo HTML (renderizado)         |
| `FORM`      | Nome, Tipo, Menu Pai, Tabela                              |
| `EXTERNAL`  | Nome, Tipo, Menu Pai, URL (como link clicavel)            |
| `SEPARATOR` | Nome, Tipo, Mensagem informativa sobre separador          |

### Conteudo HTML para Tipo `PAGE`

O conteudo HTML e renderizado usando `dangerouslySetInnerHTML`:

```tsx
{data.html ? (
  <div
    className="text-sm text-muted-foreground prose prose-sm max-w-none"
    dangerouslySetInnerHTML={{ __html: data.html }}
  />
) : (
  <p className="text-sm text-muted-foreground">-</p>
)}
```

### URL para Tipo `EXTERNAL`

A URL e exibida como link clicavel abrindo em nova aba:

```tsx
<a
  href={data.url}
  target="_blank"
  rel="noopener noreferrer"
  className="text-sm text-primary hover:underline"
>
  {data.url}
</a>
```

### Formulario de Edicao (`-update-form.tsx`)

```tsx
export type MenuUpdateFormValues = {
  name: string;
  type: ValueOf<typeof E_MENU_ITEM_TYPE>;
  table: string;
  html: string;
  url: string;
  parent: string;
};
```

O formulario de edicao possui a mesma logica condicional do formulario de criacao, com um diferencial: o campo `FieldEditor` no modo `PAGE` recebe `showPreview={mode === 'show'}` para exibir preview no modo visualizacao.

### Inicializacao do Formulario com Dados Existentes

```tsx
const form = useAppForm({
  defaultValues: {
    name: data.name,
    type: data.type,
    table: data.table?._id ?? '',
    html: data.html ?? '',
    url: data.url ?? '',
    parent: data.parent?._id ?? '',
  } satisfies MenuUpdateFormValues,
  // ...
});
```

### Tratamento de Erros na Edicao

| Codigo | Causa                     | Acao                                                    |
|--------|---------------------------|---------------------------------------------------------|
| 404    | `MENU_NOT_FOUND`          | Toast: "O menu que voce esta tentando atualizar nao existe" |
| 404    | `PARENT_MENU_NOT_FOUND`   | Erro no campo parent: "Menu pai nao encontrado"          |
| 409    | `MENU_ALREADY_EXISTS`     | Erro no campo nome: "Ja existe um menu com este nome"    |
| 404    | `TABLE_NOT_FOUND`         | Erro no campo tabela: "Tabela nao encontrada"            |
| 400    | `INVALID_PARAMETERS`      | Erro no campo tabela: "Tabela e obrigatoria para este tipo" |
| 400    | `INVALID_PAYLOAD_FORMAT`  | Erros de validacao por campo                             |
| 500    | `UPDATE_MENU_ERROR`       | Toast de erro generico                                   |

---

## Fluxo de Navegacao

```
/menus (listagem)
  |-- Clique em "Novo Menu" --> /menus/create
  |-- Clique em uma linha --> /menus/$menuId (modo show)
        |-- Clique em "Editar" --> /menus/$menuId (modo edit)
        |-- Clique em "Cancelar" --> /menus/$menuId (modo show)
        |-- Clique em "Salvar" --> submissao e volta para modo show
  |-- Botao voltar (<-) --> /menus
```

---

## Dependencias

| Dependencia                  | Uso                                              |
|-----------------------------|--------------------------------------------------|
| `@tanstack/react-router`   | Roteamento e search params                        |
| `@tanstack/react-store`    | `useStore` para observar tipo de menu reativamente|
| `@tanstack/react-form`     | Gerenciamento de formularios (via `useAppForm`)   |
| `zod`                       | Validacao de search params e schemas              |
| `axios`                     | Requisicoes HTTP (AxiosError)                     |
| `sonner`                    | Toasts de feedback                                |
| `lucide-react`              | Icones (FileTextIcon, FolderTreeIcon, InfoIcon)   |
