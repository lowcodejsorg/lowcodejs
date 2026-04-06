# templates/email — Templates de E-mail

Templates EJS renderizados pelo serviço de e-mail (`EmailService`) via
Nodemailer.

## Arquivos

| Arquivo             | Variáveis EJS             | Uso                                              |
| ------------------- | ------------------------- | ------------------------------------------------ |
| `notification.ejs`  | `subject`, `message`      | Notificações genéricas do sistema               |
| `recovery-code.ejs` | `code`, `expiresIn`       | Código de recuperação de senha / 2FA             |
| `sign-up.ejs`       | `name`, `subject`         | Confirmação de cadastro para novos usuários      |

## Padrões

- Templates são carregados pelo `EmailService` via `ejs.renderFile()`
- O caminho dos templates é relativo ao diretório raiz do backend
- Variáveis são interpoladas com `<%= variavel %>` (EJS syntax)
- Design responsivo com HTML inline styles para compatibilidade com clientes de
  e-mail
