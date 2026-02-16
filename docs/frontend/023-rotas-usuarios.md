# Rotas de Usuarios

Documentacao das rotas de gerenciamento de usuarios do LowCodeJS, incluindo listagem paginada, criacao e edicao de usuarios.

**Diretorio fonte:** `frontend/src/routes/_private/users/`

---

## Visao Geral

O modulo de usuarios implementa operacoes CRUD com as seguintes rotas:

| Rota                     | Descricao                          |
|-------------------------|-------------------------------------|
| `/users`                | Listagem paginada com busca         |
| `/users/create`         | Formulario de criacao               |
| `/users/$userId`        | Visualizacao e edicao de um usuario |

---

## Arquivos do Modulo

| Arquivo                                  | Descricao                                   |
|-----------------------------------------|---------------------------------------------|
| `index.tsx`                             | Listagem paginada de usuarios                |
| `-table-users.tsx`                      | Componente de tabela para exibir usuarios    |
| `-table-users-skeleton.tsx`             | Skeleton loading da tabela                   |
| `create/index.tsx`                      | Rota de criacao de usuario                   |
| `create/-create-form.tsx`               | Campos do formulario de criacao              |
| `$userId/index.tsx`                     | Rota de detalhe/edicao de usuario            |
| `$userId/-update-form.tsx`              | Campos do formulario de edicao               |
| `$userId/-update-form-skeleton.tsx`     | Skeleton loading do formulario de edicao     |
| `$userId/-view.tsx`                     | Visualizacao somente leitura de um usuario   |

---

## Listagem de Usuarios (`/users` - `index.tsx`)

### Search Params Validados

A rota valida os parametros de busca com Zod:

```tsx
export const Route = createFileRoute('/_private/users/')({
  component: RouteComponent,
  validateSearch: z.object({
    search: z.string().optional(),
    page: z.coerce.number().default(1),
    perPage: z.coerce.number().default(50),
  }),
});
```

| Parametro  | Tipo     | Default | Descricao                      |
|-----------|----------|---------|--------------------------------|
| `search`  | string?  | -       | Texto para filtrar usuarios    |
| `page`    | number   | 1       | Pagina atual da paginacao      |
| `perPage` | number   | 50      | Itens por pagina               |

### Hook de Dados

```tsx
const pagination = useUserReadPaginated({
  ...search,
  authenticated: authenticated.authenticated?.sub,
});
```

### Colunas da Tabela

```tsx
const headers = ['Nome', 'E-mail', 'Papel', 'Status'];
```

### Estados de Carregamento

```tsx
{pagination.status === 'pending' && <TableUsersSkeleton headers={headers} />}
{pagination.status === 'error' && (
  <LoadError message="Houve um erro ao buscar dados dos usuarios" refetch={pagination.refetch} />
)}
{pagination.status === 'success' && (
  <TableUsers headers={headers} data={pagination.data.data} />
)}
```

### Navegacao para Criacao

O botao "Novo Usuario" fecha a sidebar e navega para `/users/create`:

```tsx
<Button
  onClick={() => {
    sidebar.setOpen(false);
    router.navigate({ to: '/users/create', replace: true });
  }}
  disabled={pagination.status === 'pending' || pagination.status === 'error'}
>
  <span>Novo Usuario</span>
</Button>
```

### Paginacao

O rodape utiliza o componente `Pagination` com os metadados da API:

```tsx
<Pagination meta={pagination.data?.meta ?? MetaDefault} />
```

Onde `MetaDefault` e `{ total: 1, perPage: 50, page: 1, lastPage: 1, firstPage: 1 }`.

---

## Tabela de Usuarios (`-table-users.tsx`)

### Interface

```tsx
interface Props {
  data: Array<IUser>;
  headers: Array<string>;
}
```

### Renderizacao de Cada Linha

Cada linha da tabela exibe:

| Coluna   | Campo        | Formatacao                                       |
|---------|-------------|--------------------------------------------------|
| Nome    | `user.name` | Texto simples                                    |
| E-mail  | `user.email`| Texto simples                                    |
| Papel   | `user.group.slug` | Mapeado via `USER_GROUP_MAPPER`             |
| Status  | `user.status` | Badge colorido (verde = Ativo, vermelho = Inativo) |

### Mapeamento de Status

```tsx
<Badge
  variant="outline"
  className={cn(
    'font-semibold border-transparent',
    user.status === E_USER_STATUS.ACTIVE && 'bg-green-100 text-green-700',
    user.status === E_USER_STATUS.INACTIVE && 'bg-destructive/10 text-destructive',
  )}
>
  {USER_STATUS_MAPPER[user.status]}
</Badge>
```

### Navegacao por Clique na Linha

Clicar em uma linha navega para os detalhes do usuario:

```tsx
<TableRow
  className="cursor-pointer"
  onClick={() => {
    sidebar.setOpen(false);
    router.navigate({
      to: '/users/$userId',
      params: { userId: user._id },
    });
  }}
>
```

---

## Skeleton da Tabela (`-table-users-skeleton.tsx`)

Renderiza 10 linhas de skeleton com larguras diferentes para cada coluna:

| Coluna   | Largura do Skeleton | Formato       |
|---------|--------------------:|---------------|
| Nome    | `w-45`              | Retangular    |
| E-mail  | `w-50`              | Retangular    |
| Papel   | `w-25`              | Retangular    |
| Status  | `w-20`              | Arredondado   |
| Acao    | `w-8`               | Quadrado      |

---

## Criacao de Usuario (`/users/create`)

### Rota (`create/index.tsx`)

```tsx
export const Route = createFileRoute('/_private/users/create/')({
  component: RouteComponent,
});
```

### Formulario com TanStack Form

```tsx
const form = useAppForm({
  defaultValues: userFormDefaultValues,
  validators: { onSubmit: UserCreateSchema },
  onSubmit: async ({ value }) => {
    if (_create.status === 'pending') return;
    await _create.mutateAsync(value);
  },
});
```

### Campos do Formulario (`-create-form.tsx`)

```tsx
export const userFormDefaultValues: UserFormType = {
  name: '',
  email: '',
  password: '',
  group: '',
};
```

| Campo    | Componente              | Tipo                   |
|---------|------------------------|------------------------|
| Nome    | `FieldText`            | Input texto com icone  |
| E-mail  | `FieldEmail`           | Input e-mail           |
| Senha   | `FieldPassword`        | Input senha            |
| Grupo   | `FieldGroupCombobox`   | Combobox de selecao    |

### Tratamento de Erros na Criacao

| Codigo | Causa                    | Acao                                          |
|--------|--------------------------|-----------------------------------------------|
| 409    | `USER_ALREADY_EXISTS`    | Erro no campo email: "Este email ja esta em uso" |
| 400    | `GROUP_NOT_INFORMED`     | Erro no campo grupo: "Grupo e obrigatorio"     |
| 400    | `INVALID_PAYLOAD_FORMAT` | Erros de validacao por campo                   |
| 500    | `CREATE_USER_ERROR`      | Toast de erro generico                         |

### Sucesso na Criacao

```tsx
onSuccess() {
  toast('Usuario criado', {
    description: 'O usuario foi criado com sucesso',
  });
  form.reset();
  navigate({ to: '/users', search: { page: 1, perPage: 50 } });
  sidebar.setOpen(true);
}
```

---

## Detalhes e Edicao de Usuario (`/users/$userId`)

### Modos de Visualizacao

O componente alterna entre dois modos usando estado local:

```tsx
const [mode, setMode] = React.useState<'show' | 'edit'>('show');
```

| Modo   | Descricao                                   |
|--------|---------------------------------------------|
| `show` | Exibe dados somente leitura + botao "Editar"|
| `edit` | Formulario editavel + botoes "Cancelar"/"Salvar" |

### Visualizacao Somente Leitura (`-view.tsx`)

```tsx
export function UserView({ data }: UserViewProps): React.JSX.Element {
  return (
    <section className="space-y-4 p-2">
      <div className="space-y-1">
        <p className="text-sm font-medium">Nome</p>
        <p className="text-sm text-muted-foreground">{data.name || '-'}</p>
      </div>
      {/* E-mail, Status (Badge), Grupo */}
    </section>
  );
}
```

Campos exibidos: Nome, E-mail, Status (com Badge Ativo/Inativo), Grupo.

### Formulario de Edicao (`-update-form.tsx`)

```tsx
export type UserUpdateFormValues = {
  name: string;
  email: string;
  password: string;
  status: ValueOf<typeof E_USER_STATUS>;
  group: string;
};
```

| Campo         | Componente              | Observacao                              |
|--------------|------------------------|-----------------------------------------|
| Nome         | `FieldText`            | Input texto com icone                   |
| E-mail       | `FieldEmail`           | Input e-mail                            |
| Senha        | `FieldPassword`        | Opcional - "Digite nova senha se quiser altera-la" |
| Status       | `FieldSwitch`          | Switch ativo/inativo                    |
| Grupo        | `FieldGroupCombobox`   | Combobox de selecao                     |

> **Nota:** No formulario de edicao, a senha e **opcional**. O campo so e enviado se preenchido: `...(value.password !== '' && { password: value.password })`.

### Tratamento de Erros na Edicao

| Codigo | Causa                    | Acao                                          |
|--------|--------------------------|-----------------------------------------------|
| 404    | `USER_NOT_FOUND`         | Toast: "O usuario que voce esta tentando atualizar nao existe" |
| 400    | `INVALID_PAYLOAD_FORMAT` | Erros de validacao por campo                   |
| 500    | `UPDATE_USER_ERROR`      | Toast de erro generico                         |

### Skeleton de Carregamento (`-update-form-skeleton.tsx`)

Renderiza skeletons para todos os campos do formulario de edicao, incluindo:

- Campos de texto (Nome, E-mail, Senha) com `InputGroup` e `Skeleton`
- Campo Status com `Switch` skeleton
- Campo Grupo com `Skeleton` retangular
- Botao com `Skeleton`

---

## Fluxo de Navegacao

```
/users (listagem)
  |-- Clique em "Novo Usuario" --> /users/create
  |-- Clique em uma linha --> /users/$userId (modo show)
        |-- Clique em "Editar" --> /users/$userId (modo edit)
        |-- Clique em "Cancelar" --> /users/$userId (modo show)
        |-- Clique em "Salvar" --> submissao e volta para modo show
  |-- Botao voltar (<-) --> /users
```

---

## Dependencias

| Dependencia                  | Uso                                           |
|-----------------------------|-----------------------------------------------|
| `@tanstack/react-router`   | Roteamento e search params                    |
| `@tanstack/react-form`     | Gerenciamento de formularios (via `useAppForm`)|
| `zod`                       | Validacao de search params e schemas          |
| `axios`                     | Requisicoes HTTP (AxiosError)                 |
| `sonner`                    | Toasts de feedback                            |
| `lucide-react`              | Icones                                        |
