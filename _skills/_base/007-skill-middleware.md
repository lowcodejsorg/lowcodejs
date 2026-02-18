# Skill: Middleware

O Middleware e uma funcao factory que intercepta requests antes de chegarem ao handler do controller. Ele e responsavel por executar logica transversal como autenticacao, autorizacao e validacao de tokens, isolando essas preocupacoes da logica de negocio. Middlewares seguem o padrao factory function, retornando um async handler que recebe o `FastifyRequest` e pode modificar o estado do request ou interromper o fluxo com uma excecao.

---

## Estrutura do Arquivo

O arquivo de middleware deve estar localizado em:

```
backend/application/middlewares/[name].middleware.ts
```

Onde `[name]` descreve a funcionalidade do middleware (ex: `authentication`, `permissions`, `rate-limit`).

Os dois middlewares principais do projeto sao:
- **`AuthenticationMiddleware`** (`authentication.middleware.ts`) -- verifica se o usuario esta autenticado via JWT cookie.
- **`PermissionMiddleware`** (`permissions.middleware.ts`) -- verifica se o usuario tem a role necessaria para acessar o recurso.

Componentes tipicos de um middleware:

- **Interface de opcoes** - define configuracoes do middleware (ex: `AuthOptions`)
- **Funcoes auxiliares** - helpers internos para extrair e processar dados (ex: `extractLastCookieValue`)
- **Factory function** - funcao principal exportada que recebe opcoes e retorna o handler
- **Async handler** - funcao retornada que processa o request

## Template

```typescript
import { type FastifyRequest } from 'fastify';
import HTTPException from '@application/core/exception';

interface <Name>Options {
  optional?: boolean;
  // outras opcoes especificas
}

export function <Name>Middleware(options: <Name>Options = { optional: false }) {
  return async function (request: FastifyRequest): Promise<void> {
    try {
      // 1. Extrair dados do request (cookies, headers, etc.)
      const token = request.cookies.<tokenName> ?? request.headers.<headerName>;

      // 2. Verificar presenca do dado
      if (!token) {
        if (options.optional) return;
        throw HTTPException.Unauthorized('<Mensagem de erro>', '<CAUSE_CODE>');
      }

      // 3. Validar/decodificar o dado
      const decoded = await request.server.<service>.decode(String(token));

      // 4. Verificar validade
      if (!decoded || !isValid(decoded)) {
        if (options.optional) return;
        throw HTTPException.Unauthorized('<Mensagem de erro>', '<CAUSE_CODE>');
      }

      // 5. Enriquecer o request com dados processados
      request.<property> = {
        // dados extraidos do token/header
      };
    } catch (error) {
      // 6. Tratar erro respeitando optional
      if (options.optional) return;
      throw HTTPException.Unauthorized('<Mensagem de erro>', '<CAUSE_CODE>');
    }
  };
}
```

## Exemplo Real

```typescript
import { type FastifyRequest } from 'fastify';
import { E_JWT_TYPE, type IJWTPayload } from '@application/core/entities';
import HTTPException from '@application/core/exception';

interface AuthOptions {
  optional?: boolean;
}

function extractLastCookieValue(
  cookieHeader: string | undefined,
  name: string,
): string | undefined {
  if (!cookieHeader) return undefined;
  let lastValue: string | undefined;
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) {
      lastValue = rest.join('=');
    }
  }
  return lastValue;
}

export function AuthenticationMiddleware(
  options: AuthOptions = { optional: false },
) {
  return async function (request: FastifyRequest): Promise<void> {
    try {
      const accessToken =
        extractLastCookieValue(request.headers.cookie, 'accessToken') ??
        request.cookies.accessToken;

      if (!accessToken) {
        if (options.optional) return;
        throw HTTPException.Unauthorized(
          'Authentication required',
          'AUTHENTICATION_REQUIRED',
        );
      }

      const decoded: IJWTPayload | null = await request.server.jwt.decode(
        String(accessToken),
      );

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

Neste exemplo, o `AuthenticationMiddleware`:

1. Define uma interface `AuthOptions` com a flag `optional` para controlar se a autenticacao e obrigatoria.
2. Usa a funcao auxiliar `extractLastCookieValue` para extrair o token do header de cookie bruto, com fallback para `request.cookies.accessToken`.
3. Verifica a presenca do `accessToken` - se ausente e nao opcional, lanca excecao.
4. Decodifica o JWT usando `request.server.jwt.decode` e valida que o tipo e `ACCESS`.
5. Enriquece `request.user` com os dados do token decodificado (`sub`, `email`, `role`, `type`).
6. Em todos os pontos de falha, verifica `options.optional` antes de lancar excecao, permitindo que rotas parcialmente protegidas continuem sem usuario autenticado.

## Regras e Convencoes

1. **Padrao factory function.** O middleware deve ser uma funcao que recebe opcoes e retorna um async handler. Nunca exporte diretamente o handler - sempre envolva em uma factory para permitir configuracao.

2. **A flag `optional` controla o comportamento em caso de falha.** Quando `optional: true`, o middleware deve retornar silenciosamente (`return`) em vez de lancar excecao. Isso permite que o controller funcione com ou sem o dado do middleware (ex: rotas acessiveis tanto autenticado quanto anonimo).

3. **Extraia dados do request de forma defensiva.** Cookies podem vir de `request.cookies` (parseado pelo Fastify) ou do header bruto `request.headers.cookie`. Headers customizados devem ser acessados via `request.headers`. Sempre trate o caso de dados ausentes.

4. **Valide os dados extraidos completamente.** Apos extrair um token, verifique: presenca (`!token`), decodificacao bem-sucedida (`!decoded`), e tipo/formato correto (ex: `decoded.type !== E_JWT_TYPE.ACCESS`).

5. **Enriqueça o request com dados processados.** Use `request.user`, `request.tenant` ou propriedades customizadas para passar dados do middleware para o controller. Isso evita que o controller precise repetir a logica de extracao.

6. **Use exclusivamente `HTTPException` para lancar erros.** O middleware e o unico lugar (alem do use case) onde `throw` e permitido. Sempre use os metodos estaticos de `HTTPException` (`.Unauthorized()`, `.Forbidden()`, etc.) para manter consistencia nas respostas de erro.

7. **Trate excecoes no catch respeitando `optional`.** O bloco `catch` deve verificar `options.optional` antes de re-lancar. Isso garante que erros inesperados na decodificacao (token malformado, por exemplo) nao quebrem rotas opcionais.

8. **Funcoes auxiliares devem ser internas ao arquivo.** Helpers como `extractLastCookieValue` nao devem ser exportados. Eles sao detalhes de implementacao do middleware especifico.

9. **O middleware e registrado no controller via `onRequest`.** A integracao com o controller acontece no array `onRequest` do decorator de rota:
   ```typescript
   onRequest: [AuthenticationMiddleware({ optional: false })]
   ```

10. **Nomeie a factory function de forma descritiva.** Use o padrao `<Funcionalidade>Middleware` (ex: `AuthenticationMiddleware`, `AuthorizationMiddleware`, `RateLimitMiddleware`).

## Checklist

- [ ] Arquivo localizado em `backend/application/middlewares/[name].middleware.ts`
- [ ] Padrao factory function implementado (funcao que retorna async handler)
- [ ] Interface de opcoes definida com flag `optional`
- [ ] Handler retornado e `async` e recebe `FastifyRequest`
- [ ] Retorno tipado como `Promise<void>`
- [ ] Dados extraidos do request de forma defensiva (com fallback)
- [ ] Presenca dos dados verificada antes de processamento
- [ ] Validacao completa dos dados extraidos (presenca, decodificacao, tipo)
- [ ] `request.user` (ou propriedade adequada) populado com dados processados
- [ ] `HTTPException` usado para todos os erros lancados
- [ ] Flag `optional` verificada em todos os pontos de falha
- [ ] Bloco `catch` presente tratando erros inesperados
- [ ] Return silencioso quando `optional: true` e ha falha
- [ ] Funcoes auxiliares nao exportadas (internas ao arquivo)
- [ ] Factory function nomeada no padrao `<Funcionalidade>Middleware`

## Erros Comuns

1. **Exportar o handler diretamente ao inves de usar factory function.** Sem a factory, nao e possivel configurar opcoes como `optional`. O middleware perde flexibilidade e nao pode ser reutilizado com comportamentos diferentes.

2. **Esquecer de tratar o caso `optional`.** Se a flag `optional` nao for verificada em todos os pontos de falha (token ausente, decodificacao invalida, catch), rotas que deveriam funcionar sem autenticacao vao retornar 401 inesperadamente.

3. **Lancar erros genericos ao inves de `HTTPException`.** Usar `throw new Error()` ou `throw 'message'` quebra o padrao de tratamento de erros da aplicacao. Sempre use `HTTPException.Unauthorized()`, `HTTPException.Forbidden()`, etc.

4. **Nao tratar o bloco `catch`.** Tokens malformados, erros de decodificacao ou falhas de servico podem lancar excecoes inesperadas. Sem o `catch`, essas excecoes propagam sem o tratamento correto de `optional`.

5. **Acessar cookies apenas via `request.cookies`.** Em alguns cenarios (proxies, configuracoes de CORS), o cookie pode nao ser parseado corretamente pelo Fastify. Sempre implemente fallback para o header bruto `request.headers.cookie`.

6. **Nao validar o tipo do token.** Verificar apenas a presenca do token nao e suficiente. Um refresh token nao deve ser aceito onde um access token e esperado. Sempre valide o campo `type` do payload decodificado.

7. **Modificar o request de forma inconsistente.** Se o middleware seta `request.user` no caminho de sucesso, ele deve garantir que `request.user` nao fique em estado indefinido no caminho `optional`. Controllers que dependem de `request.user` devem poder verificar sua existencia de forma confiavel.

8. **Colocar logica de negocio no middleware.** O middleware deve lidar apenas com preocupacoes transversais (autenticacao, autorizacao, rate limiting). Regras de dominio pertencem ao use case.

---

> **Ver tambem:** [002-skill-controller.md](./002-skill-controller.md) | [013-skill-utils.md](./013-skill-utils.md)
