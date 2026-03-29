# Criacao de Grupo de Usuarios

Formulario para criacao de um novo grupo de usuarios com validacao via Zod.

## Rota

`/groups/create`

## Arquivos

| Arquivo            | Descricao                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| `index.tsx`        | Route config minima (sem loader nem guard proprio, herda do pai)                                        |
| `index.lazy.tsx`   | Componente principal: monta o formulario com `useAppForm`, gerencia submit e callbacks de sucesso/erro  |
| `-create-form.tsx` | Define campos do formulario usando `withForm`, exporta `CreateGroupFormFields`, schema e default values |

## Campos do Formulario

| Campo         | Tipo            | Obrigatorio | Componente                   |
| ------------- | --------------- | ----------- | ---------------------------- |
| `name`        | string          | sim         | `FieldText`                  |
| `description` | string          | nao         | `FieldTextarea`              |
| `permissions` | Array\<string\> | sim (min 1) | `FieldPermissionMultiSelect` |

## Mutation

Usa `useCreateGroup` de `@/hooks/tanstack-query/use-group-create`. O payload
enviado contem `name`, `description` (ou null) e `permissions`.

## Fluxo

1. Usuario acessa `/groups/create` via botao "Novo Grupo" na listagem
2. Preenche nome, descricao (opcional) e seleciona permissoes
3. Validacao client-side via `UserGroupCreateBodySchema` (onChange + onSubmit)
4. Ao submeter, `useCreateGroup.mutateAsync` envia dados para a API
5. Sucesso: toast de confirmacao, reset do form, navega de volta para `/groups`
6. Erro: exibe erros de campo via `createFieldErrorSetter` ou toast generico via
   `handleApiError`

## Hooks Utilizados

| Hook             | Origem                                    | Uso                                       |
| ---------------- | ----------------------------------------- | ----------------------------------------- |
| `useAppForm`     | `@/integrations/tanstack-form/form-hook`  | Gerencia estado e validacao do formulario |
| `useCreateGroup` | `@/hooks/tanstack-query/use-group-create` | Mutation de criacao do grupo              |
| `useSidebar`     | `@/components/ui/sidebar`                 | Reabre sidebar ao voltar para listagem    |
