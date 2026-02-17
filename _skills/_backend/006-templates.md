# Templates

O diretorio `templates/` contem os templates de e-mail utilizados pelo backend para envio de mensagens transacionais. Os templates sao escritos em **EJS** (Embedded JavaScript) e renderizados em tempo de execucao.

## Estrutura

```
templates/
  email/
    sign-up.ejs        # Template de verificacao de cadastro
    notification.ejs    # Template de notificacoes gerais
```

## Templates Disponiveis

### sign-up.ejs

Template utilizado no fluxo de cadastro de novos usuarios. Enviado automaticamente apos o registro para verificacao do endereco de e-mail.

### notification.ejs

Template generico para envio de notificacoes diversas ao usuario, como alertas e avisos do sistema.

## Como Funciona

O servico `NodemailerEmailService` e responsavel pelo envio de e-mails. O metodo `buildTemplate()` utiliza a funcao `renderFile()` do EJS para compilar o template com os dados fornecidos.

```typescript
// Internamente, buildTemplate() executa algo como:
import { renderFile } from 'ejs';

const html = await renderFile('templates/email/sign-up.ejs', data);
```

## Dados dos Templates

Os templates recebem dados atraves de um objeto do tipo `Record<string, unknown>`. Cada template espera propriedades especificas que sao interpoladas no HTML final.

Exemplo de uso:

```typescript
await emailService.send({
  to: 'usuario@exemplo.com',
  subject: 'Confirme seu cadastro',
  template: 'sign-up',
  data: {
    name: 'Joao',
    verificationLink: 'https://app.exemplo.com/verify?token=abc123'
  }
});
```

## Customizacao

Para criar novos templates de e-mail:

1. Adicione um arquivo `.ejs` dentro de `templates/email/`.
2. Utilize a sintaxe EJS para interpolar variaveis (ex: `<%= name %>`).
3. Passe os dados necessarios como `Record<string, unknown>` ao chamar o servico de e-mail.
