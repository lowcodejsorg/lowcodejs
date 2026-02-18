# Skill: Endpoint de Autenticacao

Os endpoints de autenticacao seguem o padrao REST do projeto com JWT RS256 transportado via cookies HTTP-only. O fluxo completo inclui sign-in, sign-up, refresh-token, sign-out, request-code (forgot-password), validate-code e reset-password. Cada action segue a mesma estrutura de controller + use case + validator + schema das demais entidades, com a adicao de utils especificos para geracao de tokens JWT e manipulacao de cookies.

---

## Estrutura do Arquivo

```
backend/
  application/
    resources/
      authentication/
        sign-in/
          sign-in.controller.ts          <-- Controller: POST /authentication/sign-in
          sign-in.use-case.ts            <-- Use case: validacao de credenciais
          sign-in.validator.ts           <-- Zod validator
          sign-in.schema.ts              <-- FastifySchema (OpenAPI)
          sign-in.controller.spec.ts     <-- Teste E2E
        sign-up/
          sign-up.controller.ts          <-- POST /authentication/sign-up
          sign-up.use-case.ts
          sign-up.validator.ts
          sign-up.schema.ts
        refresh-token/
          refresh-token.controller.ts    <-- POST /authentication/refresh-token
          refresh-token.use-case.ts
          refresh-token.schema.ts
        sign-out/
          sign-out.controller.ts         <-- POST /authentication/sign-out
          sign-out.schema.ts
        request-code/
          request-code.controller.ts     <-- POST /authentication/request-code
          request-code.use-case.ts
        validate-code/
          validate-code.controller.ts    <-- POST /authentication/validate-code
          validate-code.use-case.ts
        reset-password/
          reset-password.controller.ts   <-- POST /authentication/reset-password
          reset-password.use-case.ts
    utils/
      jwt.util.ts                        <-- createTokens()
      cookies.util.ts                    <-- setCookieTokens(), clearCookieTokens()
    middlewares/
      authentication.middleware.ts       <-- AuthenticationMiddleware({ optional })
```

---

## Template: Controller de Sign-In

```typescript
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, POST } from 'fastify-decorators';

import { clearCookieTokens, setCookieTokens } from '@application/utils/cookies.util';
import { createTokens } from '@application/utils/jwt.util';

import { SignInSchema } from './sign-in.schema';
import SignInUseCase from './sign-in.use-case';
import { SignInBodyValidator } from './sign-in.validator';

@Controller({
  route: 'authentication',
})
export default class {
  constructor(
    private readonly useCase: SignInUseCase = getInstanceByToken(SignInUseCase),
  ) {}

  @POST({
    url: '/sign-in',
    options: {
      schema: SignInSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const payload = SignInBodyValidator.parse(request.body);
    const result = await this.useCase.execute(payload);

    if (result.isLeft()) {
      const error = result.value;
      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    const tokens = await createTokens(result.value, response);
    clearCookieTokens(response);
    setCookieTokens(response, { ...tokens });

    return response.status(200).send();
  }
}
```

## Template: Use Case de Sign-In

```typescript
import bcrypt from 'bcryptjs';
import { Service } from 'fastify-decorators';

import { left, right, type Either } from '@application/core/either.core';
import { E_USER_STATUS, type IUser as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { UserContractRepository } from '@application/repositories/user/user-contract.repository';

type Response = Either<HTTPException, Entity>;

@Service()
export default class SignInUseCase {
  constructor(private readonly userRepository: UserContractRepository) {}

  async execute(payload: { email: string; password: string }): Promise<Response> {
    try {
      const user = await this.userRepository.findBy({
        email: payload.email,
        exact: true,
      });

      if (!user)
        return left(HTTPException.Unauthorized('Credenciais invalidas', 'INVALID_CREDENTIALS'));

      if (user.status === E_USER_STATUS.INACTIVE)
        return left(HTTPException.Unauthorized('Usuario inativo', 'USER_INACTIVE'));

      const passwordDoesMatch = await bcrypt.compare(payload.password, user.password);

      if (!passwordDoesMatch)
        return left(HTTPException.Unauthorized('Credenciais invalidas', 'INVALID_CREDENTIALS'));

      return right(user);
    } catch (error) {
      return left(HTTPException.InternalServerError('Internal server error', 'SIGN_IN_ERROR'));
    }
  }
}
```

## Template: Utils de JWT

```typescript
// utils/jwt.util.ts
import type { FastifyReply } from 'fastify';
import { E_JWT_TYPE, type E_ROLE, type IJWTPayload, type IUser } from '@application/core/entity.core';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export const createTokens = async (
  user: Pick<IUser, '_id' | 'email' | 'group'>,
  response: FastifyReply,
): Promise<TokenPair> => {
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

  const refreshToken = await response.jwtSign(
    { sub: user._id.toString(), type: E_JWT_TYPE.REFRESH },
    { sub: user._id.toString(), expiresIn: '7d' },
  );

  return { accessToken, refreshToken };
};
```

## Template: Utils de Cookies

```typescript
// utils/cookies.util.ts
import type { FastifyReply } from 'fastify';
import { Env } from '@start/env';
import type { TokenPair } from './jwt.util';

export const clearCookieTokens = (response: FastifyReply): void => {
  const cookieOptions = {
    path: '/',
    secure: Env.NODE_ENV === 'production',
    sameSite: Env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
    httpOnly: true,
    ...(Env.COOKIE_DOMAIN && { domain: Env.COOKIE_DOMAIN }),
  };

  response
    .clearCookie('accessToken', cookieOptions)
    .clearCookie('refreshToken', cookieOptions);
};

export const setCookieTokens = (response: FastifyReply, tokens: TokenPair): void => {
  const cookieOptions = {
    path: '/',
    secure: Env.NODE_ENV === 'production',
    sameSite: Env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
    httpOnly: true,
    ...(Env.COOKIE_DOMAIN && { domain: Env.COOKIE_DOMAIN }),
  };

  response
    .setCookie('accessToken', tokens.accessToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 1000, // 24h
    })
    .setCookie('refreshToken', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 7 * 24 * 1000, // 7d
    });
};
```

## Template: Authentication Middleware

```typescript
// middlewares/authentication.middleware.ts
import { type FastifyRequest } from 'fastify';
import { E_JWT_TYPE, type IJWTPayload } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';

interface AuthOptions {
  optional?: boolean;
}

export function AuthenticationMiddleware(options: AuthOptions = { optional: false }) {
  return async function (request: FastifyRequest): Promise<void> {
    try {
      const accessToken = request.cookies.accessToken;

      if (!accessToken) {
        if (options.optional) return;
        throw HTTPException.Unauthorized('Authentication required', 'AUTHENTICATION_REQUIRED');
      }

      const decoded: IJWTPayload | null = await request.server.jwt.decode(String(accessToken));

      if (!decoded || decoded.type !== E_JWT_TYPE.ACCESS) {
        if (options.optional) return;
        throw HTTPException.Unauthorized('Authentication required', 'AUTHENTICATION_REQUIRED');
      }

      request.user = {
        sub: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        type: E_JWT_TYPE.ACCESS,
      };
    } catch (error) {
      if (options.optional) return;
      throw HTTPException.Unauthorized('Authentication required', 'AUTHENTICATION_REQUIRED');
    }
  };
}
```

---

## Exemplo Real: Fluxo Completo de Sign-In

1. **Cliente envia** `POST /authentication/sign-in` com `{ email, password }`.
2. **Controller** valida o body com `SignInBodyValidator.parse(request.body)`.
3. **Use case** busca o usuario por email via `userRepository.findBy({ email, exact: true })`.
4. **Use case** verifica se usuario existe, se esta ativo e se a senha confere com `bcrypt.compare`.
5. **Controller** gera par de tokens com `createTokens(user, response)`.
6. **Controller** limpa cookies antigos com `clearCookieTokens(response)`.
7. **Controller** seta novos cookies com `setCookieTokens(response, tokens)`.
8. **Resposta**: `200 OK` com cookies `accessToken` (24h) e `refreshToken` (7d) como HTTP-only.

---

## Endpoints Completos

| Metodo | Rota | Autenticacao | Descricao |
|--------|------|-------------|-----------|
| POST | `/authentication/sign-in` | Nao | Login com email/password, retorna cookies JWT |
| POST | `/authentication/sign-up` | Nao | Registro de usuario, hash de senha com bcryptjs |
| POST | `/authentication/refresh-token` | Sim | Rotacao de refresh token, gera novo par |
| POST | `/authentication/sign-out` | Sim | Limpa cookies de autenticacao |
| POST | `/authentication/request-code` | Nao | Gera token de validacao, envia email |
| POST | `/authentication/validate-code` | Nao | Valida token de recuperacao de senha |
| POST | `/authentication/reset-password` | Nao | Valida token e atualiza senha |

---

## Regras e Convencoes

1. **JWT RS256** -- tokens sao assinados com algoritmo RS256 usando par de chaves publica/privada codificadas em base64 nas variaveis de ambiente.

2. **Cookies HTTP-only** -- tokens sao transportados exclusivamente via cookies HTTP-only. Nunca retorne tokens no body da resposta.

3. **`accessToken` (24h) + `refreshToken` (7d)** -- o access token expira em 24 horas, o refresh token em 7 dias. O refresh token permite renovar o access token sem re-login.

4. **`clearCookieTokens` antes de `setCookieTokens`** -- no sign-in, sempre limpe cookies antigos antes de setar novos para evitar duplicatas.

5. **Senha com bcryptjs** -- senhas sao hasheadas com `bcrypt.hash(password, 6)` no sign-up e comparadas com `bcrypt.compare()` no sign-in.

6. **Either pattern** -- use cases de autenticacao seguem o mesmo padrao Either dos demais: `left()` para erros, `right()` para sucesso.

7. **`@Controller({ route: 'authentication' })`** -- todos os controllers de autenticacao usam o mesmo prefixo de rota.

8. **Middleware com `optional`** -- o `AuthenticationMiddleware({ optional: true })` permite rotas que funcionam com ou sem autenticacao (ex.: rotas publicas que mostram conteudo extra para logados).

9. **`E_JWT_TYPE.ACCESS` vs `E_JWT_TYPE.REFRESH`** -- o tipo do token e incluido no payload JWT para diferenciar access tokens de refresh tokens na validacao.

10. **Secure cookies em producao** -- cookies usam `secure: true` e `sameSite: 'none'` em producao, `secure: false` e `sameSite: 'lax'` em desenvolvimento.

---

## Checklist

- [ ] Controllers de autenticacao estao em `application/resources/authentication/[action]/`.
- [ ] Todos usam `@Controller({ route: 'authentication' })`.
- [ ] Sign-in valida credenciais e retorna tokens via cookies.
- [ ] Sign-up faz hash de senha com bcryptjs antes de salvar.
- [ ] Refresh-token valida tipo `E_JWT_TYPE.REFRESH` antes de gerar novos tokens.
- [ ] Sign-out limpa cookies com `clearCookieTokens()`.
- [ ] `createTokens()` gera par access + refresh com `response.jwtSign()`.
- [ ] Cookies usam `httpOnly: true`, `secure` condicional e `sameSite` condicional.
- [ ] `AuthenticationMiddleware` esta em `application/middlewares/`.
- [ ] Rotas protegidas usam `onRequest: [AuthenticationMiddleware({ optional: false })]`.

---

## Erros Comuns

| Erro | Causa | Correcao |
|------|-------|----------|
| Token nao setado no cookie | Esqueceu de chamar `setCookieTokens()` | Adicionar `setCookieTokens(response, tokens)` apos `createTokens()` |
| Cookie duplicado | Nao limpou cookies antes de setar novos | Chamar `clearCookieTokens(response)` antes de `setCookieTokens()` |
| `401 AUTHENTICATION_REQUIRED` inesperado | Cookie `accessToken` nao sendo enviado | Verificar `credentials: true` no CORS e `withCredentials: true` no Axios |
| Refresh token aceito como access | Nao validou `type` no payload JWT | Verificar `decoded.type === E_JWT_TYPE.ACCESS` no middleware |
| Senha salva em texto plano | Esqueceu de usar `bcrypt.hash()` no sign-up | Hash antes de salvar: `await bcrypt.hash(password, 6)` |
| `invalid algorithm` no JWT | Chaves RSA com algoritmo errado | Verificar `sign: { algorithm: 'RS256' }` no plugin JWT do kernel |
| Cookie nao funciona em producao | `secure` e `sameSite` nao configurados | Usar `secure: true` e `sameSite: 'none'` em producao |
| `request.user` undefined em rotas protegidas | Middleware nao executado | Verificar `onRequest: [AuthenticationMiddleware()]` no decorator do endpoint |

---

**Cross-references:** ver [002-skill-controller.md](./002-skill-controller.md) para a estrutura de controllers, [001-skill-use-case.md](./001-skill-use-case.md) para o padrao Either nos use cases, [014-skill-kernel.md](./014-skill-kernel.md) para a configuracao do plugin JWT no kernel, [007-skill-middleware.md](./007-skill-middleware.md) para o padrao de middleware.
