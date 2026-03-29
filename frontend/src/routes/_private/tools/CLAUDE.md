# Ferramentas do Sistema

Pagina com ferramentas administrativas para manipulacao de tabelas. Restrita a
usuarios com role MASTER (verificado via `usePermission`).

## Arquivos

| Arquivo          | Tipo         | Descricao                                              |
| ---------------- | ------------ | ------------------------------------------------------ |
| `index.tsx`      | Route config | Definicao de rota basica (sem loader)                  |
| `index.lazy.tsx` | Componente   | Interface das ferramentas com verificacao de permissao |

## Ferramentas Disponiveis

| Ferramenta              | Descricao                                     | Hook            |
| ----------------------- | --------------------------------------------- | --------------- |
| Clonar Modelo de Tabela | Cria nova tabela com base em tabela existente | `useCloneTable` |

## Fluxo de Clonagem

1. Usuario seleciona tabela modelo via `TableComboboxPaginated` (combobox
   paginado)
2. Informa nome da nova tabela
3. Clica em "Clonar Modelo"
4. Apos sucesso, redireciona para a nova tabela (`/tables/:slug`)

## Controle de Acesso

- Usa `usePermission().can('CREATE_TABLE')` para verificar permissao
- Se sem permissao, exibe componente `AccessDenied`
- Role: MASTER
