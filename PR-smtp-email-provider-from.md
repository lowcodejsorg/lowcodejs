# PR: Adicionar EMAIL_PROVIDER_FROM para SMTP

## Problema

O campo `from` do Nodemailer usava `auth.user` (usuario SMTP) como remetente padrao.
Com Office365 isso funcionava porque o usuario SMTP **e** um email (`sistemas@cett.org.br`).
Com AWS SES, o usuario SMTP e uma IAM access key (`AKIA...`), nao um email valido.
O SES rejeitava o envio porque o remetente nao era um endereco verificado.

## Solucao

Nova variavel de ambiente `EMAIL_PROVIDER_FROM` (opcional) que define o endereco
remetente independente do usuario de autenticacao SMTP.

Quando nao configurada, faz fallback para `EMAIL_PROVIDER_USER` (comportamento anterior),
mantendo compatibilidade com provedores onde o user = email.

## Arquivos alterados

| Arquivo | Mudanca |
|---------|---------|
| `backend/start/env.ts` | Adicionou `EMAIL_PROVIDER_FROM: z.string().trim().optional()` |
| `backend/config/email.config.ts` | Exporta `EmailProviderFrom` (`EMAIL_PROVIDER_FROM ?? EMAIL_PROVIDER_USER`) |
| `backend/application/services/email/nodemailer-email.service.ts` | Usa `EmailProviderFrom` no campo `from` ao inves de `auth.user` |

## Variaveis de ambiente

### Existentes (sem mudanca)

| Variavel | Descricao |
|----------|-----------|
| `EMAIL_PROVIDER_HOST` | Host SMTP |
| `EMAIL_PROVIDER_PORT` | Porta STARTTLS |
| `EMAIL_PROVIDER_USER` | Usuario SMTP |
| `EMAIL_PROVIDER_PASSWORD` | Senha SMTP |

### Nova

| Variavel | Descricao |
|----------|-----------|
| `EMAIL_PROVIDER_FROM` | Endereco remetente (opcional). Obrigatorio para AWS SES onde o usuario SMTP nao e um email. |

## Requisitos AWS SES

- O dominio ou email em `EMAIL_PROVIDER_FROM` deve estar **verificado** no SES
- TLS obrigatorio (porta 587 STARTTLS)
- Credenciais SMTP sao geradas no console SES (diferentes das credenciais IAM normais)

## Teste

1. Configurar variaveis no `.env` com credenciais SES validas
2. Disparar um email (ex: sign-up, recovery-code, ou sandbox script)
3. Verificar que o email chega com o remetente configurado em `EMAIL_PROVIDER_FROM`
