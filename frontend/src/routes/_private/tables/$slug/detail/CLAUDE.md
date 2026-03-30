# Detalhes da Tabela

Visualizacao e edicao das configuracoes de uma tabela. Alterna entre modo
visualizacao (show) e edicao (edit).

## Rota

| Rota                   | Descricao                         |
| ---------------------- | --------------------------------- |
| `/tables/:slug/detail` | Detalhes e configuracao da tabela |

## Arquivos

| Arquivo                     | Tipo       | Descricao                                                                                        |
| --------------------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `index.tsx`                 | Loader     | Carrega `tableDetailOptions`                                                                     |
| `index.lazy.tsx`            | Componente | Layout com modos show/edit, acoes de lixeira e formulario de atualizacao                         |
| `-view.tsx`                 | Componente | Visualizacao somente-leitura dos dados da tabela (logo, nome, estilo, visibilidade, colaboracao) |
| `-update-form.tsx`          | Formulario | Schema `TableUpdateSchema` com todos os campos editaveis incluindo layoutFields                  |
| `-update-form-skeleton.tsx` | Skeleton   | Skeleton do formulario                                                                           |

## Campos do Formulario (TableUpdateSchema)

- `name`, `description`, `style` (todos os 9 estilos), `visibility`,
  `collaboration`
- `logo`, `administrators`, `order` (campo + direcao)
- `layoutFields`: title, description, cover, category, startDate, endDate,
  color, participants, reminder

## Fluxo

1. Verifica permissao `UPDATE_TABLE`
2. Modo show: exibe dados + botoes de lixeira/restaurar/excluir permanente
3. Modo edit: formulario com `useUpdateTable` hook
4. Sucesso redireciona para `/tables/:slug`

## Acoes de Lixeira

- Usa `ActionDialog` de `@/components/common/action-dialog` para acoes de
  trash/restore/delete
