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

## `permission.middleware.ts`

`PermissionMiddleware(capability)` - guarda das **areas do sistema** (Usuarios,
Menu, Grupos, Configuracoes, Ferramentas, Plugins). Substitui o RoleMiddleware:
em vez de exigir um role fixo, exige uma **capacidade de area**
(`E_AREA_CAPABILITY`) atribuivel a qualquer grupo.

1. Exige usuario autenticado
2. MASTER bypassa
3. Resolve as capacidades do usuario pelo **fecho de grupos** (grupo principal +
   adicionais + englobados via `encompasses[]`) com o `GroupResolverContractService`
4. Lanca Forbidden se a capacidade nao estiver presente

**Uso:**
```typescript
onRequest: [
  AuthenticationMiddleware({ optional: false }),
  PermissionMiddleware(E_AREA_CAPABILITY.MANAGE_USERS)
]
```

## `table-access.middleware.ts`

Verifica acesso a tabela. Faz parsing do request e delega ao
`PermissionContractService`:
1. Busca tabela por slug (params) e popula `request.table`
2. Busca usuario autenticado
3. Verifica acesso publico (visitante sem auth) via `isPublicAccess`
4. Verificacao completa via `checkTableAccess`, baseada em:
   - Role do usuario (MASTER bypassa tudo, ADMINISTRATOR tem acesso total)
   - Dono da tabela (`table.owner` ou membro com perfil OWNER)
   - Perfil de membro (`table.members` + `TABLE_PROFILE_MATRIX`) + binding por
     acao (`table.permissions`, PUBLIC/NOBODY/GROUP). Nao ha fallback legado.
5. Popula `request.ownership` (inclui `ownOnly` quando o perfil so permite as
   proprias rows — ex: contributor)

**Parametro `requiredPermission`:** string do `E_TABLE_PERMISSION`

**Excecoes de acesso para visitantes:**
- Acao com binding PUBLIC

**Uso:**
```typescript
onRequest: [
  AuthenticationMiddleware({ optional: true }),
  TableAccessMiddleware({ requiredPermission: E_TABLE_PERMISSION.VIEW_ROW })
]
```
