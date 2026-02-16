# Declaracoes de Tipos (`_types/`)

O diretorio `_types/` contem arquivos de declaracao TypeScript (`.d.ts`) que estendem tipos de bibliotecas externas utilizadas no projeto. Sao **declaracoes ambientes** (ambient declarations) que ficam disponiveis globalmente em toda a aplicacao sem necessidade de import explicito.

## Estrutura

```
_types/
  fastify.d.ts
  fastify-jwt.d.ts
  fastify-multipart.d.ts
```

## Arquivos

### fastify.d.ts

Estende a interface `FastifyRequest` do Fastify com propriedades customizadas utilizadas pelo sistema:

```typescript
declare module 'fastify' {
  interface FastifyRequest {
    table?: ITable;
    ownership?: {
      isOwner: boolean;
      isAdministrator: boolean;
    };
  }
}
```

- **`table`**: referencia a tabela (modelo dinamico) associada a requisicao atual. Populada por middlewares que identificam a tabela a partir dos parametros da rota.
- **`ownership`**: indica se o usuario autenticado e o dono do recurso (`isOwner`) e/ou se possui privilegios de administrador (`isAdministrator`). Utilizado para controle de acesso em nivel de registro.

### fastify-jwt.d.ts

Estende a interface `FastifyJWT` do plugin `@fastify/jwt` para tipar o payload do token JWT:

```typescript
declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: IJWTPayload;
  }
}
```

A interface `IJWTPayload` contem os seguintes campos:

| Campo   | Descricao                                        |
|---------|--------------------------------------------------|
| `sub`   | ID do usuario (subject)                          |
| `email` | Endereco de e-mail do usuario                    |
| `role`  | Papel/funcao do usuario no sistema               |
| `type`  | Tipo do token (ex: access, refresh)              |

Com essa extensao, `request.user` possui tipagem completa em toda a aplicacao.

### fastify-multipart.d.ts

Estende a interface `MultipartFile` do plugin `@fastify/multipart`:

```typescript
declare module '@fastify/multipart' {
  interface MultipartFile {
    value: Record<string, string | number>;
  }
}
```

- **`value`**: campo adicional que armazena valores de campos nao-arquivo enviados junto ao multipart form. Permite acessar campos de texto e numericos que acompanham o upload de arquivos.

## Uso

Por serem declaracoes ambientes, esses tipos sao reconhecidos automaticamente pelo compilador TypeScript em todo o projeto. Basta que o diretorio `_types/` esteja incluido no `tsconfig.json` (via `include` ou `typeRoots`).

Nao e necessario importar nada — as extensoes ficam disponiveis diretamente ao acessar `request.table`, `request.user`, `request.ownership`, etc.
