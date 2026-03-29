# Criar Registro (Row)

Formulario dinamico para criacao de novo registro em uma tabela.

## Rota

| Rota                       | Descricao                         |
| -------------------------- | --------------------------------- |
| `/tables/:slug/row/create` | Formulario de criacao de registro |

## Search Params

| Param          | Tipo              | Descricao                        |
| -------------- | ----------------- | -------------------------------- |
| `categoryId`   | string (opcional) | Pre-seleciona categoria          |
| `categorySlug` | string (opcional) | Pre-seleciona categoria por slug |

## Arquivos

| Arquivo                | Tipo       | Descricao                                                                                     |
| ---------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `index.tsx`            | Loader     | Valida search params (categoryId, categorySlug), carrega `tableDetailOptions`                 |
| `index.lazy.tsx`       | Componente | Layout com header e delegacao para `CreateRowForm`                                            |
| `-create-form.tsx`     | Utilitario | Funcoes `buildDefaultValues` e `buildPayload` para montar valores e payload por tipo de campo |
| `-create-row-form.tsx` | Componente | Formulario completo com `UploadingProvider`, permissoes e submissao via `useCreateTableRow`   |

## Campos Dinamicos por Tipo

| E_FIELD_TYPE          | Valor Default               |
| --------------------- | --------------------------- |
| TEXT_SHORT, TEXT_LONG | string (defaultValue ou '') |
| DROPDOWN              | array vazio                 |
| DATE                  | string vazia                |
| FILE                  | { files: [], storages: [] } |
| RELATIONSHIP          | array vazio                 |
| CATEGORY              | array vazio                 |
| USER                  | array vazio                 |

## Fluxo

1. Verifica permissao `CREATE_ROW`
2. Gera defaults e validadores dinamicamente com base nos campos da tabela
3. Submissao via `useCreateTableRow`
4. Erros de campo mapeados via `createFieldErrorSetter`
