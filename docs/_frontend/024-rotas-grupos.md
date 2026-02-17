# Rotas de Grupos

Documentacao das rotas de gerenciamento de grupos de usuarios do LowCodeJS, incluindo listagem paginada, criacao, edicao e configuracao de permissoes.

**Diretorio fonte:** `frontend/src/routes/_private/groups/`

---

## Visao Geral

O modulo de grupos permite gerenciar os papeis de acesso do sistema. Cada grupo possui nome, descricao e um conjunto de permissoes que controlam o que os usuarios daquele grupo podem fazer.

| Rota                      | Descricao                          |
|--------------------------|-------------------------------------|
| `/groups`                | Listagem paginada de grupos         |
| `/groups/create`         | Formulario de criacao de grupo      |
| `/groups/$groupId`       | Visualizacao e edicao de um grupo   |

---

## Arquivos do Modulo

| Arquivo                                    | Descricao                                   |
|-------------------------------------------|---------------------------------------------|
| `index.tsx`                               | Listagem paginada de grupos                  |
| `-table-groups.tsx`                       | Componente de tabela para exibir grupos      |
| `-table-groups-skeleton.tsx`              | Skeleton loading da tabela                   |
| `create/index.tsx`                        | Rota de criacao de grupo                     |
| `create/-create-form.tsx`                 | Campos do formulario de criacao              |
| `$groupId/index.tsx`                      | Rota de detalhe/edicao de grupo              |
| `$groupId/-update-form.tsx`               | Campos do formulario de edicao               |
| `$groupId/-update-form-skeleton.tsx`      | Skeleton loading do formulario de edicao     |
| `$groupId/-view.tsx`                      | Visualizacao somente leitura de um grupo     |

---

## Listagem de Grupos (`/groups` - `index.tsx`)

### Search Params Validados

```tsx
export const Route = createFileRoute('/_private/groups/')({
  component: RouteComponent,
  validateSearch: z.object({
    search: z.string().optional(),
    page: z.coerce.number().default(1),
    perPage: z.coerce.number().default(50),
  }),
});
```

| Parametro  | Tipo     | Default | Descricao                     |
|-----------|----------|---------|-------------------------------|
| `search`  | string?  | -       | Texto para filtrar grupos     |
| `page`    | number   | 1       | Pagina atual                  |
| `perPage` | number   | 50      | Itens por pagina              |

### Hook de Dados

```tsx
const pagination = useGroupReadPaginated(search);
```

### Colunas da Tabela

```tsx
const headers = ['Nome', 'Slug', 'Descricao'];
```

### Estados de Carregamento

O componente renderiza condicionalmente com base no status da requisicao:

```tsx
{pagination.status === 'pending' && <TableGroupsSkeleton headers={headers} />}
{pagination.status === 'error' && (
  <LoadError message="Houve um erro ao buscar dados dos grupos" refetch={pagination.refetch} />
)}
{pagination.status === 'success' && (
  <TableGroups headers={headers} data={pagination.data.data} />
)}
```

---

## Tabela de Grupos (`-table-groups.tsx`)

### Mapeamento de Nome do Grupo

Grupos com slugs conhecidos sao exibidos com nomes traduzidos:

```tsx
{group.slug in USER_GROUP_MAPPER &&
  USER_GROUP_MAPPER[group.slug as keyof typeof USER_GROUP_MAPPER]}
{!(group.slug in USER_GROUP_MAPPER) && group.name}
```

| Slug              | Nome Exibido                  |
|-------------------|-------------------------------|
| `ADMINISTRATOR`   | Administrador                 |
| `REGISTERED`      | Registrado                    |
| `MANAGER`         | Gerente                       |
| `MASTER`          | Master (Super Administrador)  |
| Outro             | `group.name` original         |

### Navegacao por Clique

Clicar na linha navega para os detalhes:

```tsx
onClick={() => {
  sidebar.setOpen(false);
  router.navigate({
    to: '/groups/$groupId',
    params: { groupId: group._id },
  });
}}
```

---

## Criacao de Grupo (`/groups/create`)

### Rota (`create/index.tsx`)

```tsx
export const Route = createFileRoute('/_private/groups/create/')({
  component: RouteComponent,
});
```

### Campos do Formulario (`-create-form.tsx`)

```tsx
export const groupFormDefaultValues: GroupFormType = {
  name: '',
  description: '',
  permissions: [],
};
```

| Campo       | Componente                      | Obrigatorio | Validacao                           |
|------------|--------------------------------|-------------|-------------------------------------|
| Nome       | `FieldText`                    | Sim         | `onBlur`: nao pode ser vazio        |
| Descricao  | `FieldTextarea`                | Nao         | -                                   |
| Permissoes | `FieldPermissionMultiSelect`   | Sim         | `onBlur`: ao menos uma selecionada  |

### Exemplo do Campo de Permissoes

```tsx
<form.AppField
  name="permissions"
  validators={{
    onBlur: ({ value }) => {
      if (value.length === 0) {
        return { message: 'Selecione ao menos uma permissao' };
      }
      return undefined;
    },
  }}
>
  {(field) => (
    <field.FieldPermissionMultiSelect
      label="Permissoes"
      placeholder="Selecione as permissoes..."
      disabled={isPending}
      required
    />
  )}
</form.AppField>
```

### Tratamento de Erros na Criacao

| Codigo | Causa                      | Acao                                            |
|--------|----------------------------|-------------------------------------------------|
| 409    | `GROUP_EXISTS`             | Erro no campo nome: "Ja existe um grupo com este nome" |
| 400    | `INVALID_PAYLOAD_FORMAT`   | Erros de validacao por campo                     |
| 500    | `CREATE_USER_GROUP_ERROR`  | Toast de erro generico                           |

### Sucesso na Criacao

```tsx
onSuccess() {
  toast('Grupo criado', {
    description: 'O grupo foi criado com sucesso',
  });
  form.reset();
  navigate({ to: '/groups', search: { page: 1, perPage: 50 } });
  sidebar.setOpen(true);
}
```

---

## Detalhes e Edicao de Grupo (`/groups/$groupId`)

### Modos de Visualizacao

```tsx
const [mode, setMode] = React.useState<'show' | 'edit'>('show');
```

| Modo   | Descricao                                    |
|--------|----------------------------------------------|
| `show` | Dados somente leitura + botao "Editar"       |
| `edit` | Formulario editavel + botoes "Cancelar"/"Salvar" |

### Visualizacao Somente Leitura (`-view.tsx`)

Exibe os dados do grupo com mapeamento de roles:

```tsx
const RoleMapper = {
  [E_ROLE.ADMINISTRATOR]: 'Administrador',
  [E_ROLE.REGISTERED]: 'Registrado',
  [E_ROLE.MANAGER]: 'Gerente',
  [E_ROLE.MASTER]: 'Dono',
};
```

Campos exibidos:

| Campo       | Renderizacao                                    |
|------------|------------------------------------------------|
| Slug       | Mapeado via `RoleMapper` ou exibido como texto  |
| Nome       | Texto simples                                   |
| Descricao  | Texto simples ou "-"                            |
| Permissoes | Lista de `Badge` com nome de cada permissao     |

### Formulario de Edicao (`-update-form.tsx`)

```tsx
export type GroupUpdateFormValues = {
  name: string;
  description: string;
  permissions: Array<string>;
};
```

| Campo       | Componente                      | Observacao                          |
|------------|--------------------------------|-------------------------------------|
| Slug       | `InputGroupInput` (read-only)  | Sempre desabilitado, fundo `bg-muted`|
| Nome       | `FieldText`                    | Validacao `onBlur`                  |
| Descricao  | `FieldTextarea`                | Opcional, 3 linhas                  |
| Permissoes | `FieldPermissionMultiSelect`   | Ao menos uma obrigatoria           |

### Tratamento de Erros na Edicao

| Codigo | Causa                       | Acao                                            |
|--------|-----------------------------|-------------------------------------------------|
| 404    | `USER_GROUP_NOT_FOUND`      | Toast: "O grupo que voce esta tentando atualizar nao existe" |
| 400    | `INVALID_PAYLOAD_FORMAT`    | Erros de validacao por campo                     |
| 500    | `UPDATE_USER_GROUP_ERROR`   | Toast de erro generico                           |

---

## Matriz de Permissoes

O sistema define 12 permissoes organizadas em uma matriz de operacoes x recursos:

```tsx
export const E_TABLE_PERMISSION = {
  CREATE_TABLE: 'CREATE_TABLE',
  UPDATE_TABLE: 'UPDATE_TABLE',
  REMOVE_TABLE: 'REMOVE_TABLE',
  VIEW_TABLE: 'VIEW_TABLE',
  CREATE_FIELD: 'CREATE_FIELD',
  UPDATE_FIELD: 'UPDATE_FIELD',
  REMOVE_FIELD: 'REMOVE_FIELD',
  VIEW_FIELD: 'VIEW_FIELD',
  CREATE_ROW: 'CREATE_ROW',
  UPDATE_ROW: 'UPDATE_ROW',
  REMOVE_ROW: 'REMOVE_ROW',
  VIEW_ROW: 'VIEW_ROW',
} as const;
```

### Tabela de Permissoes

| Operacao   | Tabela (TABLE)   | Campo (FIELD)   | Registro (ROW)   |
|-----------|-----------------|-----------------|-------------------|
| CREATE    | `CREATE_TABLE`  | `CREATE_FIELD`  | `CREATE_ROW`      |
| UPDATE    | `UPDATE_TABLE`  | `UPDATE_FIELD`  | `UPDATE_ROW`      |
| REMOVE    | `REMOVE_TABLE`  | `REMOVE_FIELD`  | `REMOVE_ROW`      |
| VIEW      | `VIEW_TABLE`    | `VIEW_FIELD`    | `VIEW_ROW`        |

Cada permissao e selecionavel individualmente no `FieldPermissionMultiSelect`, permitindo configuracao granular de acesso.

---

## Fluxo de Navegacao

```
/groups (listagem)
  |-- Clique em "Novo Grupo" --> /groups/create
  |-- Clique em uma linha --> /groups/$groupId (modo show)
        |-- Clique em "Editar" --> /groups/$groupId (modo edit)
        |-- Clique em "Cancelar" --> /groups/$groupId (modo show)
        |-- Clique em "Salvar" --> submissao e volta para modo show
  |-- Botao voltar (<-) --> /groups
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
| `lucide-react`              | Icones (UsersIcon, HashIcon, ArrowLeftIcon)   |
