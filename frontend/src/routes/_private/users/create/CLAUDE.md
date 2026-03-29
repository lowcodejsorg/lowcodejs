# Criar Usuario

Formulario de criacao de novo usuario no sistema.

## Rota

- Path: `/users/create`

## Arquivos

| Arquivo            | Descricao                                                                  |
| ------------------ | -------------------------------------------------------------------------- |
| `index.tsx`        | Definicao da rota (vazia, sem loader)                                      |
| `index.lazy.tsx`   | Componente principal: formulario com header, campos, botoes Cancelar/Criar |
| `-create-form.tsx` | Campos do formulario via `withForm`, schema de validacao e valores default |

## Campos do formulario

| Campo      | Componente           | Obrigatorio |
| ---------- | -------------------- | ----------- |
| `name`     | `FieldText`          | Sim         |
| `email`    | `FieldEmail`         | Sim         |
| `password` | `FieldPassword`      | Sim         |
| `group`    | `FieldGroupCombobox` | Sim         |

## Validacao

- Schema: `UserCreateBodySchema` (importado de `@/lib/schemas`)
- Validacao aplicada em `onChange` e `onSubmit`

## Hooks e dependencias principais

| Hook/Funcao              | Origem                                   |
| ------------------------ | ---------------------------------------- |
| `useCreateUser`          | `@/hooks/tanstack-query/use-user-create` |
| `useAppForm`             | `@/integrations/tanstack-form/form-hook` |
| `withForm`               | `@/integrations/tanstack-form/form-hook` |
| `createFieldErrorSetter` | `@/lib/form-utils`                       |
| `handleApiError`         | `@/lib/handle-api-error`                 |
| `useSidebar`             | `@/components/ui/sidebar`                |

## Fluxo

1. Usuario preenche o formulario
2. Submit dispara `useCreateUser.mutateAsync`
3. Sucesso: toast de confirmacao, reset do form, redirecionamento para `/users`
   (page 1, perPage 50), sidebar reaberta, router invalidado
4. Erro: `handleApiError` exibe erros gerais e aplica erros de campo via
   `setFieldError`
