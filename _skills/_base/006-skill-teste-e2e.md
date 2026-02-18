# Skill: Teste E2E (Mongoose/MongoDB)

Testes end-to-end (E2E) validam o fluxo completo de uma requisicao HTTP, desde o controller ate o banco de dados MongoDB, passando por autenticacao, middlewares e use cases. Diferente dos testes unitarios que usam repositorios in-memory, os testes E2E utilizam o kernel real da aplicacao e um banco de dados de teste com Mongoose, simulando o comportamento exato que um cliente teria ao consumir a API. O ambiente de teste usa um banco MongoDB isolado para garantir que os testes nao interfiram no banco de desenvolvimento.

---

## Estrutura do Arquivo

O arquivo de teste E2E fica co-localizado com o controller que ele testa, dentro da pasta da entidade e acao correspondente.

```
backend/
  application/
    resources/
      [entity]/
        [action]/
          [action].controller.ts
          [action].controller.spec.ts    <-- arquivo de teste E2E
    model/
      [entity].model.ts                  <-- Models Mongoose importados no teste
  vitest.e2e.config.ts                   <-- configuracao separada para E2E
```

Cada arquivo `.controller.spec.ts` deve conter:

1. **Imports** - `supertest`, vitest (`describe`, `it`, `expect`, `beforeEach`, `afterAll`), Models Mongoose, kernel e helpers de autenticacao
2. **Bloco `describe` externo** - identifica o controller E2E
3. **`beforeEach`** - inicializa o kernel e limpa as collections do banco de teste
4. **`afterAll`** - encerra o kernel
5. **Blocos `describe` internos** - agrupados por rota HTTP (`GET /users/:_id`, `POST /users`, etc.)
6. **Casos de teste** - cenarios com e sem autenticacao, status codes e validacao do body

## Template

```typescript
import supertest from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { ChildEntity } from '@application/model/child-entity.model';
import { Entity } from '@application/model/entity.model';
import { kernel } from '@start/kernel';
import { createAuthenticatedUser } from '@test/helpers/auth.helper';

describe('E2E [Entity] [Action] Controller', () => {
  beforeEach(async () => {
    await kernel.ready();

    // Limpar collections (sem necessidade de ordem por FK no MongoDB)
    await Entity.deleteMany({});
    await ChildEntity.deleteMany({});
  });

  afterAll(async () => {
    await kernel.close();
  });

  describe('[METHOD] /[entity-route]', () => {
    it('deve [descricao do cenario de sucesso]', async () => {
      const { cookies } = await createAuthenticatedUser();

      // Setup de dados necessarios
      const entity = await Entity.create({
        name: 'Test Entity',
        // ... campos obrigatorios
      });

      const response = await supertest(kernel.server)
        .[method](`/[entity-route]/${entity._id.toString()}`)
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(200);
      expect(response.body.name).toBe('Test Entity');
    });

    it('deve retornar 401 quando nao autenticado', async () => {
      const response = await supertest(kernel.server)
        .[method]('/[entity-route]/any-id');

      expect(response.statusCode).toBe(401);
    });
  });
});
```

## Exemplo Real

```typescript
import supertest from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { UserGroup } from '@application/model/user-group.model';
import { User } from '@application/model/user.model';
import { kernel } from '@start/kernel';
import { createAuthenticatedUser } from '@test/helpers/auth.helper';

describe('E2E User Create Controller', () => {
  beforeEach(async () => {
    await kernel.ready();
    await User.deleteMany({});
    await UserGroup.deleteMany({});
  });

  afterAll(async () => {
    await kernel.close();
  });

  describe('POST /users', () => {
    it('deve criar usuario com sucesso', async () => {
      const { cookies, permissions } = await createAuthenticatedUser();

      const group = await UserGroup.create({
        name: 'Customer',
        slug: 'customer',
        permissions,
      });

      const response = await supertest(kernel.server)
        .post('/users')
        .set('Cookie', cookies)
        .send({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'S3nha@123A',
          group: group._id.toString(),
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.name).toBe('New User');
      expect(response.body.email).toBe('newuser@example.com');
    });

    it('deve retornar 401 quando nao autenticado', async () => {
      const response = await supertest(kernel.server)
        .post('/users')
        .send({
          name: 'Test',
          email: 'test@example.com',
          password: 'S3nha@123A',
          group: 'any-id',
        });

      expect(response.statusCode).toBe(401);
    });
  });
});
```

**Leitura do exemplo:**

1. `User` e `UserGroup` sao Models Mongoose importados diretamente (nao PrismaClient).
2. `deleteMany({})` sequencial para limpar as collections. No MongoDB, nao ha foreign key constraints, entao a ordem e menos critica, mas e boa pratica limpar collections dependentes.
3. `kernel.ready()` no `beforeEach` garante que o servidor e o Mongoose estejam conectados.
4. `kernel.close()` no `afterAll` encerra o servidor HTTP. Nao e necessario desconectar o Mongoose manualmente.
5. `group._id.toString()` converte o ObjectId para string antes de enviar no payload.
6. `createAuthenticatedUser()` retorna `{ cookies, permissions }` para setup de autenticacao nos testes.

## Regras e Convencoes

1. **`kernel.ready()` no `beforeEach`** - O kernel deve ser inicializado antes de cada teste para garantir que o servidor e todas as dependencias estejam prontos.

2. **Limpeza com `Model.deleteMany({})` sequencial** - As collections envolvidas no teste devem ser limpas antes de cada execucao usando `deleteMany({})` em cada Model. Diferente do Prisma, nao precisa de `$transaction`.

3. **Sem `disconnect()` no `afterAll`** - O Mongoose gerencia a conexao internamente. Apenas `kernel.close()` e necessario para encerrar o servidor HTTP.

4. **`kernel.close()` no `afterAll`** - O kernel deve ser encerrado apos todos os testes do bloco `describe` para fechar o servidor HTTP. Usar `afterAll` (nao `afterEach`) pois o kernel e reutilizado entre testes.

5. **Banco de teste separado** - Os testes E2E devem rodar contra um banco MongoDB de teste, configurado via variavel de ambiente `DATABASE_URL` no `.env.test`. Nunca rode testes contra o banco de desenvolvimento.

6. **Vitest com config separada** - Os testes E2E usam `vitest.e2e.config.ts` com configuracao especifica (timeout maior, setup de banco, etc.), separada dos testes unitarios.

7. **`createAuthenticatedUser` helper** - Utilizar o helper `createAuthenticatedUser()` importado de `@test/helpers/auth.helper` para criar um usuario autenticado. Este helper retorna `{ cookies, permissions }` onde `cookies` contem os cookies de sessao.

8. **`supertest(kernel.server)` para requisicoes** - Todas as requisicoes HTTP devem ser feitas atraves do `supertest` utilizando `kernel.server` como argumento.

9. **`.set('Cookie', cookies)` para autenticacao** - Rotas protegidas devem incluir os cookies de sessao no header da requisicao.

10. **Testar com e sem autenticacao** - Para rotas protegidas, incluir pelo menos um teste sem autenticacao para garantir que o middleware de auth retorna 401.

11. **Verificar status codes e body** - Cada teste deve verificar tanto o `response.statusCode` quanto os campos relevantes do `response.body`. Para dados sensiveis como `password`, verificar com `toBeUndefined()`.

12. **Descricao dos testes em portugues** - Assim como nos testes unitarios, os textos dentro de `it('...')` devem ser escritos em portugues.

13. **`_id` em URLs e assertions** - Os testes devem usar `_id` (nao `id`). Para usar em URLs, converter com `_id.toString()`.

14. **`Model.create()` para setup de dados** - Para criar dados de teste, importe o Model Mongoose e use `Model.create()` diretamente (nao o repository).

## Checklist

- [ ] O arquivo esta em `backend/application/resources/[entity]/[action]/[action].controller.spec.ts`
- [ ] Imports incluem `supertest`, hooks do `vitest`, Models Mongoose, `kernel` e `createAuthenticatedUser`
- [ ] `beforeEach` chama `await kernel.ready()`
- [ ] `beforeEach` limpa collections com `Model.deleteMany({})` sequencial
- [ ] `afterAll` chama `await kernel.close()`
- [ ] Nao ha `prisma.$disconnect()` ou `mongoose.disconnect()` no afterAll
- [ ] Requisicoes feitas com `supertest(kernel.server)`
- [ ] Rotas protegidas incluem `.set('Cookie', cookies)`
- [ ] Teste de sucesso verifica `statusCode` e campos do `body`
- [ ] Teste sem autenticacao verifica retorno 401 para rotas protegidas
- [ ] Campos sensiveis (ex: `password`) verificados com `toBeUndefined()`
- [ ] Descricoes dos testes (`it('...')`) escritas em portugues
- [ ] Blocos `describe` internos organizam testes por rota HTTP
- [ ] Usa `_id` (nao `id`) em URLs e assertions
- [ ] ObjectIds convertidos com `.toString()` quando necessario

## Erros Comuns

1. **Esquecer de chamar `kernel.ready()` no `beforeEach`** - Sem a inicializacao do kernel, o servidor nao estara disponivel e todas as requisicoes `supertest` falharao.

2. **Usar `prisma.$transaction` para limpeza** - No Mongoose, use `Model.deleteMany({})` sequencial para cada collection. Nao existe `$transaction` para limpeza.

3. **Adicionar `prisma.$disconnect()` ou `mongoose.disconnect()` no `afterAll`** - Desnecessario. O Mongoose gerencia conexoes internamente. Apenas `kernel.close()` e necessario.

4. **Usar `afterEach` em vez de `afterAll` para `kernel.close()`** - Fechar o kernel apos cada teste e reabri-lo e desnecessariamente lento.

5. **Esquecer de enviar cookies em rotas protegidas** - Sem `.set('Cookie', cookies)`, a requisicao retornara 401.

6. **Usar `id` em vez de `_id` nas rotas e assertions** - O padrao do projeto com Mongoose/MongoDB e `_id`, nao `id`.

7. **Usar UUIDs em vez de ObjectIds** - IDs de teste devem usar ObjectIds validos ou strings geradas pelo `Model.create()`. Nao use UUIDs formatados.

8. **Rodar testes contra banco de desenvolvimento** - Sempre configure um banco de teste separado via `.env.test` com variavel `DATABASE_URL` dedicada.

9. **Confundir teste E2E com teste unitario** - Testes E2E usam banco de dados real (MongoDB) e o kernel completo. Testes unitarios usam repositorios in-memory. Nao misturar abordagens.

10. **Importar PrismaClient no teste** - Importe os Models Mongoose diretamente: `import { User } from '@application/model/user.model'`.

> **Cross-references**: ver [002-skill-controller.md](./002-skill-controller.md) para a estrutura do controller testado, [014-skill-kernel.md](./014-skill-kernel.md) para detalhes sobre o kernel da aplicacao, e [008-skill-model.md](./008-skill-model.md) para a definicao dos Models Mongoose.
