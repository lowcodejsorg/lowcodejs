# Templates

Templates EJS para emails.

## `email/notification.ejs`
Template generico de notificacao. Aceita: title, message, data (key-value pairs). Layout responsivo com tema Indigo.

## `email/sign-up.ejs`
Email de boas-vindas para novos usuarios. Exibe nome e email. Instrucoes de uso: acessar sistema, explorar, criar tabela, personalizar.

## `email/user-created.ejs`
Email enviado quando admin/master cria um novo usuario via `POST /users`. Variaveis: `name`, `email`, `loginUrl`. CTA com botao de acesso.

## `email/user-account-changed.ejs`
Email enviado quando campos sensiveis (password/email/status) do usuario mudam via `PATCH /users/:_id`. Variaveis: `name`, `changes` (string[] em PT-BR), `recipientType` (`current` | `old` | `new`). Quando email muda, dispara dois envios: `old` (alerta de seguranca) e `new` (confirmacao).

## Uso

Templates sao renderizados pelo `EmailContractService.buildTemplate(payload)` e enviados via `sendEmail()`.
