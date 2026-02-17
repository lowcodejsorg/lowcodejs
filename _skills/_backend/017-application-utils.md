# Utilitarios

O diretorio `utils/` contem funcoes utilitarias para gerenciamento de tokens JWT e cookies HTTP.

---

## jwt.util.ts - Criacao de Tokens

### Interface TokenPair

```typescript
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
```

### createTokens(user, response)

Cria um par de tokens JWT (access + refresh) para o usuario autenticado.

```typescript
export const createTokens = async (
  user: Pick<IUser, '_id' | 'email' | 'group'>,
  response: FastifyReply,
): Promise<TokenPair> => {
  // Access Token - 24h, RS256
  const jwt: IJWTPayload = {
    sub: user._id.toString(),
    email: user.email,
    role: user?.group?.slug?.toUpperCase() as keyof typeof E_ROLE,
    type: E_JWT_TYPE.ACCESS,
  };

  const accessToken = await response.jwtSign(jwt, {
    sub: user._id.toString(),
    expiresIn: '24h',
  });

  // Refresh Token - 7 dias
  const refreshToken = await response.jwtSign(
    {
      sub: user._id.toString(),
      type: E_JWT_TYPE.REFRESH,
    },
    {
      sub: user._id.toString(),
      expiresIn: '7d',
    },
  );

  return { accessToken, refreshToken };
};
```

### Detalhes dos Tokens

#### Access Token

| Propriedade | Valor |
|---|---|
| Algoritmo | RS256 (assinatura assimetrica) |
| Expiracao | 24 horas |
| Payload `sub` | ID do usuario (`_id`) |
| Payload `email` | Email do usuario |
| Payload `role` | Slug do grupo em uppercase (ex: `MASTER`, `ADMINISTRATOR`) |
| Payload `type` | `ACCESS` |

#### Refresh Token

| Propriedade | Valor |
|---|---|
| Expiracao | 7 dias |
| Payload `sub` | ID do usuario (`_id`) |
| Payload `type` | `REFRESH` |

O refresh token possui payload minimo (apenas `sub` e `type`), pois serve apenas para renovar o access token.

### Determinacao do Role

O role do usuario e derivado do slug do grupo associado, convertido para uppercase:

```typescript
role: user?.group?.slug?.toUpperCase() as keyof typeof E_ROLE
// Grupo com slug "administrator" → role "ADMINISTRATOR"
// Grupo com slug "master" → role "MASTER"
```

---

## cookies.util.ts - Gerenciamento de Cookies

### setCookieTokens(response, tokens)

Define os cookies `accessToken` e `refreshToken` na resposta HTTP.

```typescript
export const setCookieTokens = (
  response: FastifyReply,
  tokens: TokenPair,
): void => {
  const cookieOptions = {
    path: '/',
    secure: Env.NODE_ENV === 'production',
    sameSite: Env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
    httpOnly: true,
    ...(Env.COOKIE_DOMAIN && { domain: Env.COOKIE_DOMAIN }),
  };

  response
    .setCookie('accessToken', tokens.accessToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 1000, // 24h em milissegundos
    })
    .setCookie('refreshToken', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 7 * 24 * 1000, // 7 dias em milissegundos
    });
};
```

### Opcoes dos Cookies

| Opcao | Producao | Desenvolvimento |
|---|---|---|
| `path` | `/` | `/` |
| `secure` | `true` (HTTPS) | `false` |
| `sameSite` | `none` (permite cross-site) | `lax` (mesmo site) |
| `httpOnly` | `true` (inacessivel via JS) | `true` |
| `domain` | Valor de `COOKIE_DOMAIN` (se definido) | Valor de `COOKIE_DOMAIN` (se definido) |

### Tempo de Vida dos Cookies

| Cookie | maxAge |
|---|---|
| `accessToken` | 24 horas (86.400.000 ms) |
| `refreshToken` | 7 dias (604.800.000 ms) |

### clearCookieTokens(response)

Remove os cookies `accessToken` e `refreshToken` da resposta HTTP. Usado no logout.

```typescript
export const clearCookieTokens = (response: FastifyReply): void => {
  const cookieOptions = {
    path: '/',
    secure: Env.NODE_ENV === 'production',
    sameSite: Env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
    httpOnly: true,
    ...(Env.COOKIE_DOMAIN && { domain: Env.COOKIE_DOMAIN }),
  };

  response
    .clearCookie('accessToken', cookieOptions)
    .clearCookie('refreshToken', cookieOptions);
};
```

As opcoes de limpeza devem ser identicas as de criacao para que o navegador reconheca e remova os cookies corretamente.

---

## Fluxo Completo de Autenticacao

O diagrama abaixo ilustra como os utilitarios se integram no fluxo de autenticacao:

```
1. Login (POST /auth/login)
   └─ createTokens(user, response)     → Gera accessToken + refreshToken
   └─ setCookieTokens(response, tokens) → Define cookies na resposta

2. Requisicao autenticada (qualquer endpoint protegido)
   └─ AuthenticationMiddleware          → Extrai accessToken do cookie
   └─ request.server.jwt.decode()      → Decodifica e valida JWT
   └─ request.user = { sub, email, role, type }

3. Renovacao (POST /auth/refresh)
   └─ Extrai refreshToken do cookie
   └─ Valida tipo REFRESH
   └─ createTokens(user, response)     → Gera novos tokens
   └─ setCookieTokens(response, tokens) → Atualiza cookies

4. Logout (POST /auth/logout)
   └─ clearCookieTokens(response)      → Remove cookies
```

### Seguranca

- **httpOnly: true** - Cookies inacessiveis via JavaScript no navegador, prevenindo roubo via XSS
- **secure: true (producao)** - Cookies transmitidos apenas via HTTPS
- **sameSite: none (producao)** - Permite uso cross-site (necessario para APIs em dominio diferente do frontend)
- **sameSite: lax (desenvolvimento)** - Protecao padrao contra CSRF em ambiente local
- **RS256** - Assinatura assimetrica do JWT (chave privada para assinar, chave publica para verificar)
- **COOKIE_DOMAIN** - Opcional, permite definir o dominio dos cookies para compartilhamento entre subdominios
