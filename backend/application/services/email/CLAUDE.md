# Email Service

Servico de envio de email via SMTP.

## Arquivos

| Arquivo | Descricao |
|---------|-----------|
| `email-contract.service.ts` | Classe abstrata com interface EmailOptions e EmailResult |
| `nodemailer-email.service.ts` | Implementacao com Nodemailer (SMTP) |
| `in-memory-email.service.ts` | Mock para testes |

## Metodos

| Metodo | Retorno | Descricao |
|--------|---------|-----------|
| `sendEmail(options)` | `EmailResult` | Envia email com to[], subject, body, from opcional |
| `buildTemplate(payload)` | `string` | Renderiza template EJS com dados dinamicos |

## Tipos

- `EmailOptions` - to (string[]), subject, body, from opcional
- `EmailResult` - success (boolean), message, testUrl opcional (Ethereal em dev)

## Registro DI

`injectablesHolder.injectService(EmailContractService, NodemailerEmailService)`
