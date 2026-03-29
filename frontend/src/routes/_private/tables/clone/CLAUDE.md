# Clonar Tabela

Formulario para criar tabela a partir de um modelo existente.

## Rota

| Rota            | Descricao                        |
| --------------- | -------------------------------- |
| `/tables/clone` | Formulario de clonagem de tabela |

## Arquivos

| Arquivo           | Tipo       | Descricao                                                           |
| ----------------- | ---------- | ------------------------------------------------------------------- |
| `index.tsx`       | Loader     | Rota vazia, sem pre-carregamento                                    |
| `index.lazy.tsx`  | Componente | Layout com header, formulario e footer com botoes Cancelar/Criar    |
| `-clone-form.tsx` | Formulario | Schema Zod `CloneTableBodySchema`, campos: nome e selecao de modelo |

## Schema do Formulario

- `name`: string, 1-40 caracteres, validado por `TABLE_NAME_REGEX`
- `MODEL_CLONE_TABLES`: string (ID da tabela modelo), obrigatorio

## Fluxo

1. Verifica permissao `CREATE_TABLE`
2. Carrega modelos disponiveis via `useSettingRead()` (configuracao
   `MODEL_CLONE_TABLES`)
3. Se nao ha modelos configurados, exibe alerta informativo
4. Submissao via `useCloneTable` hook com `baseTableId` e `name`
5. Sucesso redireciona para `/tables/:slug` da tabela clonada
6. Botao voltar leva para `/tables/new`
