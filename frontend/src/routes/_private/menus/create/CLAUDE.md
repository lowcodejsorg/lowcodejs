# Criar Menu

Formulario de criacao de novo item de menu. Os campos condicionais mudam
conforme o tipo selecionado.

## Rota

`/menus/create`

## Arquivos

| Arquivo            | Descricao                                                                                                         |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `index.tsx`        | Route config minima (sem loader nem search params)                                                                |
| `index.lazy.tsx`   | Componente principal: monta o formulario com `useAppForm`, chama `useCreateMenu` na submissao                     |
| `-create-form.tsx` | Campos do formulario via `withForm`, exporta `CreateMenuFormFields`, `MenuCreateSchema` e `menuFormDefaultValues` |

## Campos do formulario

| Campo    | Tipo                          | Condicao de exibicao                |
| -------- | ----------------------------- | ----------------------------------- |
| `name`   | texto                         | sempre visivel, obrigatorio         |
| `type`   | select (FieldMenuTypeSelect)  | sempre visivel, obrigatorio         |
| `parent` | combobox (FieldMenuCombobox)  | sempre visivel, opcional            |
| `table`  | combobox (TableComboboxField) | visivel quando type = TABLE ou FORM |
| `html`   | editor rico (FieldEditor)     | visivel quando type = PAGE          |
| `url`    | campo URL (FieldUrl)          | visivel quando type = EXTERNAL      |

Quando type = SEPARATOR, exibe o componente `SeparatorInfo` (banner informativo,
sem campos extras).

## Tipos de menu (E_MENU_ITEM_TYPE)

- **PAGE** -- conteudo HTML rico
- **TABLE** -- vinculado a uma tabela do sistema
- **FORM** -- vinculado a uma tabela (modo formulario)
- **EXTERNAL** -- link externo (URL validada)
- **SEPARATOR** -- agrupador visual, sem navegacao

## Mutation

- Hook: `useCreateMenu` (de `@/hooks/tanstack-query/use-menu-create`)
- Payload: `{ name, type, parent, table, html, url }`
- Schema de validacao: `MenuCreateBodySchema` (de `@/lib/schemas`)
- onSuccess: toast, reset do form, navega para `/menus`
- onError: `handleApiError` com `createFieldErrorSetter` para erros por campo

## Fluxo

1. Usuario clica "Novo Menu" na listagem
2. Sidebar fecha, navega para `/menus/create`
3. Preenche nome e seleciona tipo
4. Campos condicionais aparecem conforme o tipo
5. Submissao via `form.handleSubmit()` -> `useCreateMenu.mutateAsync`
6. Sucesso: toast, reset, navega de volta para `/menus`
