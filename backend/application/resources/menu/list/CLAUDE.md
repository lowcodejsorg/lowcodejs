# List Menu

Lista todos os menus ativos (nao-trashed), ordenados por order e name.

## Endpoint
`GET /menu` | Auth: Yes | Permission: nenhuma especifica

## Fluxo
1. Middleware: AuthenticationMiddleware (obrigatorio)
2. Validator: nenhum (sem parametros)
3. UseCase:
   - Busca todos os menus via menuRepository.findMany com trashed: false
   - Ordena por order asc, name asc
   - Retorna array de menus
4. Repository: MenuContractRepository (findMany)

## Regras de Negocio
- Retorna apenas menus nao-trashed
- Ordenacao padrao: order asc, name asc
- Retorna lista plana (nao hierarquica)

## Erros Possiveis
| Code | Cause | Quando |
|------|-------|--------|
| 500 | LIST_MENU_ERROR | Erro interno |

## Testes
- Unit: `list.use-case.spec.ts`
- E2E: `list.controller.spec.ts`
