# Skill: Teste Unitario

Testes unitarios validam o comportamento isolado de cada use case, garantindo que a logica de negocio funcione corretamente sem depender de banco de dados real ou servicos externos. Utilizamos repositorios memory para simular a camada de persistencia e o pattern Either (isRight/isLeft) para verificar respostas de sucesso e erro de forma explicita.

---

## Estrutura do Arquivo

O arquivo de teste unitario fica co-localizado com o use case que ele testa, dentro da pasta da entidade e acao correspondente.

```
backend/
  application/
    resources/
      [entity]/
        [action]/
          [action].use-case.ts
          [action].use-case.spec.ts    <-- arquivo de teste unitario
```

Cada arquivo `.use-case.spec.ts` deve conter:

1. **Imports** - vitest (`describe`, `it`, `expect`, `beforeEach`, `vi`), repositorio memory e use case
2. **Variaveis de modulo** - repositorio memory e `sut` (System Under Test)
3. **Bloco `describe`** - agrupa todos os testes do use case
4. **`beforeEach`** - recria o repositorio e o `sut` a cada teste
5. **Casos de teste** - happy path, error path 404 e error path 500

## Template

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';
import [Entity]InMemoryRepository from '@application/repositories/[entity]/[entity]-in-memory.repository';
import [Entity][Action]UseCase from './[action].use-case';

let [entity]InMemoryRepository: [Entity]InMemoryRepository;
let sut: [Entity][Action]UseCase;

describe('[Entity] [Action] Use Case', () => {
  beforeEach(() => {
    [entity]InMemoryRepository = new [Entity]InMemoryRepository();
    sut = new [Entity][Action]UseCase([entity]InMemoryRepository);
  });

  it('deve [descricao do cenario de sucesso]', async () => {
    // Arrange: preparar dados necessarios
    const created = await [entity]InMemoryRepository.create({
      // ...campos da entidade
    });

    // Act: executar o use case
    const result = await sut.execute({ /* ...parametros */ });

    // Assert: verificar resultado de sucesso
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value./* campo */).toBe(/* valor esperado */);
    }
  });

  it('deve retornar erro [CAUSA] ([codigo]) quando [condicao]', async () => {
    // Act: executar com dados que causam erro esperado
    const result = await sut.execute({ /* ...parametros invalidos */ });

    // Assert: verificar resultado de erro
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(404);
      expect(result.value.cause).toBe('[ENTITY]_NOT_FOUND');
    }
  });

  it('deve retornar erro [CAUSA] (500) em falha de DB', async () => {
    // Arrange: simular falha no repositorio
    vi.spyOn([entity]InMemoryRepository, '[metodo]').mockRejectedValueOnce(new Error('Database error'));

    // Act
    const result = await sut.execute({ /* ...parametros */ });

    // Assert
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('[ACAO]_[ENTITY]_ERROR');
    }
  });
});
```

## Exemplo Real

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UserInMemoryRepository from '@application/repositories/user/user-in-memory.repository';
import UserShowUseCase from './show.use-case';

let userInMemoryRepository: UserInMemoryRepository;
let sut: UserShowUseCase;

describe('User Show Use Case', () => {
  beforeEach(() => {
    userInMemoryRepository = new UserInMemoryRepository();
    sut = new UserShowUseCase(userInMemoryRepository);
  });

  it('deve retornar usuario quando encontrado', async () => {
    const created = await userInMemoryRepository.create({
      name: 'John Doe', email: 'john@example.com', password: 'password123', group: 'group-id',
    });
    const result = await sut.execute({ _id: created._id });
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value._id).toBe(created._id);
      expect(result.value.name).toBe('John Doe');
    }
  });

  it('deve retornar erro USER_NOT_FOUND (404) quando usuario nao existe', async () => {
    const result = await sut.execute({ id: 'non-existent-id' });
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(404);
      expect(result.value.cause).toBe('USER_NOT_FOUND');
    }
  });

  it('deve retornar erro GET_USER_BY_ID_ERROR (500) em falha de DB', async () => {
    vi.spyOn(userInMemoryRepository, 'findBy').mockRejectedValueOnce(new Error('Database error'));
    const result = await sut.execute({ id: 'any-id' });
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(500);
      expect(result.value.cause).toBe('GET_USER_BY_ID_ERROR');
    }
  });
});
```

## Regras e Convencoes

1. **NUNCA usar banco de dados real** - Sempre utilizar repositorios memory (`[Entity]InMemoryRepository`). Testes unitarios devem ser rapidos, isolados e sem dependencias externas.
2. **`beforeEach` recria repositorio e `sut`** - Cada teste comeca com um estado limpo. Instanciar o repositorio memory e o use case dentro do `beforeEach` garante isolamento total entre os testes.
3. **`sut` significa System Under Test** - A variavel `sut` sempre referencia a instancia do use case sendo testado. Essa convencao facilita a leitura e padroniza o codebase.
4. **Testar os tres cenarios obrigatorios**:
   - **Happy path** (`isRight`) - o use case retorna sucesso com os dados esperados
   - **Error path 404** (`isLeft`) - o recurso nao foi encontrado, verificar `code` e `cause`
   - **Error path 500** (`isLeft`) - falha interna simulada com `vi.spyOn` e `mockRejectedValueOnce`
5. **Descricao dos testes em portugues** - Os textos dentro de `it('...')` devem ser escritos em portugues para facilitar a leitura do output dos testes.
6. **`vi.spyOn` para simular falhas** - Usar `vi.spyOn(repositorio, 'metodo').mockRejectedValueOnce(new Error('...'))` para simular erros de banco de dados sem alterar a implementacao do repositorio.
7. **Verificar `isRight()`/`isLeft()` antes de acessar `value`** - Sempre verificar o tipo do resultado com `if (result.isRight())` ou `if (result.isLeft())` antes de acessar propriedades de `result.value`. Isso garante type safety com o pattern Either.
8. **Nomenclatura do arquivo** - O arquivo de teste deve ter o mesmo nome do use case com o sufixo `.spec.ts`: `[action].use-case.spec.ts`.

## Checklist

- [ ] O arquivo esta em `backend/application/resources/[entity]/[action]/[action].use-case.spec.ts`
- [ ] Imports de `vitest` incluem `beforeEach`, `describe`, `expect`, `it` e `vi`
- [ ] Repositorio memory importado e instanciado (NUNCA DB real)
- [ ] Variavel `sut` declarada no escopo do modulo
- [ ] `beforeEach` recria o repositorio e o `sut` a cada teste
- [ ] Teste de happy path verifica `result.isRight()` e valores do `result.value`
- [ ] Teste de error path 404 verifica `result.isLeft()`, `code` 404 e `cause` correto
- [ ] Teste de error path 500 usa `vi.spyOn` com `mockRejectedValueOnce`
- [ ] Teste de error path 500 verifica `result.isLeft()`, `code` 500 e `cause` correto
- [ ] Descricoes dos testes (`it('...')`) escritas em portugues
- [ ] Guard clause `if (result.isRight())` / `if (result.isLeft())` antes de acessar `value`

## Erros Comuns

1. **Usar banco de dados real no teste unitario** - Testes unitarios NUNCA devem depender de MongoDB, PostgreSQL ou qualquer banco real. Use sempre o repositorio memory. Testes com DB real pertencem aos testes E2E (ver `006-skill-teste-e2e.md`).

2. **Nao recriar o repositorio e `sut` no `beforeEach`** - Se o repositorio for compartilhado entre testes, dados de um teste podem vazar para outro, causando falsos positivos ou falsos negativos.

3. **Acessar `result.value` sem verificar `isRight()`/`isLeft()`** - Sem a verificacao, o TypeScript nao consegue inferir o tipo correto de `value`, podendo causar erros de compilacao ou assertions incorretas.

4. **Usar `mockRejectedValue` em vez de `mockRejectedValueOnce`** - `mockRejectedValue` altera o mock permanentemente, o que pode afetar testes subsequentes. Sempre usar `mockRejectedValueOnce` para garantir que o mock se aplica apenas a uma chamada.

5. **Esquecer de testar o error path 500** - Falhas de banco de dados sao cenarios reais que precisam ser cobertos. Sem esse teste, erros internos podem passar despercebidos e retornar respostas inesperadas ao cliente.

6. **Descrever testes em ingles** - A convencao do projeto e manter descricoes em portugues. Manter consistencia facilita a leitura dos relatorios de teste por toda a equipe.

7. **Nao verificar o campo `cause` no error path** - Verificar apenas o `code` (404, 500) nao e suficiente. O campo `cause` identifica especificamente o tipo de erro e e essencial para debugging e tratamento no frontend.

> **Cross-references**: ver [001-skill-use-case.md](./001-skill-use-case.md) para a estrutura do use case testado, [009-skill-repository.md](./009-skill-repository.md) para a implementacao dos repositorios memory, e [010-skill-core-either.md](./010-skill-core-either.md) para o pattern Either (isRight/isLeft).
