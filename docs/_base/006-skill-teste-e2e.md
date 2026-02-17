# Skill: Teste E2E

Testes end-to-end (E2E) validam o fluxo completo de uma requisicao HTTP, desde o controller ate o banco de dados, passando por autenticacao, middlewares e use cases. Diferente dos testes unitarios que usam repositorios in-memory, os testes E2E utilizam o kernel real da aplicacao e um banco de dados de teste, simulando o comportamento exato que um cliente teria ao consumir a API.

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
```

Cada arquivo `.controller.spec.ts` deve conter:

1. **Imports** - `supertest`, vitest (`describe`, `it`, `expect`, `beforeEach`, `afterAll`), models, kernel e helpers de autenticacao
2. **Bloco `describe` externo** - identifica o controller E2E
3. **`beforeEach`** - inicializa o kernel e limpa as collections do banco
4. **`afterAll`** - encerra o kernel
5. **Blocos `describe` internos** - agrupados por rota HTTP (`GET /users/:_id`, `POST /users`, etc.)
6. **Casos de teste** - cenarios com e sem autenticacao, status codes e validacao do body

## Template

```typescript
import supertest from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { [EntityGroup] } from '@application/model/[entity-group].model';
import { [Entity] } from '@application/model/[entity].model';
import { kernel } from '@start/kernel';
import { createAuthenticatedUser } from '@test/helpers/auth.helper';

describe('E2E [Entity] [Action] Controller', () => {
  beforeEach(async () => {
    await kernel.ready();
    await [Entity].deleteMany({});
    await [EntityGroup].deleteMany({});
  });

  afterAll(async () => {
    await kernel.close();
  });

  describe('[METHOD] /[entity-route]', () => {
    it('deve [descricao do cenario de sucesso]', async () => {
      const { cookies, user } = await createAuthenticatedUser();

      const response = await supertest(kernel.server)
        .[method]('/[entity-route]')
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(200);
      expect(response.body./* campo */).toBe(/* valor esperado */);
    });

    it('deve retornar 401 quando nao autenticado', async () => {
      const response = await supertest(kernel.server)
        .[method]('/[entity-route]');

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

describe('E2E User Show Controller', () => {
  beforeEach(async () => {
    await kernel.ready();
    await User.deleteMany({});
    await UserGroup.deleteMany({});
  });

  afterAll(async () => {
    await kernel.close();
  });

  describe('GET /users/:_id', () => {
    it('deve retornar usuario com sucesso', async () => {
      const { cookies, user } = await createAuthenticatedUser();
      const response = await supertest(kernel.server)
        .get(`/users/${user._id}`)
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(200);
      expect(response.body._id).toBe(user._id);
      expect(response.body.email).toBe(user.email);
      expect(response.body.password).toBeUndefined();
    });
  });
});
```

## Regras e Convencoes

1. **`kernel.ready()` no `beforeEach`** - O kernel deve ser inicializado antes de cada teste para garantir que o servidor e todas as dependencias estejam prontos. Isso assegura que cada teste comeca com a aplicacao em estado funcional.

2. **`deleteMany({})` no `beforeEach` para limpar o banco** - Todas as collections envolvidas no teste devem ser limpas antes de cada execucao. Isso garante isolamento entre os testes e evita que dados residuais causem falsos positivos ou negativos.

3. **`kernel.close()` no `afterAll`** - O kernel deve ser encerrado apos todos os testes do bloco `describe` para liberar conexoes com o banco de dados e fechar o servidor HTTP. Usar `afterAll` (nao `afterEach`) pois o kernel e reutilizado entre testes.

4. **`createAuthenticatedUser` helper** - Utilizar o helper `createAuthenticatedUser()` importado de `@test/helpers/auth.helper` para criar um usuario autenticado. Este helper retorna um objeto `{ cookies, user }` onde `cookies` contem os cookies de sessao e `user` contem os dados do usuario criado.

5. **`supertest(kernel.server)` para requisicoes** - Todas as requisicoes HTTP devem ser feitas atraves do `supertest` utilizando `kernel.server` como argumento. Isso garante que as requisicoes sejam feitas diretamente ao servidor sem necessidade de uma porta de rede.

6. **`.set('Cookie', cookies)` para autenticacao** - Rotas protegidas devem incluir os cookies de sessao no header da requisicao. Sem isso, a requisicao sera rejeitada com status 401.

7. **Testar com e sem autenticacao** - Para rotas protegidas, incluir pelo menos um teste sem autenticacao para garantir que o middleware de auth esta funcionando corretamente e retornando 401.

8. **Verificar status codes e body** - Cada teste deve verificar tanto o `response.statusCode` quanto os campos relevantes do `response.body`. Para dados sensiveis como `password`, verificar que eles NAO estao presentes no body com `toBeUndefined()`.

9. **Descricao dos testes em portugues** - Assim como nos testes unitarios, os textos dentro de `it('...')` devem ser escritos em portugues.

10. **Blocos `describe` internos por rota** - Agrupar os testes por metodo HTTP e rota (`GET /users/:_id`, `POST /users`, etc.) dentro de blocos `describe` aninhados para organizar melhor os cenarios.

11. **Nomenclatura do arquivo** - O arquivo de teste deve ter o mesmo nome do controller com o sufixo `.spec.ts`: `[action].controller.spec.ts`.

## Checklist

- [ ] O arquivo esta em `backend/application/resources/[entity]/[action]/[action].controller.spec.ts`
- [ ] Imports incluem `supertest`, hooks do `vitest`, models, `kernel` e `createAuthenticatedUser`
- [ ] `beforeEach` chama `await kernel.ready()`
- [ ] `beforeEach` limpa todas as collections com `deleteMany({})`
- [ ] `afterAll` chama `await kernel.close()`
- [ ] Requisicoes feitas com `supertest(kernel.server)`
- [ ] Rotas protegidas incluem `.set('Cookie', cookies)`
- [ ] Teste de sucesso verifica `statusCode` e campos do `body`
- [ ] Teste sem autenticacao verifica retorno 401 para rotas protegidas
- [ ] Campos sensiveis (ex: `password`) verificados com `toBeUndefined()`
- [ ] Descricoes dos testes (`it('...')`) escritas em portugues
- [ ] Blocos `describe` internos organizam testes por rota HTTP

## Erros Comuns

1. **Esquecer de chamar `kernel.ready()` no `beforeEach`** - Sem a inicializacao do kernel, o servidor nao estara disponivel e todas as requisicoes `supertest` falharao com erros de conexao.

2. **Nao limpar as collections no `beforeEach`** - Dados residuais de testes anteriores podem causar resultados inesperados. Sempre usar `deleteMany({})` em todas as collections relevantes antes de cada teste.

3. **Usar `afterEach` em vez de `afterAll` para `kernel.close()`** - Fechar o kernel apos cada teste e reabri-lo e desnecessariamente lento. O kernel deve ser fechado apenas uma vez, apos todos os testes do bloco `describe`.

4. **Esquecer de enviar cookies em rotas protegidas** - Sem `.set('Cookie', cookies)`, a requisicao sera tratada como nao autenticada e retornara 401, mesmo que o teste espere um 200.

5. **Nao testar o cenario sem autenticacao** - Rotas protegidas devem ter pelo menos um teste que valide o comportamento quando o usuario nao esta autenticado. Sem esse teste, falhas no middleware de autenticacao passam despercebidas.

6. **Verificar apenas o `statusCode` sem validar o `body`** - Um status 200 nao garante que os dados retornados estao corretos. Sempre verificar os campos relevantes do body da resposta.

7. **Nao verificar ausencia de campos sensiveis** - Campos como `password` nunca devem ser retornados na resposta da API. Usar `expect(response.body.password).toBeUndefined()` para garantir que dados sensiveis nao vazam.

8. **Criar dados manualmente em vez de usar `createAuthenticatedUser`** - O helper `createAuthenticatedUser` ja cuida de criar o usuario, o grupo e gerar os cookies de sessao. Recriar essa logica manualmente em cada teste gera duplicacao e fragilidade.

9. **Confundir teste E2E com teste unitario** - Testes E2E usam banco de dados real e o kernel completo, enquanto testes unitarios usam repositorios in-memory. Nao misturar as abordagens no mesmo arquivo de teste.

> **Cross-references**: ver [002-skill-controller.md](./002-skill-controller.md) para a estrutura do controller testado e [014-skill-kernel.md](./014-skill-kernel.md) para detalhes sobre o kernel da aplicacao.
