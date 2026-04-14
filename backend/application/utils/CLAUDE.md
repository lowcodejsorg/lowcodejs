# Utils

Funcoes utilitarias de infraestrutura.

## `jwt.util.ts`

`createTokens(user, response)` - Gera par de tokens JWT:
- **AccessToken**: 24h, tipo ACCESS, payload: `{ sub, email, type }`
- **RefreshToken**: 7d, tipo REFRESH
- Algoritmo: RS256 (chaves publica/privada em base64 via env)
- Role foi removido do payload — permissoes resolvidas via User.groups[] no backend.

## `cookies.util.ts`

| Funcao | Descricao |
|--------|-----------|
| `setCookieTokens(response, tokens)` | Define cookies `accessToken` + `refreshToken`. httpOnly=true, sameSite=none(prod)/lax(dev), secure=prod-only |
| `clearCookieTokens(response)` | Limpa ambos cookies |

Dominio opcional via `Env.COOKIE_DOMAIN`.
