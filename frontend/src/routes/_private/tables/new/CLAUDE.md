# Nova Tabela - Wizard de Selecao

Pagina intermediaria para escolher o metodo de criacao de tabela.

## Rota

| Rota          | Descricao                         |
| ------------- | --------------------------------- |
| `/tables/new` | Wizard com duas opcoes de criacao |

## Arquivos

| Arquivo          | Tipo       | Descricao                        |
| ---------------- | ---------- | -------------------------------- |
| `index.tsx`      | Loader     | Rota vazia, sem pre-carregamento |
| `index.lazy.tsx` | Componente | Grid com dois cards de selecao   |

## Opcoes

| Opcao             | Destino          | Descricao                                 |
| ----------------- | ---------------- | ----------------------------------------- |
| Usar um Modelo    | `/tables/clone`  | Criar tabela a partir de modelo existente |
| Criar nova Tabela | `/tables/create` | Criar tabela do zero                      |

## Observacoes

- Layout centralizado com grid responsivo (1 coluna mobile, 2 colunas desktop)
- Nao requer pre-carregamento de dados
- Acessado pelo botao "Nova Tabela" na listagem de tabelas
