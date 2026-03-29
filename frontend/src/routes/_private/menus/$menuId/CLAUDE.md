# Detalhes do Menu

Pagina de visualizacao e edicao de um menu existente. Alterna entre modo `show`
(somente leitura) e modo `edit` (formulario editavel).

## Rota

`/menus/$menuId` -- parametro dinamico `menuId`

## Arquivos

| Arquivo                     | Descricao                                                                                                             |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `index.tsx`                 | Route config: loader com `menuDetailOptions(params.menuId)`, pendingComponent com skeleton                            |
| `index.lazy.tsx`            | Componente principal com dois modos (show/edit), integra dialogs de lixeira/restaurar/excluir e formulario de edicao  |
| `-view.tsx`                 | Componente `MenuView`: exibe dados em modo somente leitura, campos condicionais por tipo, `ContentViewer` para HTML   |
| `-update-form.tsx`          | Campos do formulario via `withForm`, exporta `UpdateMenuFormFields`, `MenuUpdateSchema` e tipo `MenuUpdateFormValues` |
| `-update-form-skeleton.tsx` | Skeleton de carregamento do formulario                                                                                |

## Loader

Usa `menuDetailOptions(menuId)` de `@/hooks/tanstack-query/_query-options` via
`context.queryClient.ensureQueryData`.

## Campos do formulario (modo edit)

| Campo    | Tipo                          | Condicao de exibicao                |
| -------- | ----------------------------- | ----------------------------------- |
| `name`   | texto                         | sempre visivel, obrigatorio         |
| `type`   | select (FieldMenuTypeSelect)  | sempre visivel, obrigatorio         |
| `parent` | combobox (FieldMenuCombobox)  | sempre visivel, opcional            |
| `table`  | combobox (TableComboboxField) | visivel quando type = TABLE ou FORM |
| `html`   | editor rico (FieldEditor)     | visivel quando type = PAGE          |
| `url`    | campo URL (FieldUrl)          | visivel quando type = EXTERNAL      |

No modo `show`, os mesmos campos sao exibidos como texto via `MenuView`. O campo
`html` usa `ContentViewer` para renderizar o conteudo rico.

## Mutation

- Hook: `useUpdateMenu` (de `@/hooks/tanstack-query/use-menu-update`)
- Payload: `{ _id, name, type, parent, table, html, url }`
- Schema de validacao: `MenuUpdateBodySchema` (de `@/lib/schemas`)
- onSuccess: toast, reset do form, volta para modo show, `router.invalidate()`
- onError: `handleApiError` com `createFieldErrorSetter` para erros por campo

## Acoes no modo show

- **Editar** -- alterna para modo edit
- **Enviar para lixeira** -- dialog `MenuSendToTrashDialog` (visivel se nao esta
  na lixeira)
- **Restaurar** -- dialog `MenuRestoreDialog` (visivel se esta na lixeira)
- **Excluir permanentemente** -- dialog `MenuDeleteDialog` (visivel se esta na
  lixeira)

## Fluxo

1. Loader carrega dados do menu via `menuDetailOptions`
2. Exibe modo show com dados somente leitura e botoes de acao
3. Ao clicar "Editar", alterna para modo edit com formulario preenchido
4. Submissao via `form.handleSubmit()` -> `useUpdateMenu.mutateAsync`
5. Sucesso: toast, reset, volta para modo show com dados atualizados
6. "Cancelar" no modo edit reseta o form e volta para modo show
