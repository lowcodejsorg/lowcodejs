# Detalhes do Usuario

Pagina de visualizacao e edicao de um usuario existente. Alterna entre modo
"show" (somente leitura) e modo "edit" (formulario).

## Rota

- Path: `/users/$userId`
- Param: `userId` (ID do usuario no MongoDB)

## Loader

Carrega dados do usuario via `userDetailOptions(params.userId)` usando
`ensureQueryData`.

## Arquivos

| Arquivo                     | Descricao                                                                                       |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| `index.tsx`                 | Definicao da rota: loader com `userDetailOptions`, pendingComponent skeleton                    |
| `index.lazy.tsx`            | Componente principal: modos show/edit, header com botao Editar, formulario de atualizacao       |
| `-view.tsx`                 | Componente de visualizacao somente leitura (nome, email, status badge, grupo)                   |
| `-update-form.tsx`          | Campos do formulario de edicao via `withForm`, schema de validacao, tipo `UserUpdateFormValues` |
| `-update-form-skeleton.tsx` | Skeleton de carregamento do formulario                                                          |

## Campos do formulario (modo edit)

| Campo      | Componente           | Observacao                                                           |
| ---------- | -------------------- | -------------------------------------------------------------------- |
| `name`     | `FieldText`          | -                                                                    |
| `email`    | `FieldEmail`         | -                                                                    |
| `password` | `FieldPassword`      | Condicional: visivel apenas quando switch "Alterar senha" esta ativo |
| `status`   | `FieldSwitch`        | Ativo/Inativo                                                        |
| `group`    | `FieldGroupCombobox` | -                                                                    |

## Validacao

- Schema: `UserUpdateFormSchema` (importado de `@/lib/schemas`)
- Validacao em `onChange` e `onSubmit`
- Senha (quando habilitada): minimo 6 caracteres, maiuscula, minuscula, numero,
  caractere especial

## Hooks e dependencias principais

| Hook/Funcao              | Origem                                   |
| ------------------------ | ---------------------------------------- |
| `userDetailOptions`      | `@/hooks/tanstack-query/_query-options`  |
| `useUpdateUser`          | `@/hooks/tanstack-query/use-user-update` |
| `useSuspenseQuery`       | `@tanstack/react-query`                  |
| `useAppForm`             | `@/integrations/tanstack-form/form-hook` |
| `withForm`               | `@/integrations/tanstack-form/form-hook` |
| `createFieldErrorSetter` | `@/lib/form-utils`                       |
| `handleApiError`         | `@/lib/handle-api-error`                 |
| `useSidebar`             | `@/components/ui/sidebar`                |

## Fluxo

1. Loader carrega dados do usuario por ID via `userDetailOptions`
2. Modo "show": exibe dados somente leitura via `UserView`
3. Botao "Editar" alterna para modo "edit" com formulario preenchido
4. Submit dispara `useUpdateUser.mutateAsync` (senha enviada apenas se switch
   ativo e campo preenchido)
5. Sucesso: toast de confirmacao, reset do form, volta para modo "show", router
   invalidado
6. Erro: `handleApiError` exibe erros gerais e aplica erros de campo via
   `setFieldError`
7. Botao "Cancelar" reseta o form e volta para modo "show"
