# Detalhes e Edicao de Grupo de Usuarios

Tela de visualizacao e edicao de um grupo de usuarios existente, com alternancia
entre modos "show" e "edit".

## Rota

`/groups/$groupId` -- parametro dinamico `groupId` identifica o grupo.

## Arquivos

| Arquivo                     | Descricao                                                                                                                           |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `index.tsx`                 | Route config: loader carrega dados do grupo via `groupDetailOptions(params.groupId)`, pendingComponent com skeleton                 |
| `index.lazy.tsx`            | Componente principal: alterna entre modo visualizacao (`GroupView`) e edicao (`UpdateGroupFormFields`), gerencia mutation de update |
| `-view.tsx`                 | Componente read-only que exibe slug, nome, descricao e lista de permissoes com badges                                               |
| `-update-form.tsx`          | Define campos do formulario de edicao usando `withForm`, exporta `UpdateGroupFormFields`, schema e tipos                            |
| `-update-form-skeleton.tsx` | Skeleton de loading para o formulario, usado como `pendingComponent`                                                                |

## Loader

Usa `groupDetailOptions(groupId)` de `@/hooks/tanstack-query/_query-options`
para pre-carregar dados do grupo no `queryClient`.

## Campos do Formulario (modo edit)

| Campo         | Tipo            | Obrigatorio | Editavel        | Componente                     |
| ------------- | --------------- | ----------- | --------------- | ------------------------------ |
| `slug`        | string          | -           | nao (read-only) | `InputGroupInput` desabilitado |
| `name`        | string          | sim         | sim             | `FieldText`                    |
| `description` | string          | nao         | sim             | `FieldTextarea`                |
| `permissions` | Array\<string\> | sim (min 1) | sim             | `FieldPermissionMultiSelect`   |

## Mutation

Usa `useUpdateGroup` de `@/hooks/tanstack-query/use-group-update`. O payload
inclui `_id`, `name`, `description` (ou null) e `permissions`.

## Fluxo

1. Loader carrega dados do grupo pelo `groupId` do parametro da rota
2. Modo **show**: exibe dados read-only via `GroupView` com botao "Editar"
3. Usuario clica "Editar": alterna para modo **edit** com formulario
   pre-preenchido
4. Validacao client-side via `UserGroupUpdateBodySchema` (onChange + onSubmit)
5. Ao submeter, `useUpdateGroup.mutateAsync` envia dados para a API
6. Sucesso: toast de confirmacao, reset do form, volta para modo show,
   `router.invalidate()` recarrega dados
7. Erro: exibe erros de campo via `createFieldErrorSetter` ou toast generico via
   `handleApiError`
8. Botao "Cancelar" reseta o form e volta para modo show

## Hooks Utilizados

| Hook               | Origem                                    | Uso                                                 |
| ------------------ | ----------------------------------------- | --------------------------------------------------- |
| `useSuspenseQuery` | @tanstack/react-query                     | Busca detalhes do grupo via `groupDetailOptions`    |
| `useAppForm`       | `@/integrations/tanstack-form/form-hook`  | Gerencia estado e validacao do formulario de edicao |
| `useUpdateGroup`   | `@/hooks/tanstack-query/use-group-update` | Mutation de atualizacao do grupo                    |
| `useSidebar`       | `@/components/ui/sidebar`                 | Controla sidebar na navegacao                       |
| `useParams`        | @tanstack/react-router                    | Extrai `groupId` da URL                             |
