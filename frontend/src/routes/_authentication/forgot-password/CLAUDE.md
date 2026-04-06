# forgot-password — Recuperação de Senha

Fluxo multi-etapas para recuperação de senha: solicitar código → validar código
→ redefinir senha.

## Rota

`/forgot-password` — ponto de entrada do fluxo de recuperação.

## Arquivos

| Arquivo          | Descrição                                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `index.tsx`      | Route config com `createRouteHead({ title: 'Recuperar Senha' })`                                                        |
| `index.lazy.tsx` | Formulário de e-mail: valida formato, chama `useAuthenticationRequestCode`, navega para validate-code com e-mail na URL |

## Fluxo Completo

```
/forgot-password
  └─ Usuário informa e-mail → envia código por e-mail
/forgot-password/validate-code?email=...
  └─ OTP de 6 dígitos → valida código → marca sessão de reset
/forgot-password/reset-password
  └─ Nova senha + confirmação → conclui reset → redireciona para /
```

## Subdiretórios

| Diretório         | Descrição                                         |
| ----------------- | ------------------------------------------------- |
| `validate-code/`  | Validação do código OTP recebido por e-mail       |
| `reset-password/` | Formulário de nova senha após validação do código |

## Padrões

- E-mail é passado via search param entre as etapas (`?email=...`)
- `beforeLoad` nos subdirs verifica pré-condições e redireciona se inválidas
- Erros específicos tratados por `cause`: `EMAIL_NOT_FOUND`,
  `VALIDATION_TOKEN_NOT_FOUND`, `VALIDATION_TOKEN_EXPIRED`
- Atributos `data-test-id` em campos e botões para testes E2E
