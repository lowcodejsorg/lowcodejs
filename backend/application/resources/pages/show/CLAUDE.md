# Show Page

Exibe uma pagina HTML pelo slug.

## Endpoint
`GET /pages/:slug` | Auth: Yes | Permission: nenhuma especifica

## Fluxo
1. Middleware: AuthenticationMiddleware (obrigatorio)
2. Validator: PageShowParamsValidator - campos: slug (string, required, min 1)
3. UseCase:
   - Busca menu pelo slug com trashed=false (exact match)
   - Retorna o documento menu completo (incluindo html)
4. Repository: MenuContractRepository (findBy)

## Regras de Negocio
- Somente menus nao-trashed sao retornados
- Retorna o documento IMenu completo (nome, slug, html, type, etc.)

## Erros Possiveis
| Code | Cause | Quando |
|------|-------|--------|
| 404 | PAGE_NOT_FOUND | Menu com o slug nao existe ou esta na lixeira |
| 500 | GET_MENU_ERROR | Erro interno |

## Testes
- Unit: `show.use-case.spec.ts`
- E2E: `show.controller.spec.ts`
