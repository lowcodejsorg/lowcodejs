# Setting

Configuracoes globais da plataforma (singleton). Leitura e atualizacao.

## Base Route

`/setting`

## Operacoes

| Operacao | Metodo | Rota | Auth |
|----------|--------|------|------|
| show | GET | `/setting` | Opcional |
| update | PUT | `/setting` | Obrigatorio |

## Repositorios Utilizados

- `SettingContractRepository` - get e update do documento singleton

## Comportamento Chave

- Documento singleton no MongoDB (sempre 1 registro)
- Se nao existir, show retorna env vars do process.env como fallback
- Update sincroniza valores com process.env em runtime
- FILE_UPLOAD_ACCEPTED e armazenado como string separada por ";" e retornado como array
- MODEL_CLONE_TABLES inclui templates built-in (KANBAN, CARDS, MOSAIC, DOCUMENT, FORUM, CALENDAR) + tabelas customizadas do banco
- Templates built-in sao filtrados no update (nao podem ser removidos)
