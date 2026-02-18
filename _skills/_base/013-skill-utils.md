# Skill: Utils

Utils sao funcoes utilitarias puras e reutilizaveis que encapsulam logica de infraestrutura compartilhada entre diferentes partes da aplicacao. Diferente de services (que usam DI e abstract classes), utils sao funcoes exportadas diretamente, sem estado interno e sem decorator `@Service()`. Elas lidam com preocupacoes transversais como geracao de tokens JWT, manipulacao de cookies, formatacao de dados e helpers de criptografia. Cada util vive em seu proprio arquivo e pode ser importada livremente por controllers, middlewares e use cases.

---

## Estrutura do Arquivo

```
backend/
  application/
    utils/
      jwt.util.ts           <-- geracao e manipulacao de tokens JWT
      cookies.util.ts        <-- set/clear de cookies HTTP
      {{nome}}.util.ts       <-- padrao: um arquivo por dominio
```

- Todos os utils ficam em `backend/application/utils/`.
- Cada arquivo recebe o nome do dominio seguido do sufixo `.util.ts`.
- Um arquivo pode exportar multiplas funcoes relacionadas ao mesmo dominio (ex.: `jwt.util.ts` exporta `createTokens`; `cookies.util.ts` exporta `setCookieTokens` e `clearCookieTokens`).

---

## Template

```typescript
// backend/application/utils/{{nome}}.util.ts

import type { FastifyRequest, FastifyReply } from 'fastify';

// Interfaces de entrada/saida quando necessario
export interface {{Nome}}Input {
  // parametros tipados
}

export interface {{Nome}}Output {
  // retorno tipado
}

// Funcoes puras exportadas
export const {{funcao}} = (input: {{Nome}}Input): {{Nome}}Output => {
  // logica utilitaria sem side effects
  // sem acesso a banco de dados
  // sem estado interno
  return resultado;
};

// Funcoes async quando necessario (ex.: crypto, jwt)
export const {{funcaoAsync}} = async (
  input: {{Nome}}Input,
  response: FastifyReply,
): Promise<{{Nome}}Output> => {
  // logica async utilitaria
  return resultado;
};
```

---

## Exemplo Real

### jwt.util.ts

```typescript
import type { FastifyReply } from 'fastify';
import { E_JWT_TYPE, type E_ROLE, type IJWTPayload, type IUser } from '@application/core/entities';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export const createTokens = async (
  user: Pick<IUser, 'id' | 'email' | 'role'>,
  response: FastifyReply,
): Promise<TokenPair> => {
  const jwt: IJWTPayload = {
    sub: user.id,
    email: user.email,
    role: user?.group?.slug?.toUpperCase() as keyof typeof E_ROLE,
    type: E_JWT_TYPE.ACCESS,
  };

  const accessToken = await response.jwtSign(jwt, {
    sub: user.id,
    expiresIn: '24h',
  });

  const refreshToken = await response.jwtSign(
    { sub: user.id, type: E_JWT_TYPE.REFRESH },
    { sub: user.id, expiresIn: '7d' },
  );

  return { accessToken, refreshToken };
};
```

### cookies.util.ts

```typescript
import type { FastifyReply } from 'fastify';
import { Env } from '@start/env';
import type { TokenPair } from './jwt.util';

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

export const setCookieTokens = (response: FastifyReply, tokens: TokenPair): void => {
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
      maxAge: 60 * 60 * 24,       // 24h
    })
    .setCookie('refreshToken', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7,   // 7d
    });
};
```

**Leitura do exemplo:**

1. `createTokens` recebe um subset do usuario (`Pick<IUser, 'id' | 'email' | 'role'>`) e o `FastifyReply` para assinar os tokens via `response.jwtSign()`. Retorna um `TokenPair` com access e refresh tokens.
2. O `accessToken` carrega o payload completo (sub, email, role, type) e expira em 24h. O `refreshToken` carrega apenas sub e type, expirando em 7d.
3. `clearCookieTokens` remove ambos os cookies (`accessToken` e `refreshToken`) com as mesmas opcoes de seguranca usadas na criacao.
4. `setCookieTokens` define ambos os cookies com `httpOnly: true`, `secure` em producao, `sameSite` dinamico e `maxAge` correspondente ao tempo de expiracao de cada token.
5. As opcoes de cookie sao configuradas dinamicamente com base no `Env.NODE_ENV` e `Env.COOKIE_DOMAIN`, garantindo comportamento correto em desenvolvimento e producao.

---

## Regras e Convencoes

1. **Funcoes puras exportadas** -- utils sao `export const` (arrow functions ou functions). Nunca use classes ou `@Service()`. Utils nao participam do container de DI.

2. **Sem estado interno** -- utils nao devem manter estado entre chamadas. Nenhuma variavel de modulo mutavel (ex.: `let counter = 0`). Se precisar de estado, use um service.

3. **Sem acesso direto a repositories** -- utils nao devem importar repositories ou fazer queries ao banco. Se a funcao precisa de dados do banco, ela deve receber esses dados como parametro.

4. **Bem tipadas** -- todas as entradas e saidas devem ter tipos explicitos. Interfaces de entrada/saida sao exportadas no mesmo arquivo quando reutilizaveis (ex.: `TokenPair`).

5. **Side effects controlados** -- a unica excecao a regra de "sem side effects" sao utils que interagem com o objeto `FastifyReply` (cookies, jwt signing). Esses side effects sao aceitos porque estao contidos no ciclo de vida do request.

6. **Um arquivo por dominio** -- agrupe funcoes relacionadas no mesmo arquivo (ex.: todas as funcoes de cookie em `cookies.util.ts`). Nao crie um arquivo por funcao.

7. **Naming convention** -- o arquivo segue o padrao `[dominio].util.ts`. As funcoes exportadas usam camelCase descritivo (ex.: `createTokens`, `setCookieTokens`, `clearCookieTokens`).

8. **Imports entre utils permitidos** -- utils podem importar outros utils (ex.: `cookies.util.ts` importa `TokenPair` de `jwt.util.ts`). Isso e aceitavel desde que nao crie dependencias circulares.

9. **Reutilizaveis** -- utils devem ser genericas o suficiente para serem usadas em diferentes contextos. Evite acoplar um util a um use case especifico.

10. **Testabilidade** -- por serem funcoes puras (ou com side effects controlados), utils sao facilmente testaveis com mocks simples do `FastifyReply`.

---

## Checklist

- [ ] O arquivo esta em `backend/application/utils/[nome].util.ts`.
- [ ] O nome do arquivo segue o padrao `[dominio].util.ts`.
- [ ] Todas as funcoes sao exportadas como `export const`.
- [ ] Nenhuma classe ou decorator `@Service()` esta presente.
- [ ] Nao ha variavel de modulo mutavel (sem estado interno).
- [ ] Nao ha import de repositories ou acesso direto ao banco de dados.
- [ ] Todas as entradas e saidas possuem tipos explicitos.
- [ ] Interfaces reutilizaveis sao exportadas no mesmo arquivo.
- [ ] Side effects estao restritos a interacoes com `FastifyReply` (cookies, jwt).
- [ ] Nao ha dependencia circular entre utils.

---

## Erros Comuns

| Erro | Causa | Correcao |
|------|-------|----------|
| `@Service()` em um util | Util foi tratado como service com DI | Remover o decorator e usar `export const` -- utils nao participam do container de DI |
| Classe ao inves de funcao | Util criado como classe com estado interno | Converter para funcoes puras exportadas. Se precisa de estado, deve ser um service (ver `012-skill-service.md`) |
| Import de repository dentro do util | Util acessando banco de dados diretamente | Receber os dados necessarios como parametro da funcao |
| `let` no escopo do modulo | Variavel mutavel criando estado compartilhado entre chamadas | Usar `const` ou mover o estado para um service |
| Funcao acoplada a um unico use case | Util muito especifico que so serve para um contexto | Generalizar a funcao ou mover a logica para dentro do proprio use case |
| Cookie sem `httpOnly: true` | Token acessivel via JavaScript no browser, vulneravel a XSS | Sempre configurar `httpOnly: true` nas opcoes de cookie |
| Cookie sem `secure` em producao | Token trafega sem HTTPS em producao | Configurar `secure: Env.NODE_ENV === 'production'` dinamicamente |
| `sameSite: 'none'` sem `secure: true` | Browsers modernos rejeitam cookies `SameSite=None` sem flag Secure | Garantir que `sameSite: 'none'` so e usado quando `secure: true` (producao) |
| Tipo de retorno implicito | Funcao sem tipo de retorno explicito, perdendo type safety | Sempre declarar o tipo de retorno: `): Promise<TokenPair>` ou `): void` |

---

**Cross-references:** ver [007-skill-middleware.md](./007-skill-middleware.md) para middlewares que consomem jwt e cookies utils, [014-skill-kernel.md](./014-skill-kernel.md) para a configuracao do plugin JWT e Cookie no kernel.
