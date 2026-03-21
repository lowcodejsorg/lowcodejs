---
name: backend-auth
description: |
  Generates complete authentication modules for backend Node.js projects.
  Use when: user asks to create authentication, login, sign-in, sign-up, JWT,
  token management, cookie auth, session auth, or mentions "auth" for user identity.
  Supports: JWT (RS256/HS256), cookie-based, session-based, OAuth2.
  Frameworks: Fastify, Express, NestJS, AdonisJS, Hono, Elysia/Bun.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **Framework**: `fastify` | `express` | `@nestjs/core` | `@adonisjs/core` | `hono` | `elysia`
   - **JWT**: `@fastify/jwt` | `jsonwebtoken` | `jose` | `@nestjs/jwt`
   - **Cookies**: `@fastify/cookie` | `cookie-parser`
   - **Password**: `bcryptjs` | `bcrypt` | `argon2`
   - **Session**: `@fastify/session` | `express-session`
3. Scan existing auth code to detect:
   - Token strategy (RS256 asymmetric keys vs HS256 shared secret)
   - Token storage (httpOnly cookies vs Authorization header)
   - Existing user model and fields
   - Auth routes location
4. If not detected, ask user:
   ```
   Which auth strategy?
   1. JWT with httpOnly cookies (recommended for web apps)
   2. JWT with Authorization header (for APIs / mobile)
   3. Session-based auth
   4. OAuth2 (social login)
   ```

## Auth Module Components

A complete auth module: JWT utility, cookie utility, auth middleware, sign-in (controller + use-case + validator), sign-up (controller + use-case + validator), sign-out controller, refresh controller, and password recovery flow.

## Conventions

### Rules
- Access tokens: short-lived (15min–24h)
- Refresh tokens: longer-lived (7d–30d)
- Cookies: `httpOnly: true`, `secure: true` in production, `sameSite` appropriate
- Hash passwords with bcrypt (salt rounds 6–12) or argon2
- Never return password field in responses
- Use Either pattern for error handling (left = error, right = success)
- No ternary operators — use if/else

## Templates

### Fastify (Reference Implementation)

**JWT Utility — `utils/jwt.util.ts`:**
```typescript
import type { FastifyReply } from 'fastify';

import {
  E_JWT_TYPE,
  type E_ROLE,
  type IJWTPayload,
  type IUser,
} from '@application/core/entity.core';

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

**Cookie Utility — `utils/cookies.util.ts`:**
```typescript
import type { FastifyReply } from 'fastify';
import { Env } from '@start/env';
import type { TokenPair } from './jwt.util';

function baseCookieOptions() {
  let sameSite: 'none' | 'lax' = 'lax';
  if (Env.NODE_ENV === 'production') {
    sameSite = 'none';
  }

  return {
    path: '/',
    secure: Env.NODE_ENV === 'production',
    sameSite,
    httpOnly: true,
    ...(Env.COOKIE_DOMAIN && { domain: Env.COOKIE_DOMAIN }),
  };
}

export const clearCookieTokens = (response: FastifyReply): void => {
  const opts = baseCookieOptions();
  response.clearCookie('accessToken', opts).clearCookie('refreshToken', opts);
};

export const setCookieTokens = (response: FastifyReply, tokens: TokenPair): void => {
  const opts = baseCookieOptions();
  response
    .setCookie('accessToken', tokens.accessToken, { ...opts, maxAge: 86400000 }) // 24h
    .setCookie('refreshToken', tokens.refreshToken, { ...opts, maxAge: 604800000 }); // 7d
};
```

**Auth Middleware — `middlewares/authentication.middleware.ts`:**
```typescript
import type { FastifyRequest } from 'fastify';

import { E_JWT_TYPE, type IJWTPayload } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';

interface AuthOptions {
  optional?: boolean;
}

export function AuthenticationMiddleware(
  options: AuthOptions = { optional: false },
) {
  return async function (request: FastifyRequest): Promise<void> {
    try {
      const accessToken = request.cookies.accessToken;

      if (!accessToken) {
        if (options.optional) return;
        throw HTTPException.Unauthorized(
          'Authentication required',
          'AUTHENTICATION_REQUIRED',
        );
      }

      const decoded: IJWTPayload | null =
        await request.server.jwt.decode(String(accessToken));

      if (!decoded || decoded.type !== E_JWT_TYPE.ACCESS) {
        if (options.optional) return;
        throw HTTPException.Unauthorized(
          'Authentication required',
          'AUTHENTICATION_REQUIRED',
        );
      }

      request.user = {
        sub: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        type: E_JWT_TYPE.ACCESS,
      };
    } catch (error) {
      if (options.optional) return;
      throw HTTPException.Unauthorized(
        'Authentication required',
        'AUTHENTICATION_REQUIRED',
      );
    }
  };
}
```

**Sign-In Controller:**
```typescript
import { Controller, POST } from 'fastify-decorators';
import { getInstanceByToken } from 'fastify-decorators';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { createTokens } from '@application/utils/jwt.util';
import { clearCookieTokens, setCookieTokens } from '@application/utils/cookies.util';
import { SignInBodyValidator } from './sign-in.validator';
import { SignInSchema } from './sign-in.schema';
import SignInUseCase from './sign-in.use-case';

@Controller()
export default class {
  constructor(
    private readonly useCase: SignInUseCase = getInstanceByToken(SignInUseCase),
  ) {}

  @POST({
    url: '/authentication/sign-in',
    options: {
      schema: SignInSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const body = SignInBodyValidator.parse(request.body);

    const result = await this.useCase.execute(body);

    if (result.isLeft()) {
      const error = result.value;
      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    const user = result.value;
    const tokens = await createTokens(user, response);

    clearCookieTokens(response);
    setCookieTokens(response, tokens);

    return response.status(200).send({ message: 'Authenticated' });
  }
}
```

**Sign-In Use Case:**
```typescript
import { Service } from 'fastify-decorators';
import bcrypt from 'bcryptjs';

import { type Either, left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import type { IUser } from '@application/core/entity.core';
import { User } from '@application/model/user.model';

import type { SignInPayload } from './sign-in.validator';

@Service()
export default class SignInUseCase {
  async execute(
    payload: SignInPayload,
  ): Promise<Either<HTTPException, IUser>> {
    const user = await User.findOne({ email: payload.email })
      .populate({ path: 'group', populate: { path: 'permissions' } })
      .lean();

    if (!user) {
      return left(
        HTTPException.Unauthorized('Invalid credentials', 'INVALID_CREDENTIALS'),
      );
    }

    if (user.status !== 'active') {
      return left(
        HTTPException.Forbidden('User is inactive', 'USER_INACTIVE'),
      );
    }

    const passwordMatch = await bcrypt.compare(payload.password, user.password);

    if (!passwordMatch) {
      return left(
        HTTPException.Unauthorized('Invalid credentials', 'INVALID_CREDENTIALS'),
      );
    }

    return right(user);
  }
}
```

**Sign-In Validator:**
```typescript
import z from 'zod';

export const SignInBodyValidator = z.object({
  email: z
    .string({ message: 'Email is required' })
    .email('Enter a valid email')
    .trim(),
  password: z
    .string({ message: 'Password is required' })
    .trim()
    .min(1, 'Password is required'),
});

export type SignInPayload = z.infer<typeof SignInBodyValidator>;
```

**Sign-Up Use Case** (same pattern — check existing, hash password, create user):
```typescript
import { Service } from 'fastify-decorators';
import bcrypt from 'bcryptjs';

import { type Either, left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import type { IUser } from '@application/core/entity.core';
import { User } from '@application/model/user.model';
import { Group } from '@application/model/group.model';

import type { SignUpPayload } from './sign-up.validator';

@Service()
export default class SignUpUseCase {
  async execute(payload: SignUpPayload): Promise<Either<HTTPException, IUser>> {
    const existingUser = await User.findOne({ email: payload.email });

    if (existingUser) {
      return left(HTTPException.Conflict('User already exists', 'USER_ALREADY_EXISTS'));
    }

    const defaultGroup = await Group.findOne({ slug: 'REGISTERED' });

    if (!defaultGroup) {
      return left(HTTPException.InternalServerError('Default group not found', 'GROUP_NOT_FOUND'));
    }

    const hashedPassword = await bcrypt.hash(payload.password, 6);
    const user = await User.create({
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
      group: defaultGroup._id,
      status: 'active',
    });

    return right(user);
  }
}
```

**Sign-Out** — clear cookies and return 200:
```typescript
@POST({ url: '/authentication/sign-out', options: { onRequest: [AuthenticationMiddleware({ optional: false })] } })
async handle(_request: FastifyRequest, response: FastifyReply): Promise<void> {
  clearCookieTokens(response);
  return response.status(200).send({ message: 'Signed out' });
}
```

### Express

**JWT Utility:**
```typescript
import jwt from 'jsonwebtoken';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export const createTokens = (user: {
  _id: string;
  email: string;
  role: string;
}): TokenPair => {
  const accessToken = jwt.sign(
    { sub: user._id, email: user.email, role: user.role, type: 'ACCESS' },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' },
  );

  const refreshToken = jwt.sign(
    { sub: user._id, type: 'REFRESH' },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' },
  );

  return { accessToken, refreshToken };
};

export const verifyToken = (token: string): jwt.JwtPayload | null => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
  } catch {
    return null;
  }
};
```

**Sign-In Route:**
```typescript
import { Router } from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';

import { User } from '@models/user.model';
import { createTokens } from '@utils/jwt.util';
import { SignInBodyValidator } from './sign-in.validator';

const router = Router();

router.post('/authentication/sign-in', async (req: Request, res: Response) => {
  const body = SignInBodyValidator.parse(req.body);
  const user = await User.findOne({ email: body.email }).lean();

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials', cause: 'INVALID_CREDENTIALS' });
  }

  const passwordMatch = await bcrypt.compare(body.password, user.password);

  if (!passwordMatch) {
    return res.status(401).json({ message: 'Invalid credentials', cause: 'INVALID_CREDENTIALS' });
  }

  const tokens = createTokens(user);
  // Set httpOnly cookies (same pattern as Fastify cookie utility)
  res.cookie('accessToken', tokens.accessToken, { path: '/', httpOnly: true, secure: true, maxAge: 86400000 });
  res.cookie('refreshToken', tokens.refreshToken, { path: '/', httpOnly: true, secure: true, maxAge: 604800000 });

  return res.status(200).json({ message: 'Authenticated' });
});

export default router;
```

### NestJS

**Auth Service** (uses `@nestjs/jwt` + `UsersService`):
```typescript
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService, private readonly jwtService: JwtService) {}

  async signIn(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');
    return {
      accessToken: this.jwtService.sign({ sub: user._id, email: user.email, role: user.role, type: 'ACCESS' }, { expiresIn: '24h' }),
      refreshToken: this.jwtService.sign({ sub: user._id, type: 'REFRESH' }, { expiresIn: '7d' }),
    };
  }

  async signUp(payload: { name: string; email: string; password: string }) {
    const existing = await this.usersService.findByEmail(payload.email);
    if (existing) throw new ConflictException('User already exists');
    const hashedPassword = await bcrypt.hash(payload.password, 10);
    return this.usersService.create({ ...payload, password: hashedPassword });
  }
}
```

**Auth Controller** (same cookie pattern, NestJS decorators):
```typescript
import { Controller, Post, Body, Res, HttpCode, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() dto: SignInDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.signIn(dto.email, dto.password);
    res.cookie('accessToken', tokens.accessToken, { path: '/', httpOnly: true, secure: true, maxAge: 86400000 });
    res.cookie('refreshToken', tokens.refreshToken, { path: '/', httpOnly: true, secure: true, maxAge: 604800000 });
    return { message: 'Authenticated' };
  }

  @Post('sign-up')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() dto: SignUpDto) { await this.authService.signUp(dto); return { message: 'Account created' }; }

  @Post('sign-out')
  @HttpCode(HttpStatus.OK)
  async signOut(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return { message: 'Signed out' };
  }
}
```

## Env Vars Required

Ensure these exist: `JWT_SECRET` (HS256) or `JWT_PUBLIC_KEY`+`JWT_PRIVATE_KEY` (RS256), `COOKIE_SECRET`, `COOKIE_DOMAIN` (optional).

## Checklist

- [ ] JWT utility with access (24h) + refresh (7d) tokens
- [ ] Cookie utility: httpOnly, secure, sameSite
- [ ] Auth middleware (factory function with optional flag)
- [ ] Sign-in: validate → find user → check status → compare password → issue tokens
- [ ] Sign-up: validate → check existing → hash password → create user
- [ ] Sign-out: clear cookies
- [ ] Passwords hashed, never returned in plain text
- [ ] Either pattern for error handling (left/right)
