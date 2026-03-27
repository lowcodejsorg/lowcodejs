# Pages

Exibicao de paginas HTML criadas via menu (type=PAGE).

## Base Route

`/pages`

## Operacoes

| Operacao | Metodo | Rota | Auth |
|----------|--------|------|------|
| show | GET | `/pages/:slug` | Obrigatorio |

## Repositorios Utilizados

- `MenuContractRepository` - busca menu do tipo PAGE pelo slug

## Comportamento Chave

- Pages sao menus com type=PAGE
- O conteudo HTML esta no campo `html` do documento menu
- Busca pelo slug do menu (nao pelo _id)
- Somente menus nao-trashed sao retornados
