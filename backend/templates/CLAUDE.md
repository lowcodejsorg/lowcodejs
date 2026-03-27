# Templates

Templates EJS para emails.

## `email/notification.ejs`
Template generico de notificacao. Aceita: title, message, data (key-value pairs). Layout responsivo com tema Indigo.

## `email/sign-up.ejs`
Email de boas-vindas para novos usuarios. Exibe nome e email. Instrucoes de uso: acessar sistema, explorar, criar tabela, personalizar.

## Uso

Templates sao renderizados pelo `EmailContractService.buildTemplate(payload)` e enviados via `sendEmail()`.
