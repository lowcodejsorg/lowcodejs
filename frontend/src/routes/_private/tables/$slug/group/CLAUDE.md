# Grupo de Campos

Gerenciamento de campos dentro de grupos (field groups). Grupos sao campos do
tipo FIELD_GROUP que contem subcampos.

## Estrutura

| Diretorio           | Rota                                              | Descricao                        |
| ------------------- | ------------------------------------------------- | -------------------------------- |
| `$groupSlug/field/` | `/tables/:slug/group/:groupSlug/field/management` | Gerenciamento de campos do grupo |

## Observacoes

- Nao ha arquivos na raiz do diretorio `group/`
- Grupos sao acessados via dropdown de configuracao da tabela
  (`-table-configuration.tsx`)
- Cada grupo possui seus proprios campos que podem ser reordenados e gerenciados
  independentemente
- Criacao de campos em grupo usa search param `?group=groupSlug` na rota de
  criacao de campo
