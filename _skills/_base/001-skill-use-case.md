# Skill: Use Case

O use case e a unidade central de logica de negocio da aplicacao. Cada action de uma entidade possui seu proprio use case, que recebe um payload validado, executa a operacao via repository injetado e retorna um `Either<HTTPException, Entity>`. O padrao Either elimina o uso de `throw` para controle de fluxo, tornando o tratamento de erros explicito e previsivel. O use case nunca conhece a implementacao concreta do repository -- apenas o contract abstrato, garantindo inversao de dependencia.

---

## Estrutura do Arquivo

```
backend/
  application/
    resources/
      [entity]/
        [action]/
          [action].use-case.ts        <-- use case da action
          [action].controller.ts
          [action].validator.ts
    core/
      either.core.ts                  <-- Either, left, right
      exception.core.ts               <-- HTTPException
      entity.core.ts                  <-- interfaces de entidade
    repositories/
      [entity]/
        [entity]-contract.repository.ts
```

- O use case vive em `backend/application/resources/[entity]/[action]/[action].use-case.ts`.
- Depende de `either.core.ts` para o padrao Either, `exception.core.ts` para erros HTTP e do contract do repository.

---

## Template

```typescript
import { Service } from 'fastify-decorators';
import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { I{{Entity}} as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { {{Entity}}ContractRepository } from '@application/repositories/{{entity}}/{{entity}}-contract.repository';
import type { {{Entity}}{{Action}}Payload } from './{{action}}.validator';

type Response = Either<HTTPException, Entity>;
type Payload = {{Entity}}{{Action}}Payload;

@Service()
export default class {{Entity}}{{Action}}UseCase {
  constructor(private readonly {{entity}}Repository: {{Entity}}ContractRepository) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      // logica de negocio aqui
      // sucesso: return right(resultado);
      // erro de negocio: return left(HTTPException.NotFound('...', '...'));
    } catch (_error) {
      return left(HTTPException.InternalServerError('Internal server error', '{{ERROR_CODE}}'));
    }
  }
}
```

---

## Exemplo Real

```typescript
import { Service } from 'fastify-decorators';
import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IUser as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { UserContractRepository } from '@application/repositories/user/user-contract.repository';
import type { UserShowPayload } from './show.validator';

type Response = Either<HTTPException, Entity>;
type Payload = UserShowPayload;

@Service()
export default class UserShowUseCase {
  constructor(private readonly userRepository: UserContractRepository) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const user = await this.userRepository.findBy({ _id: payload._id, exact: true });
      if (!user) return left(HTTPException.NotFound('User not found', 'USER_NOT_FOUND'));
      return right(user);
    } catch (_error) {
      return left(HTTPException.InternalServerError('Internal server error', 'GET_USER_BY_ID_ERROR'));
    }
  }
}
```

**Leitura do exemplo:**

1. `@Service()` registra a classe no container de Dependency Injection do `fastify-decorators`.
2. O constructor injeta `UserContractRepository` (o contract abstrato, nunca a implementacao concreta). A resolucao da implementacao e feita pelo DI Registry (ver `011-skill-di-registry.md`).
3. Os type aliases `Response` e `Payload` sao definidos acima da classe para manter a assinatura do `execute` limpa e legivel.
4. `execute` recebe o payload ja validado pelo validator e retorna `Promise<Response>` (ou seja, `Promise<Either<HTTPException, Entity>>`).
5. Dentro do `try`, a logica de negocio e executada: buscar o usuario pelo `_id`. Se nao encontrado, retorna `left()` com `HTTPException.NotFound`. Se encontrado, retorna `right(user)`.
6. O `catch` no nivel mais externo captura qualquer erro inesperado e retorna `left()` com `HTTPException.InternalServerError`, evitando que exceptions nao tratadas propaguem.
7. Em nenhum momento `throw` e utilizado -- todo erro e tratado via `left()`.

---

## Regras e Convencoes

1. **`@Service()` decorator** -- toda classe de use case deve ser decorada com `@Service()` do `fastify-decorators` para ser registrada no container de DI.
2. **Constructor com repository injetado (contract, nao implementacao)** -- o constructor recebe o contract abstrato (ex.: `UserContractRepository`), nunca a implementacao concreta (ex.: `UserMongooseRepository`). A resolucao e feita pelo DI Registry.
3. **`execute` retorna `Promise<Either<HTTPException, Entity>>`** -- o metodo principal sempre retorna um Either, onde `left` representa erro e `right` representa sucesso.
4. **NUNCA `throw`** -- erros de negocio e erros inesperados sao sempre retornados via `left()`. O uso de `throw` para controle de fluxo e proibido dentro do use case.
5. **`try-catch` no nivel mais externo** -- o bloco `try-catch` envolve toda a logica do `execute`. O `catch` retorna `left(HTTPException.InternalServerError(...))` como fallback para erros inesperados.
6. **`left()` para erros, `right()` para sucesso** -- use `left(HTTPException.NotFound(...))` para erros de negocio e `right(resultado)` para retornos bem-sucedidos.
7. **Types `Response` e `Payload` definidos acima da classe** -- os type aliases sao declarados entre os imports e a declaracao da classe, nunca inline na assinatura do metodo.
8. **`export default class`** -- o use case e exportado como default export.
9. **Nomenclatura** -- o padrao e `[Entity][Action]UseCase` (ex.: `UserShowUseCase`, `UserCreateUseCase`, `UserDeleteUseCase`).
10. **Um use case por action** -- cada action (show, create, update, delete, list) possui seu proprio use case em arquivo separado.

---

## Checklist

- [ ] O arquivo esta em `backend/application/resources/[entity]/[action]/[action].use-case.ts`.
- [ ] A classe esta decorada com `@Service()`.
- [ ] A classe e exportada como `export default class`.
- [ ] O nome segue o padrao `[Entity][Action]UseCase`.
- [ ] O constructor injeta o contract do repository (`ContractRepository`), nao a implementacao.
- [ ] Os type aliases `Response` e `Payload` estao definidos acima da classe.
- [ ] `Response` e `Either<HTTPException, Entity>`.
- [ ] `Payload` e o type inferido do validator correspondente.
- [ ] O metodo `execute` retorna `Promise<Response>`.
- [ ] Nao ha nenhum `throw` no arquivo.
- [ ] Todo erro e retornado via `left(HTTPException.___(...))`.
- [ ] Todo sucesso e retornado via `right(resultado)`.
- [ ] Existe um `try-catch` no nivel mais externo do `execute`.
- [ ] O `catch` retorna `left(HTTPException.InternalServerError(...))`.

---

## Erros Comuns

| Erro | Causa | Correcao |
|------|-------|----------|
| `Cannot resolve dependency` em runtime | O use case injeta a implementacao concreta em vez do contract | Trocar para o contract abstrato no constructor (ex.: `UserContractRepository`) e verificar o DI Registry |
| `throw` dentro do use case | Uso de `throw` para controle de fluxo em vez do padrao Either | Substituir por `return left(HTTPException.___(...))` |
| Type `Response` inline no metodo | Os type aliases nao foram extraidos acima da classe | Mover `type Response = Either<HTTPException, Entity>` e `type Payload = ...` para antes da declaracao da classe |
| `catch` vazio ou com `console.log` | O erro inesperado nao esta sendo tratado via Either | Sempre retornar `left(HTTPException.InternalServerError(...))` no `catch` |
| Faltou `@Service()` | A classe nao foi decorada e nao e registrada no container de DI | Adicionar `@Service()` acima da declaracao da classe |
| Repository concreto no constructor | Injeta `UserMongooseRepository` em vez de `UserContractRepository` | O use case so deve conhecer o contract; a resolucao e responsabilidade do DI Registry (ver `011-skill-di-registry.md`) |
| Logica de validacao no use case | O use case esta validando formato de dados em vez de delegar ao validator | Mover validacao de formato para o validator (ver `003-skill-validator.md`); o use case recebe dados ja validados |
| `execute` sem `try-catch` | Erros inesperados propagam como exceptions nao tratadas | Envolver toda a logica do `execute` em `try-catch` com fallback para `left(HTTPException.InternalServerError(...))` |

---

**Cross-references:** ver [010-skill-core-either.md](./010-skill-core-either.md), [003-skill-validator.md](./003-skill-validator.md), [009-skill-repository.md](./009-skill-repository.md), [002-skill-controller.md](./002-skill-controller.md).
