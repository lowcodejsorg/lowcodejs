# bin — Entry Point do Servidor

Inicialização da aplicação: conecta ao banco, sincroniza configurações e sobe o
servidor HTTP + WebSocket.

## Arquivos

| Arquivo     | Descrição                                                                                     |
| ----------- | --------------------------------------------------------------------------------------------- |
| `server.ts` | Conecta ao MongoDB, chama `syncSettingsFromDatabase()`, inicia Fastify e registra Socket.IO |

## Fluxo de Inicialização

1. Conecta ao MongoDB via Mongoose
2. `syncSettingsFromDatabase()` — carrega do banco as configurações sobrescrevíveis
   (driver de storage, limites de upload, config de email, etc.) e substitui env vars
3. Inicia o servidor Fastify (kernel em `start/kernel.ts`) na porta configurada
4. Registra Socket.IO com decodificação JWT para autenticação de WebSocket (chat)

## Observações

- O banco de dados é fonte de verdade para configurações que podem ser alteradas
  pela UI de Settings sem redeploy
- Socket.IO usa o mesmo JWT RS256 do HTTP para autenticar conexões
