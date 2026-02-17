# Resource: Authentication

## Visao Geral

O resource de autenticacao gerencia todo o ciclo de vida de acesso do usuario: cadastro, login, logout, renovacao de tokens, recuperacao de senha e login via magic link.

Todos os controllers deste resource utilizam `@Controller({ route: 'authentication' })`.

**Diretorio**: `backend/application/resources/authentication/`

## Endpoints

| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| POST | `/authentication/sign-up` | Nao | Cadastro de novo usuario |
| POST | `/authentication/sign-in` | Nao | Login com email e senha |
| POST | `/authentication/sign-out` | Sim | Logout (limpa cookies) |
| POST | `/authentication/refresh-token` | Sim | Renova tokens de acesso |
| POST | `/authentication/recovery/request-code` | Nao | Solicita codigo de recuperacao de senha |
| POST | `/authentication/recovery/validate-code` | Nao | Valida codigo de recuperacao |
| PUT | `/authentication/recovery/update-password` | Sim | Redefine a senha do usuario |
| GET | `/authentication/magic-link` | Nao | Login via magic link (query param `code`) |

---

## POST /authentication/sign-up

Cadastra um novo usuario no sistema.

### Estrutura de Arquivos

```
authentication/sign-up/
  sign-up.controller.ts
  sign-up.validator.ts
  sign-up.use-case.ts
  sign-up.schema.ts
  sign-up.controller.spec.ts
```

### Validator (Zod)

```typescript
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/;

export const SignUpBodyValidator = z.object({
  name: z.string({ message: 'O nome e obrigatorio' }).min(1, 'O nome e obrigatorio').trim(),
  email: z.string({ message: 'O email e obrigatorio' }).email('Digite um email valido').trim(),
  password: z
    .string({ message: 'A senha e obrigatoria' })
    .min(6, 'A senha deve ter no minimo 6 caracteres')
    .regex(passwordRegex, 'A senha deve conter ao menos: 1 maiuscula, 1 minuscula, 1 numero e 1 especial')
    .trim(),
});
```

### Fluxo do Use Case

1. Valida o payload com Zod
2. Verifica se o email ja esta cadastrado (`UserContractRepository.findBy`)
3. Se existir, retorna `Left(HTTPException.Conflict('User already exists', 'USER_ALREADY_EXISTS'))`
4. Busca o grupo padrao `REGISTERED` (`UserGroupContractRepository.findBy`)
5. Gera hash da senha com `bcryptjs` (salt rounds: 6)
6. Cria o usuario com status `ACTIVE`
7. Envia email de boas-vindas de forma assincrona (template `sign-up`)
8. Retorna `Right(created)` com status 201

### Codigos de Resposta

| Codigo | Causa | Descricao |
|--------|-------|-----------|
| 201 | - | Usuario criado com sucesso |
| 409 | `USER_ALREADY_EXISTS` | Email ja cadastrado |
| 409 | `GROUP_NOT_FOUND` | Grupo REGISTERED nao encontrado |
| 500 | `SIGN_UP_ERROR` | Erro interno do servidor |

---

## POST /authentication/sign-in

Autentica um usuario com email e senha, retornando tokens JWT como cookies httpOnly.

### Estrutura de Arquivos

```
authentication/sign-in/
  sign-in.controller.ts
  sign-in.validator.ts
  sign-in.use-case.ts
  sign-in.schema.ts
  sign-in.controller.spec.ts
  sign-in.use-case.spec.ts
```

### Validator (Zod)

```typescript
export const SignInBodyValidator = z.object({
  email: z.string({ message: 'O email e obrigatorio' }).email('Digite um email valido').trim(),
  password: z.string({ message: 'A senha e obrigatoria' }).min(1, 'A senha e obrigatoria').trim(),
});
```

### Fluxo do Use Case

1. Valida o payload com Zod
2. Busca o usuario pelo email (`UserContractRepository.findBy`)
3. Se nao encontrar, retorna `Left(HTTPException.Unauthorized('Credenciais invalidas', 'INVALID_CREDENTIALS'))`
4. Verifica se o usuario esta ativo (`E_USER_STATUS.INACTIVE` retorna erro)
5. Compara a senha com `bcrypt.compare`
6. Se senha nao confere, retorna `Left(HTTPException.Unauthorized('Credenciais invalidas', 'INVALID_CREDENTIALS'))`
7. Retorna `Right(user)`

### Fluxo do Controller (apos use case)

1. Gera tokens JWT (`createTokens`) - accessToken e refreshToken
2. Limpa cookies anteriores (`clearCookieTokens`)
3. Define novos cookies httpOnly (`setCookieTokens`)
4. Retorna status 200

### Codigos de Resposta

| Codigo | Causa | Descricao |
|--------|-------|-----------|
| 200 | - | Autenticacao bem-sucedida (cookies definidos) |
| 400 | `INVALID_PAYLOAD_FORMAT` | Payload invalido |
| 401 | `INVALID_CREDENTIALS` | Email ou senha incorretos |
| 401 | `USER_INACTIVE` | Usuario inativo |
| 500 | `SIGN_IN_ERROR` | Erro interno do servidor |

---

## POST /authentication/sign-out

Encerra a sessao do usuario limpando os cookies de autenticacao.

### Estrutura de Arquivos

```
authentication/sign-out/
  sign-out.controller.ts
  sign-out.use-case.ts
  sign-out.schema.ts
  sign-out.controller.spec.ts
  sign-out.use-case.spec.ts
```

### Middleware

```typescript
onRequest: [AuthenticationMiddleware({ optional: false })]
```

### Fluxo do Controller

1. Middleware verifica autenticacao
2. Limpa cookies de autenticacao (`clearCookieTokens`)
3. Retorna `{ message: 'Successfully signed out' }` com status 200

### Codigos de Resposta

| Codigo | Causa | Descricao |
|--------|-------|-----------|
| 200 | - | Logout bem-sucedido |
| 401 | `AUTHENTICATION_REQUIRED` | Usuario nao autenticado |

---

## POST /authentication/refresh-token

Renova os tokens de acesso utilizando o refresh token dos cookies.

### Estrutura de Arquivos

```
authentication/refresh-token/
  refresh-token.controller.ts
  refresh-token.validator.ts
  refresh-token.use-case.ts
  refresh-token.schema.ts
  refresh-token.controller.spec.ts
  refresh-token.use-case.spec.ts
```

### Middleware

```typescript
onRequest: [AuthenticationMiddleware({ optional: false })]
```

### Fluxo do Controller

1. Middleware verifica autenticacao
2. Extrai `refreshToken` dos cookies
3. Decodifica o token JWT e verifica se o tipo e `REFRESH`
4. Executa o use case passando o `sub` (ID do usuario)
5. Gera novos tokens (`createTokens`)
6. Define novos cookies (`setCookieTokens`)
7. Retorna status 200

### Codigos de Resposta

| Codigo | Causa | Descricao |
|--------|-------|-----------|
| 200 | - | Tokens renovados com sucesso |
| 401 | `MISSING_REFRESH_TOKEN` | Refresh token ausente |
| 401 | `INVALID_REFRESH_TOKEN` | Refresh token invalido ou expirado |
| 404 | `USER_NOT_FOUND` | Usuario nao encontrado |
| 500 | `REFRESH_TOKEN_ERROR` | Erro interno do servidor |

---

## Recuperacao de Senha (Fluxo em 3 Etapas)

A recuperacao de senha utiliza o modelo `ValidationToken` e segue um fluxo em 3 passos:

```
request-code -> validate-code -> update-password
```

### Etapa 1: POST /authentication/recovery/request-code

Solicita um codigo de recuperacao de senha (6 digitos).

#### Validator

```typescript
export const RequestCodeBodyValidator = z.object({
  email: z.string({ message: 'O email e obrigatorio' }).email('Digite um email valido').trim(),
});
```

#### Fluxo do Use Case

1. Busca o usuario pelo email
2. Se nao encontrar, retorna `Left(HTTPException.NotFound('Email not found', 'EMAIL_NOT_FOUND'))`
3. Gera um codigo numerico aleatorio de 6 digitos
4. Cria um `ValidationToken` com status `REQUESTED` associado ao usuario
5. (Placeholder para envio de email com o codigo)
6. Retorna `Right(null)` com status 200

#### Codigos de Resposta

| Codigo | Causa | Descricao |
|--------|-------|-----------|
| 200 | - | Codigo enviado com sucesso |
| 404 | `EMAIL_NOT_FOUND` | Email nao cadastrado |
| 500 | `REQUEST_CODE_ERROR` | Erro interno do servidor |

---

### Etapa 2: POST /authentication/recovery/validate-code

Valida o codigo de recuperacao enviado ao usuario.

#### Validator

```typescript
export const ValidateCodeBodyValidator = z.object({
  code: z.string({ message: 'O codigo e obrigatorio' }).min(1, 'O codigo e obrigatorio').trim(),
});
```

#### Fluxo do Use Case

1. Busca o `ValidationToken` pelo codigo
2. Se nao encontrar, retorna `Left(HTTPException.NotFound(...))`
3. Verifica se o token ja expirou (status `EXPIRED`)
4. Calcula a diferenca de tempo desde a criacao (limite: **10 minutos**)
5. Se expirado, atualiza o status para `EXPIRED` e retorna `Left(HTTPException.Gone(...))`
6. Atualiza o status para `VALIDATED`
7. Retorna `Right({ user: token.user })`

#### Codigos de Resposta

| Codigo | Causa | Descricao |
|--------|-------|-----------|
| 200 | - | Codigo validado com sucesso |
| 404 | `VALIDATION_TOKEN_NOT_FOUND` | Codigo nao encontrado |
| 410 | `VALIDATION_TOKEN_EXPIRED` | Codigo expirado (mais de 10 minutos) |
| 500 | `VALIDATE_CODE_ERROR` | Erro interno do servidor |

---

### Etapa 3: PUT /authentication/recovery/update-password

Redefine a senha do usuario. Requer autenticacao (o usuario e autenticado apos a validacao do codigo).

#### Middleware

```typescript
onRequest: [AuthenticationMiddleware({ optional: false })]
```

#### Validator

```typescript
export const ResetPasswordBodyValidator = z.object({
  password: z
    .string({ message: 'A senha e obrigatoria' })
    .min(6, 'A senha deve ter no minimo 6 caracteres')
    .regex(PASSWORD_REGEX, 'A senha deve conter ao menos: 1 maiuscula, 1 minuscula, 1 numero e 1 especial')
    .trim(),
});
```

#### Fluxo do Use Case

1. Busca o usuario pelo `_id` (extraido do token JWT - `request.user.sub`)
2. Se nao encontrar, retorna `Left(HTTPException.NotFound('User not found', 'USER_NOT_FOUND'))`
3. Gera hash da nova senha com `bcryptjs` (salt rounds: 6)
4. Atualiza a senha do usuario
5. Retorna `Right(null)` com status 200

#### Codigos de Resposta

| Codigo | Causa | Descricao |
|--------|-------|-----------|
| 200 | - | Senha redefinida com sucesso |
| 401 | `AUTHENTICATION_REQUIRED` | Usuario nao autenticado |
| 404 | `USER_NOT_FOUND` | Usuario nao encontrado |
| 500 | `UPDATE_PASSWORD_ERROR` | Erro interno do servidor |

---

## GET /authentication/magic-link

Autentica o usuario via magic link. Recebe um `code` como query parameter, valida o token, ativa o usuario (se inativo) e redireciona para o dashboard do frontend.

### Estrutura de Arquivos

```
authentication/magic-link/
  magic-link.controller.ts
  magic-link.validator.ts
  magic-link.use-case.ts
  magic-link.schema.ts
  magic-link.controller.spec.ts
  magic-link.use-case.spec.ts
```

### Validator

```typescript
export const MagicLinkQueryValidator = z.object({
  code: z.string({ message: 'O codigo e obrigatorio' }).min(1, 'O codigo e obrigatorio').trim(),
});
```

### Fluxo do Use Case

1. Busca o `ValidationToken` pelo codigo
2. Verifica se o token ja foi usado (`VALIDATED`) ou expirou (`EXPIRED`)
3. Calcula a diferenca de tempo desde a criacao (limite: **10 minutos**)
4. Se expirado, atualiza o status para `EXPIRED` e retorna erro
5. Atualiza o status para `VALIDATED`
6. Busca o usuario associado ao token
7. Se o usuario estiver `INACTIVE`, ativa-o (`ACTIVE`)
8. Retorna `Right(user)`

### Fluxo do Controller (apos use case)

1. Gera tokens JWT (`createTokens`)
2. Define cookies httpOnly (`setCookieTokens`)
3. Redireciona (302) para `{APP_CLIENT_URL}/dashboard?authentication=success`

### Codigos de Resposta

| Codigo | Causa | Descricao |
|--------|-------|-----------|
| 302 | - | Redirect para o dashboard com autenticacao |
| 404 | `VALIDATION_TOKEN_NOT_FOUND` | Codigo nao encontrado |
| 404 | `USER_NOT_FOUND` | Usuario nao encontrado |
| 409 | `VALIDATION_TOKEN_ALREADY_USED` | Codigo ja utilizado |
| 410 | `VALIDATION_TOKEN_EXPIRED` | Codigo expirado |
| 500 | `MAGIC_LINK_ERROR` | Erro interno do servidor |

---

## Modelo ValidationToken

Utilizado pelos fluxos de recuperacao de senha e magic link:

```typescript
type IValidationToken = {
  _id: string;
  user: IUser;
  code: string;
  status: 'REQUESTED' | 'EXPIRED' | 'VALIDATED';
  createdAt: Date;
  updatedAt: Date | null;
};
```

### Status do Token

| Status | Descricao |
|--------|-----------|
| `REQUESTED` | Token criado, aguardando validacao |
| `VALIDATED` | Token validado com sucesso |
| `EXPIRED` | Token expirado (mais de 10 minutos ou marcado manualmente) |

## Seguranca

- Tokens JWT sao armazenados em cookies **httpOnly** (nao acessiveis via JavaScript no browser)
- Existem dois tipos de token JWT: `ACCESS` e `REFRESH`
- Senhas sao hasheadas com `bcryptjs`
- O regex de senha exige: pelo menos 1 maiuscula, 1 minuscula, 1 numero e 1 caractere especial
- Codigos de validacao expiram em 10 minutos
- O magic link ativa usuarios inativos automaticamente
