# Skill: Either Pattern + HTTPException

O Either Pattern e a base do tratamento de erros em todo o backend do project. Ao inves de usar `throw` para sinalizar falhas, os use cases retornam um tipo `Either<L, R>` onde `L` (Left) representa erro e `R` (Right) representa sucesso. Combinado com a classe `HTTPException`, esse padrao garante fluxo de controle explicito, previsivel e type-safe em toda a aplicacao.

---

## Estrutura do Arquivo

O pattern Either e a classe HTTPException vivem na camada core da aplicacao:

```
backend/application/core/
  either.ts        # Classes Left, Right, tipo Either, helpers left() e right()
  exception.ts     # Classe HTTPException com factory methods estaticos
```

- `either.ts` exporta as classes `Left` e `Right`, o tipo union `Either<L, R>` e as funcoes helper `left()` e `right()`.
- `exception.ts` exporta a classe `HTTPException` que estende `Error` com constructor protegido e factory methods estaticos para cada codigo HTTP.

---

## Template

### either.ts

```typescript
// ERROR
export class Left<L, R> {
  readonly value: L;
  constructor(value: L) {
    this.value = value;
  }
  isRight(): this is Right<L, R> {
    return false;
  }
  isLeft(): this is Left<L, R> {
    return true;
  }
}

// SUCCESS
export class Right<L, R> {
  readonly value: R;
  constructor(value: R) {
    this.value = value;
  }
  isRight(): this is Right<L, R> {
    return true;
  }
  isLeft(): this is Left<L, R> {
    return false;
  }
}

export type Either<L, R> = Left<L, R> | Right<L, R>;

export const left = <L, R>(value: L): Either<L, R> => new Left(value);
export const right = <L, R>(value: R): Either<L, R> => new Right(value);
```

### exception.ts (resumo)

```typescript
export class HTTPException extends Error {
  readonly code: number;
  readonly cause: string;
  readonly errors?: Record<string, string>;

  protected constructor(params: {
    message: string;
    code: number;
    cause: string;
    errors?: Record<string, string>;
  }) {
    super(params.message);
    this.code = params.code;
    this.cause = params.cause;
    this.errors = params.errors;
  }

  // Factory methods estaticos
  static BadRequest(cause: string, errors?: Record<string, string>): HTTPException;
  static Unauthorized(cause: string): HTTPException;
  static Forbidden(cause: string): HTTPException;
  static NotFound(cause: string): HTTPException;
  static Conflict(cause: string): HTTPException;
  static UnprocessableEntity(cause: string, errors?: Record<string, string>): HTTPException;
  static InternalServerError(cause: string): HTTPException;
}
```

---

## Exemplo Real

### Use case retornando Either

```typescript
import { left, right, type Either } from '@application/core/either';
import { HTTPException } from '@application/core/exception';
import type { IUser } from '@application/core/entities';

type Input = { email: string; password: string };
type Output = Either<HTTPException, IUser>;

export class AuthenticateUserUseCase {
  constructor(private readonly userRepository: UserContractRepository) {}

  async execute(input: Input): Promise<Output> {
    const user = await this.userRepository.findBy({ email: input.email });

    if (!user) {
      return left(HTTPException.NotFound('Usuario nao encontrado'));
    }

    const passwordMatch = await compare(input.password, user.password);

    if (!passwordMatch) {
      return left(HTTPException.Unauthorized('Credenciais invalidas'));
    }

    return right(user);
  }
}
```

### Controller consumindo Either

```typescript
export class AuthenticateUserController {
  constructor(private readonly useCase: AuthenticateUserUseCase) {}

  async handle(req: Request, res: Response): Promise<Response> {
    const result = await this.useCase.execute(req.body);

    if (result.isLeft()) {
      const error = result.value;
      return res.status(error.code).json({
        message: error.message,
        cause: error.cause,
        errors: error.errors,
      });
    }

    const user = result.value;
    return res.status(200).json(user);
  }
}
```

### Uso dos factory methods da HTTPException

```typescript
// 400 - Bad Request (com errors de validacao)
return left(HTTPException.BadRequest('Dados invalidos', {
  email: 'Email ja esta em uso',
  name: 'Nome e obrigatorio',
}));

// 401 - Unauthorized
return left(HTTPException.Unauthorized('Token expirado'));

// 403 - Forbidden
return left(HTTPException.Forbidden('Sem permissao para acessar este recurso'));

// 404 - Not Found
return left(HTTPException.NotFound('Registro nao encontrado'));

// 409 - Conflict
return left(HTTPException.Conflict('Email ja cadastrado'));

// 422 - Unprocessable Entity (com errors de validacao)
return left(HTTPException.UnprocessableEntity('Entidade invalida', {
  status: 'Status nao permitido para esta operacao',
}));

// 500 - Internal Server Error
return left(HTTPException.InternalServerError('Falha ao processar requisicao'));
```

---

## Regras e Convencoes

1. **Use cases sempre retornam `Either<HTTPException, T>`** -- nunca usam `throw`. O tipo de retorno deve ser explicito na assinatura do metodo.

2. **Controllers sempre checam `isLeft()`** antes de acessar o valor. Se for Left, extraem o erro e retornam a response HTTP correspondente. Se for Right, extraem o dado de sucesso.

3. **HTTPException nunca e thrown diretamente** nos use cases ou controllers. Ela e usada apenas como valor dentro de `left()`. A unica excecao sao middlewares de autenticacao/autorizacao, onde `throw` e aceitavel.

4. **Sempre use `left()` para erros e `right()` para sucesso** -- nunca instancie `new Left()` ou `new Right()` diretamente.

5. **Use os factory methods estaticos** (`HTTPException.NotFound(...)`, `HTTPException.BadRequest(...)`, etc.) ao inves de instanciar HTTPException manualmente. Isso evita erros de codigo HTTP e padroniza as mensagens.

6. **Generics `L` e `R`** -- por convencao, `L` (Left) e sempre `HTTPException` e `R` (Right) e o tipo de retorno de sucesso. Nunca inverta essa ordem.

7. **O campo `errors`** e opcional e deve ser usado apenas em `BadRequest` e `UnprocessableEntity` para detalhar erros de validacao campo a campo.

---

## Checklist

- [ ] O use case retorna `Promise<Either<HTTPException, T>>` na assinatura
- [ ] Todos os caminhos de erro usam `return left(HTTPException.XYZ(...))` ao inves de `throw`
- [ ] Todos os caminhos de sucesso usam `return right(valor)`
- [ ] O controller checa `result.isLeft()` antes de acessar `result.value`
- [ ] O controller retorna `res.status(error.code).json(...)` quando Left
- [ ] Os factory methods estaticos corretos sao usados (ex: `NotFound` para 404, nao `BadRequest`)
- [ ] O campo `errors` so e passado em `BadRequest` e `UnprocessableEntity`
- [ ] Nenhum `throw new HTTPException()` existe fora de middlewares
- [ ] Os generics estao na ordem correta: `Either<HTTPException, TipoSucesso>`

---

## Erros Comuns

| Erro | Problema | Correcao |
|------|----------|----------|
| `throw HTTPException.NotFound(...)` | HTTPException sendo thrown no use case quebra o pattern Either e o tipo de retorno | Usar `return left(HTTPException.NotFound(...))` |
| Esquecer de checar `isLeft()` | Acessar `result.value` diretamente pode resultar em acessar um HTTPException como se fosse dado de sucesso | Sempre checar `if (result.isLeft())` antes de usar o valor |
| `HTTPException.BadRequest(...)` para recurso nao encontrado | Codigo HTTP semanticamente errado (400 vs 404) | Usar o factory method correto: `HTTPException.NotFound(...)` |
| `Either<IUser, HTTPException>` | Generics invertidos -- Left deve ser erro, Right deve ser sucesso | Corrigir para `Either<HTTPException, IUser>` |
| `new HTTPException(...)` | Constructor e `protected`, nao pode ser chamado diretamente | Usar factory methods estaticos: `HTTPException.NotFound(...)` |
| `return left("erro")` | Passando string ao inves de HTTPException | Usar `return left(HTTPException.XYZ("erro"))` |
| Nao tipar o Output | Perder type safety e permitir que erros passem despercebidos no compile time | Definir `type Output = Either<HTTPException, T>` explicitamente |

---

> **Cross-references:** ver `001-skill-use-case.md` para a estrutura completa de use cases que consomem Either, e `002-skill-controller.md` para como controllers tratam o resultado Either.
