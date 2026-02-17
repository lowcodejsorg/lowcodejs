# Recurso: Pages

O recurso **Pages** permite visualizar paginas de conteudo HTML. As paginas sao armazenadas como itens de menu do tipo `PAGE` no modelo `Menu`, e este recurso serve como um atalho para acessar o conteudo pelo slug.

---

## Endpoints

| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| GET | `/pages/:slug` | Sim | Exibir conteudo da pagina |

---

## Arquitetura

```
resources/pages/
  show/    # GET /pages/:slug
```

Este e um recurso simples com apenas um endpoint. A logica reside no `PageShowUseCase`, que busca o item de menu pelo slug e retorna seus dados, incluindo o campo `html`.

---

## Exibir Pagina

**`GET /pages/:slug`**

### Parametros

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `slug` | string | Slug da pagina (corresponde ao slug do item de menu) |

### Resposta de Sucesso (200)

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Sobre Nos",
  "slug": "sobre-nos",
  "type": "PAGE",
  "url": "/pages/sobre-nos",
  "html": "<h1>Sobre Nos</h1><p>Conteudo da pagina...</p>",
  "table": null,
  "parent": null,
  "trashed": false,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

O campo `html` contem o conteudo HTML da pagina, que pode ser renderizado diretamente no frontend.

### Codigos de Erro

| Codigo | Cause | Descricao |
|--------|-------|-----------|
| 404 | PAGE_NOT_FOUND | Pagina nao encontrada (nenhum item de menu com este slug) |
| 500 | GET_MENU_ERROR | Erro interno |

---

## Implementacao

### Controller

O controller utiliza `AuthenticationMiddleware` com `optional: false`, ou seja, autenticacao e obrigatoria para visualizar paginas.

```typescript
@GET({
  url: '/:slug',
  options: {
    onRequest: [
      AuthenticationMiddleware({ optional: false }),
    ],
    schema: PageShowSchema,
  },
})
```

### Use Case

O `PageShowUseCase` utiliza o `MenuContractRepository` para buscar o item de menu pelo slug:

```typescript
type Response = Either<HTTPException, IMenu>;

async execute(payload: Payload): Promise<Response> {
  const menu = await this.menuRepository.findBy({
    slug: payload.slug,
    exact: true,
  });

  if (!menu)
    return left(HTTPException.NotFound('Page not found', 'PAGE_NOT_FOUND'));

  return right(menu);
}
```

---

## Relacao com o Recurso Menu

As paginas sao criadas e gerenciadas atraves do recurso [Menu](./resources-menu.md). Para criar uma nova pagina:

1. Crie um item de menu com `type: "PAGE"` e `html: "<conteudo>"` via `POST /menu`
2. O sistema gera automaticamente a URL `/pages/{slug}`
3. A pagina fica acessivel via `GET /pages/{slug}`

A edicao do conteudo HTML e feita via `PATCH /menu/:_id` atualizando o campo `html`.
