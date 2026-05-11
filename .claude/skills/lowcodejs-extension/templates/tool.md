# Template: TOOL

Use quando o usuário quer uma utilidade administrativa acessível via menu
Ferramentas (clone, import, export em massa, mesclar, etc.). Acessível em
`/tools/<pkg>/<id>`.

## 1. `backend/extensions/<pkg>/tools/<id>/manifest.json`

```json
{
  "id": "<id>",
  "type": "TOOL",
  "name": "<Nome humano>",
  "description": "<O que faz>",
  "version": "1.0.0",
  "author": "<seu nome ou time>",
  "icon": "<NomeLucideIcon>",
  "tool": {
    "submenu": "<grupo opcional>"
  },
  "permissions": {
    "view": ["MASTER"]
  },
  "requires": {
    "lowcodejs": ">=1.0.0"
  }
}
```

Tools tipicamente são restritas a MASTER. Ajuste `permissions.view` conforme
o caso.

## 2. `frontend/extensions/<pkg>/tools/<id>/index.tsx`

```tsx
import React from 'react';

import { AccessDenied } from '@/components/common/route-status/access-denied';
import { PageHeader, PageShell } from '@/components/common/page-shell';
// ... outros componentes UI
import { usePermission } from '@/hooks/use-table-permission';

export default function MyTool(): React.JSX.Element {
  const permission = usePermission();

  if (!permission.can('CREATE_TABLE')) {
    return <AccessDenied />;
  }

  return (
    <PageShell data-test-id="tool-<id>">
      <PageShell.Header>
        <PageHeader title="<Título>" />
      </PageShell.Header>

      <PageShell.Content className="p-4">
        {/* Form / interface da tool */}
      </PageShell.Content>
    </PageShell>
  );
}
```

## 3. Backend (geralmente necessário)

Tools quase sempre têm endpoint custom. Padrão completo:

### `controller.ts`

```ts
/* eslint-disable no-unused-vars */
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, POST } from 'fastify-decorators';

import { E_EXTENSION_TYPE } from '@application/core/entity.core';
import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';
import { ExtensionActiveMiddleware } from '@application/middlewares/extension-active.middleware';

import { MyToolSchema } from './my-tool.schema';
import MyToolUseCase from './my-tool.use-case';
import { MyToolValidator } from './my-tool.validator';

@Controller({
  route: '/tools',
})
export default class {
  constructor(
    private readonly useCase: MyToolUseCase = getInstanceByToken(MyToolUseCase),
  ) {}

  @POST({
    url: '/<id>',
    options: {
      onRequest: [
        AuthenticationMiddleware({ optional: false }),
        ExtensionActiveMiddleware({
          pkg: '<pkg>',
          type: E_EXTENSION_TYPE.TOOL,
          extensionId: '<id>',
        }),
      ],
      schema: MyToolSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const body = MyToolValidator.parse(request.body);

    const result = await this.useCase.execute({
      ...body,
      ownerId: request.user.sub,
    });

    if (result.isLeft()) {
      const error = result.value;
      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
        ...(error.errors && { errors: error.errors }),
      });
    }

    return response.status(200).send(result.value);
  }
}
```

### `use-case.ts`

```ts
/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';

interface Input {
  ownerId: string;
  // ... outros campos
}

interface Output {
  // ... resultado
}

type Response = Either<HTTPException, Output>;

@Service()
export default class MyToolUseCase {
  // injeções de repositórios via constructor

  async execute(input: Input): Promise<Response> {
    try {
      // lógica
      return right({ /* ... */ });
    } catch (error) {
      console.error('[<pkg>/<id>][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro ao executar a ferramenta',
          'MY_TOOL_ERROR',
        ),
      );
    }
  }
}
```

### `validator.ts` e `schema.ts`

Padrão Zod + Fastify schema. Veja
`backend/extensions/core/tools/clone-table/clone-table.{validator,schema}.ts`
como referência.

## 4. CLAUDE.md do pacote

Atualize `backend/extensions/<pkg>/CLAUDE.md` adicionando linha na tabela
"Tools":

```markdown
| `<id>` | `POST /tools/<id>` | <descrição> |
```

## 5. Smoke test

1. Restart backend → log mostra a tool carregada
2. `/extensions` (MASTER) → ativar (se `pkg !== 'core'`)
3. Sidebar Ferramentas: a tool deve aparecer como sub-item collapsible
4. Clicar → vai para `/tools/<pkg>/<id>` → entry renderiza
5. Testar a action POST/PATCH no endpoint
6. Desativar em `/extensions` → endpoint retorna 404 com `EXTENSION_NOT_ACTIVE`
