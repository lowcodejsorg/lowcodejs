# Detalhe do Registro (Row)

Visualizacao e edicao de um registro existente. Suporta acesso publico para
tabelas com visibilidade adequada.

## Rota

| Rota                       | Descricao                  |
| -------------------------- | -------------------------- |
| `/tables/:slug/row/:rowId` | Visualizar/editar registro |

## Arquivos

| Arquivo                         | Tipo       | Descricao                                                                       |
| ------------------------------- | ---------- | ------------------------------------------------------------------------------- |
| `index.tsx`                     | Loader     | Carrega tableDetail + rowDetail; verifica autenticacao antes de carregar        |
| `index.lazy.tsx`                | Componente | Layout com header, tratamento de erros de permissao e `UpdateRowForm`           |
| `-view.tsx`                     | Componente | DataTable somente-leitura com colunas dinamicas baseadas nos campos da tabela   |
| `-update-row-form.tsx`          | Componente | Formulario de edicao com `UploadingProvider`, modos show/edit, acoes de lixeira |
| `-update-form-skeleton.tsx`     | Skeleton   | Skeleton com campos de texto, selecao e arquivo simulados                       |
| `-send-to-trash-dialog.tsx`     | Dialog     | Enviar registro para lixeira                                                    |
| `-delete-dialog.tsx`            | Dialog     | Excluir registro permanentemente                                                |
| `-remove-from-trash-dialog.tsx` | Dialog     | Restaurar registro da lixeira                                                   |

## Acesso Publico

- Verifica `useAuthStore` para autenticacao
- Erros TABLE_PRIVATE, FORM_VIEW_RESTRICTED, 401, 403 exibem tela de acesso
  negado com `LoginButton`
- Botao de compartilhar copia URL para clipboard

## Fluxo

1. Carrega tabela e registro em paralelo
2. Modo show: exibe dados como DataTable + botoes de acao (editar, lixeira,
   restaurar, excluir)
3. Modo edit: reutiliza `RowFormFields` do diretorio `create/`
4. Submissao via `useUpdateTableRow`
5. Atualizacao de cache apos sucesso
