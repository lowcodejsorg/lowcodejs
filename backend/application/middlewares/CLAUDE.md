# Middlewares

Middlewares Fastify aplicados via decorator `onRequest` nos controllers.

## `authentication.middleware.ts`

Extrai e valida JWT do request:
1. Tenta extrair token de cookie `accessToken` ou header `Authorization: Bearer`
2. Verifica tipo do token (deve ser ACCESS, nao REFRESH)
3. Popula `request.user` com payload decodificado (`IJWTPayload`)
4. Parametro `optional`: se true, permite request sem token (user = undefined)

**Uso:**
```typescript
onRequest: [AuthenticationMiddleware({ optional: false })]
```

## `table-access.middleware.ts`

Verifica permissoes de acesso a tabela (RBAC + visibilidade):
1. Busca tabela por slug (params)
2. Popula `request.table` com dados da tabela
3. Determina `request.ownership` (se usuario e owner/admin)
4. Verifica permissoes baseado em:
   - Role do usuario (MASTER bypassa tudo, ADMINISTRATOR tem acesso total)
   - Ownership da tabela
   - Visibilidade da tabela (PUBLIC, FORM, OPEN, RESTRICTED, PRIVATE)
   - Permission requerida pelo endpoint

**Parametro `requiredPermission`:** string do `E_TABLE_PERMISSION`

**Excecoes de acesso para visitantes:**
- Tabelas PUBLIC: GET view sem auth
- Tabelas FORM: POST create sem auth

**Uso:**
```typescript
onRequest: [
  AuthenticationMiddleware({ optional: true }),
  TableAccessMiddleware({ requiredPermission: E_TABLE_PERMISSION.VIEW_ROW })
]
```
