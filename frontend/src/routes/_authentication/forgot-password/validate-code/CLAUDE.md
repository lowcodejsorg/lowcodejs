# validate-code — Validação do Código OTP

Segunda etapa do fluxo de recuperação: validação do código de 6 dígitos enviado
por e-mail.

## Rota

`/forgot-password/validate-code?email=...`

## Arquivos

| Arquivo          | Descrição                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------- |
| `index.tsx`      | Route config: `validateSearch` exige `email` (string), `beforeLoad` redireciona se ausente  |
| `index.lazy.tsx` | Input OTP de 6 dígitos, botão reenviar, chama `useAuthenticationValidateCode`               |

## Comportamento

- `beforeLoad`: se `email` não estiver na URL, redireciona para `/forgot-password`
- Input OTP (`InputOTP`): aceita 6 dígitos numéricos
- **Reenvio**: botão disponível após timeout, chama `useAuthenticationRequestCode`
  novamente com o mesmo e-mail
- Em caso de sucesso: navega para `/forgot-password/reset-password`
- Cause codes tratados: `VALIDATION_TOKEN_NOT_FOUND`, `VALIDATION_TOKEN_EXPIRED`
