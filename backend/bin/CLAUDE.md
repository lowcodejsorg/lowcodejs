# bin — Entry Point do Servidor

Inicialização da aplicação: conecta ao banco, sincroniza configurações e sobe o
servidor HTTP + WebSocket.

## Arquivos

| Arquivo     | Descrição                                                                                     |
| ----------- | --------------------------------------------------------------------------------------------- |
| `server.ts` | Conecta ao MongoDB, chama `syncSettingsFromDatabase()`, inicia Fastify e registra Socket.IO |

## Fluxo de Inicialização

1. Conecta ao MongoDB via Mongoose
2. Inicia o servidor Fastify (kernel em `start/kernel.ts`) na porta configurada
3. Registra Socket.IO com decodificação JWT para autenticação de WebSocket (chat)

## Observações

- Configurações de domínio (branding, locale, upload, paginação, IA, SMTP) são
  lidas dinamicamente do documento Setting (MongoDB) pelas camadas que precisam
  delas — não há mais sync para `process.env` no boot
- Socket.IO usa o mesmo JWT RS256 do HTTP para autenticar conexões
