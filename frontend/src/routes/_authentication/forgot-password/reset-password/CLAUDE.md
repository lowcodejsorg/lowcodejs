# reset-password — Redefinição de Senha

Etapa final do fluxo de recuperação: formulário para definir a nova senha após
validação do código OTP.

## Rota

`/forgot-password/reset-password`

## Arquivos

| Arquivo          | Descrição                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| `index.tsx`      | Route config: `beforeLoad` verifica se o usuário completou a etapa de validação de código      |
| `index.lazy.tsx` | Formulário com campos "Nova senha" e "Confirmar senha", chama `useAuthenticationResetPassword` |

## Comportamento

- `beforeLoad`: se o usuário não tiver completado `validate-code`, redireciona
  para `/forgot-password` (início do fluxo)
- Validação de senha via Zod: mínimo 8 chars, 1 maiúscula, 1 minúscula, 1
  dígito, 1 caractere especial
- Em caso de sucesso: redireciona para `/` (sign-in) com toast de confirmação
- Cause codes tratados: `VALIDATION_TOKEN_NOT_FOUND`, `VALIDATION_TOKEN_EXPIRED`
