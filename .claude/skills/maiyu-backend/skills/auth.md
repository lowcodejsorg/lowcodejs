---
name: maiyu:backend-auth
description: |
  Generates complete authentication modules for backend Node.js projects.
  Use when: user asks to create authentication, login, sign-in, sign-up, JWT,
  token management, cookie auth, session auth, or mentions "auth" for user identity.
  Supports: JWT (RS256/HS256), cookie-based, session-based, OAuth2, AdonisJS v6/v7, Bouncer.
  Frameworks: Fastify, Express, NestJS, AdonisJS v6/v7, Hono, Elysia/Bun.
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
- No ternary operators — use if/else or early returns
- No `any` type — use `unknown`, concrete types, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- All functions must have explicit return types
- Multiple conditions use const mapper (object lookup) instead of switch/if-else chains

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

### Magic Link Flow

**Use Case — `magic-link.use-case.ts`:**
```typescript
import crypto from 'node:crypto';
import { type Either, left, right } from '@application/core/either.core';

interface MagicLinkInput {
  email: string;
}

interface MagicLinkResult {
  token: string;
  expiresAt: Date;
}

export const executeMagicLink = async (
  payload: MagicLinkInput,
  deps: { userRepo: UserRepo; tokenRepo: TokenRepo; emailService: EmailService },
): Promise<Either<AppError, MagicLinkResult>> => {
  const user = await deps.userRepo.findByEmail(payload.email);

  if (!user) {
    return left({ code: 404, message: 'User not found', cause: 'USER_NOT_FOUND' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await deps.tokenRepo.create({
    userId: user._id,
    token,
    type: 'MAGIC_LINK',
    expiresAt,
    used: false,
  });

  await deps.emailService.sendMagicLink({
    to: user.email,
    link: `${process.env.APP_URL}/auth/magic-link?token=${token}`,
  });

  return right({ token, expiresAt });
};
```

**Controller — `magic-link.controller.ts`:**
```typescript
// POST /authentication/magic-link
export const magicLinkHandler = async (request: Request, response: Response): Promise<void> => {
  const body = MagicLinkValidator.parse(request.body);
  const result = await executeMagicLink(body, deps);

  if (result.isLeft()) {
    const error = result.value;
    response.status(error.code).send({ message: error.message, cause: error.cause });
    return;
  }

  response.status(200).send({ message: 'Magic link sent' });
};
```

**Validate Use Case — `validate-magic-link.use-case.ts`:**
```typescript
import { type Either, left, right } from '@application/core/either.core';

interface ValidateMagicLinkInput {
  token: string;
}

export const executeValidateMagicLink = async (
  payload: ValidateMagicLinkInput,
  deps: { tokenRepo: TokenRepo; sessionService: SessionService },
): Promise<Either<AppError, TokenPair>> => {
  const record = await deps.tokenRepo.findByToken(payload.token);

  if (!record) {
    return left({ code: 401, message: 'Invalid token', cause: 'INVALID_TOKEN' });
  }

  if (record.used) {
    return left({ code: 401, message: 'Token already used', cause: 'TOKEN_USED' });
  }

  if (record.expiresAt < new Date()) {
    return left({ code: 401, message: 'Token expired', cause: 'TOKEN_EXPIRED' });
  }

  await deps.tokenRepo.markUsed(record._id);

  const tokens = await deps.sessionService.createSession(record.userId);

  return right(tokens);
};
```

**Validate Controller — `validate-magic-link.controller.ts`:**
```typescript
// GET /authentication/magic-link?token=abc123
export const validateMagicLinkHandler = async (request: Request, response: Response): Promise<void> => {
  const token = request.query.token as string;

  if (!token) {
    response.status(400).send({ message: 'Token is required', cause: 'MISSING_TOKEN' });
    return;
  }

  const result = await executeValidateMagicLink({ token }, deps);

  if (result.isLeft()) {
    const error = result.value;
    response.status(error.code).send({ message: error.message, cause: error.cause });
    return;
  }

  setCookieTokens(response, result.value);
  response.status(200).send({ message: 'Authenticated' });
};
```

### Verification Code Flow

**Request Code Use Case — `request-code.use-case.ts`:**
```typescript
import crypto from 'node:crypto';
import { type Either, left, right } from '@application/core/either.core';

interface RequestCodeInput {
  email: string;
}

interface RequestCodeResult {
  expiresAt: Date;
}

export const executeRequestCode = async (
  payload: RequestCodeInput,
  deps: { userRepo: UserRepo; codeRepo: CodeRepo; emailService: EmailService },
): Promise<Either<AppError, RequestCodeResult>> => {
  const user = await deps.userRepo.findByEmail(payload.email);

  if (!user) {
    return left({ code: 404, message: 'User not found', cause: 'USER_NOT_FOUND' });
  }

  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await deps.codeRepo.create({
    userId: user._id,
    email: user.email,
    code,
    expiresAt,
    used: false,
  });

  await deps.emailService.sendVerificationCode({
    to: user.email,
    code,
  });

  return right({ expiresAt });
};
```

**Validate Code Use Case — `validate-code.use-case.ts`:**
```typescript
import { type Either, left, right } from '@application/core/either.core';

interface ValidateCodeInput {
  email: string;
  code: string;
}

export const executeValidateCode = async (
  payload: ValidateCodeInput,
  deps: { codeRepo: CodeRepo },
): Promise<Either<AppError, { verified: true }>> => {
  const record = await deps.codeRepo.findByEmailAndCode(payload.email, payload.code);

  if (!record) {
    return left({ code: 401, message: 'Invalid code', cause: 'INVALID_CODE' });
  }

  if (record.used) {
    return left({ code: 401, message: 'Code already used', cause: 'CODE_USED' });
  }

  if (record.expiresAt < new Date()) {
    return left({ code: 401, message: 'Code expired', cause: 'CODE_EXPIRED' });
  }

  await deps.codeRepo.markUsed(record._id);

  return right({ verified: true });
};
```

**Request Code Controller — `request-code.controller.ts`:**
```typescript
// POST /authentication/request-code
export const requestCodeHandler = async (request: Request, response: Response): Promise<void> => {
  const body = RequestCodeValidator.parse(request.body);
  const result = await executeRequestCode(body, deps);

  if (result.isLeft()) {
    const error = result.value;
    response.status(error.code).send({ message: error.message, cause: error.cause });
    return;
  }

  response.status(200).send({ message: 'Verification code sent' });
};
```

**Validate Code Controller — `validate-code.controller.ts`:**
```typescript
// POST /authentication/validate-code
export const validateCodeHandler = async (request: Request, response: Response): Promise<void> => {
  const body = ValidateCodeValidator.parse(request.body);
  const result = await executeValidateCode(body, deps);

  if (result.isLeft()) {
    const error = result.value;
    response.status(error.code).send({ message: error.message, cause: error.cause });
    return;
  }

  response.status(200).send({ message: 'Code verified', verified: true });
};
```

### Password Reset Flow

**Request Reset Use Case — `request-reset.use-case.ts`:**
```typescript
import crypto from 'node:crypto';
import { type Either, left, right } from '@application/core/either.core';

interface RequestResetInput {
  email: string;
}

export const executeRequestReset = async (
  payload: RequestResetInput,
  deps: { userRepo: UserRepo; tokenRepo: TokenRepo; emailService: EmailService },
): Promise<Either<AppError, { message: string }>> => {
  const user = await deps.userRepo.findByEmail(payload.email);

  if (!user) {
    return left({ code: 404, message: 'User not found', cause: 'USER_NOT_FOUND' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await deps.tokenRepo.create({
    userId: user._id,
    token,
    type: 'PASSWORD_RESET',
    expiresAt,
    used: false,
  });

  await deps.emailService.sendPasswordReset({
    to: user.email,
    link: `${process.env.APP_URL}/auth/reset-password?token=${token}`,
  });

  return right({ message: 'Reset email sent' });
};
```

**Reset Password Use Case — `reset-password.use-case.ts`:**
```typescript
import bcrypt from 'bcryptjs';
import { type Either, left, right } from '@application/core/either.core';

interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export const executeResetPassword = async (
  payload: ResetPasswordInput,
  deps: { tokenRepo: TokenRepo; userRepo: UserRepo },
): Promise<Either<AppError, { message: string }>> => {
  const record = await deps.tokenRepo.findByToken(payload.token);

  if (!record) {
    return left({ code: 401, message: 'Invalid token', cause: 'INVALID_TOKEN' });
  }

  if (record.used) {
    return left({ code: 401, message: 'Token already used', cause: 'TOKEN_USED' });
  }

  if (record.expiresAt < new Date()) {
    return left({ code: 401, message: 'Token expired', cause: 'TOKEN_EXPIRED' });
  }

  const hashedPassword = await bcrypt.hash(payload.newPassword, 10);

  await deps.userRepo.updatePassword(record.userId, hashedPassword);
  await deps.tokenRepo.markUsed(record._id);

  return right({ message: 'Password updated' });
};
```

**Request Reset Controller — `request-reset.controller.ts`:**
```typescript
// POST /authentication/request-reset
export const requestResetHandler = async (request: Request, response: Response): Promise<void> => {
  const body = RequestResetValidator.parse(request.body);
  const result = await executeRequestReset(body, deps);

  if (result.isLeft()) {
    const error = result.value;
    response.status(error.code).send({ message: error.message, cause: error.cause });
    return;
  }

  response.status(200).send({ message: 'Reset email sent' });
};
```

**Reset Password Controller — `reset-password.controller.ts`:**
```typescript
// POST /authentication/reset-password
export const resetPasswordHandler = async (request: Request, response: Response): Promise<void> => {
  const body = ResetPasswordValidator.parse(request.body);
  const result = await executeResetPassword(body, deps);

  if (result.isLeft()) {
    const error = result.value;
    response.status(error.code).send({ message: error.message, cause: error.cause });
    return;
  }

  response.status(200).send({ message: 'Password updated' });
};
```

### Refresh Token Rotation

**Use Case — `refresh-token.use-case.ts`:**
```typescript
import { type Either, left, right } from '@application/core/either.core';

interface RefreshTokenInput {
  refreshToken: string;
}

export const executeRefreshToken = async (
  payload: RefreshTokenInput,
  deps: { jwtService: JwtService; userRepo: UserRepo },
): Promise<Either<AppError, TokenPair>> => {
  const decoded = deps.jwtService.verify(payload.refreshToken);

  if (!decoded) {
    return left({ code: 401, message: 'Invalid refresh token', cause: 'INVALID_REFRESH_TOKEN' });
  }

  if (decoded.type !== 'REFRESH') {
    return left({ code: 401, message: 'Invalid token type', cause: 'INVALID_TOKEN_TYPE' });
  }

  const user = await deps.userRepo.findById(decoded.sub);

  if (!user) {
    return left({ code: 401, message: 'User not found', cause: 'USER_NOT_FOUND' });
  }

  if (user.status !== 'active') {
    return left({ code: 403, message: 'User is inactive', cause: 'USER_INACTIVE' });
  }

  // If user has a passwordChangedAt or tokenVersion, validate against token iat
  if (user.passwordChangedAt) {
    const tokenIssuedAt = new Date((decoded.iat || 0) * 1000);
    if (tokenIssuedAt < user.passwordChangedAt) {
      return left({ code: 401, message: 'Token invalidated by password change', cause: 'TOKEN_INVALIDATED' });
    }
  }

  const newTokens = await deps.jwtService.createTokenPair(user);

  return right(newTokens);
};
```

**Controller — `refresh-token.controller.ts`:**
```typescript
// POST /authentication/refresh
export const refreshTokenHandler = async (request: Request, response: Response): Promise<void> => {
  const refreshToken = request.cookies.refreshToken;

  if (!refreshToken) {
    response.status(401).send({ message: 'Refresh token required', cause: 'MISSING_REFRESH_TOKEN' });
    return;
  }

  const result = await executeRefreshToken({ refreshToken }, deps);

  if (result.isLeft()) {
    const error = result.value;
    clearCookieTokens(response);
    response.status(error.code).send({ message: error.message, cause: error.cause });
    return;
  }

  setCookieTokens(response, result.value);
  response.status(200).send({ message: 'Tokens refreshed' });
};
```

### Session Invalidation on Password Change

After a password update use-case succeeds, increment the user's `tokenVersion` or update `passwordChangedAt` so that all existing tokens become invalid. The auth middleware and refresh token flow must check this field against the token's `iat` claim.

**Pattern:**
```typescript
// Inside the password update use-case, after hashing and saving the new password:
await deps.userRepo.update(userId, {
  password: hashedPassword,
  passwordChangedAt: new Date(),
});

// --- OR, using a numeric tokenVersion: ---
await deps.userRepo.incrementTokenVersion(userId);
```

**Auth middleware check:**
```typescript
// After decoding the JWT, before granting access:
if (user.passwordChangedAt) {
  const tokenIssuedAt = new Date((decoded.iat || 0) * 1000);
  if (tokenIssuedAt < user.passwordChangedAt) {
    // Token was issued before the password change — reject it
    return left({ code: 401, message: 'Session invalidated', cause: 'SESSION_INVALIDATED' });
  }
}
```

### Role-Based Redirect After Login

Map each role to its default route so the frontend can redirect after successful authentication.

**Pattern:**
```typescript
export const ROLE_REDIRECT_MAP: Record<string, string> = {
  ADMIN: '/dashboard',
  MANAGER: '/dashboard',
  EDITOR: '/tables',
  VIEWER: '/tables',
  REGISTERED: '/profile',
};

export const getRedirectForRole = (role: string): string => {
  const redirect = ROLE_REDIRECT_MAP[role];

  if (redirect) {
    return redirect;
  }

  return '/';
};
```

### AdonisJS v6/v7 (Auth + Bouncer)

**Auth Configuration:**
```typescript
// config/auth.ts
import { defineConfig } from '@adonisjs/auth'
import { tokensGuard, tokensUserProvider } from '@adonisjs/auth/access_tokens'
// OR for session-based:
import { sessionGuard, sessionUserProvider } from '@adonisjs/auth/session'

export default defineConfig({
  default: 'api',
  guards: {
    api: tokensGuard({
      provider: tokensUserProvider({
        tokens: 'accessTokens',
        model: () => import('#models/user'),
      }),
    }),
    // Session-based alternative:
    web: sessionGuard({
      useRememberMeTokens: true,
      provider: sessionUserProvider({
        model: () => import('#models/user'),
      }),
    }),
  },
})
```

**Bouncer Policies (AdonisJS v7):**
```typescript
// app/policies/{entity}_policy.ts
import { BasePolicy } from '@adonisjs/bouncer'
import User from '#models/user'
import {Entity} from '#models/{entity}'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class {Entity}Policy extends BasePolicy {
  view(user: User, entity: {Entity}): AuthorizerResponse {
    return true
  }

  create(user: User): AuthorizerResponse {
    return ['MASTER', 'ADMINISTRATOR'].includes(user.role)
  }

  update(user: User, entity: {Entity}): AuthorizerResponse {
    if (user.role === 'MASTER') return true
    return entity.ownerId === user.id
  }

  delete(user: User, entity: {Entity}): AuthorizerResponse {
    return user.role === 'MASTER'
  }
}
```

**Using Bouncer in Controller:**
```typescript
import {Entity}Policy from '#policies/{entity}_policy'

export default class {Entity}Controller {
  async update({ auth, params, request, response, bouncer }: HttpContext) {
    const entity = await {Entity}.findOrFail(params.id)

    if (await bouncer.with({Entity}Policy).denies('update', entity)) {
      return response.forbidden({ message: 'Sem permissao', code: 403, cause: 'FORBIDDEN' })
    }

    // proceed with update...
  }
}
```

**Sign-in (Access Tokens):**
```typescript
async signIn({ request, response }: HttpContext) {
  const { email, password } = await request.validateUsing(SignInValidator)

  const user = await User.verifyCredentials(email, password)
  const token = await User.accessTokens.create(user, ['*'], { expiresIn: '24h' })

  return response.ok({ token: token.value!.release(), user })
}
```

**Sign-in (Session):**
```typescript
async signIn({ request, response, auth }: HttpContext) {
  const { email, password } = await request.validateUsing(SignInValidator)

  const user = await User.verifyCredentials(email, password)
  await auth.use('web').login(user)

  return response.redirect('/dashboard')
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
- [ ] Magic link flow: generate token, store with expiry, send email, validate and create session
- [ ] Verification code flow: generate 6-digit code, store with expiry, send via email, validate and mark used
- [ ] Password reset flow: generate reset token, send email, validate token, hash new password, invalidate token
- [ ] Refresh token rotation: validate refresh JWT type, issue new token pair, check passwordChangedAt
- [ ] Session invalidation on password change: update passwordChangedAt or increment tokenVersion
- [ ] Role-based redirect map: ROLE_REDIRECT_MAP with getRedirectForRole helper
