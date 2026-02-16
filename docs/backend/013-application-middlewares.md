# Middlewares

O diretorio `middlewares/` contem dois middlewares Fastify que controlam autenticacao e autorizacao de acesso a tabelas.

---

## authentication.middleware.ts

Middleware de autenticacao via JWT em cookies HTTP. Extrai e valida o `accessToken` presente nos cookies da requisicao.

### Assinatura

```typescript
export function AuthenticationMiddleware(
  options: AuthOptions = { optional: false },
): (request: FastifyRequest) => Promise<void>
```

### Interface de Opcoes

```typescript
interface AuthOptions {
  optional?: boolean;
}
```

### Fluxo de Execucao

1. **Extrai o accessToken** dos cookies da requisicao. Utiliza uma funcao auxiliar `extractLastCookieValue` para lidar com cookies duplicados (quando o header `cookie` contem multiplas entradas com o mesmo nome, a ultima e utilizada):

```typescript
function extractLastCookieValue(cookieHeader: string | undefined, name: string): string | undefined {
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
```

2. **Fallback**: Se nao encontrado via parsing manual, tenta `request.cookies.accessToken` (plugin Fastify).

3. **Sem token**: Se nao ha token e o modo e `optional`, retorna sem erro (`request.user` fica `undefined`). Caso contrario, lanca `HTTPException.Unauthorized`.

4. **Decodifica o JWT** usando `request.server.jwt.decode()` e valida que o tipo e `ACCESS`.

5. **Define `request.user`** com os dados do payload JWT:

```typescript
request.user = {
  sub: accessTokenDecoded.sub,       // ID do usuario
  email: accessTokenDecoded.email,   // Email
  role: accessTokenDecoded.role,     // Role (MASTER, ADMINISTRATOR, etc.)
  type: E_JWT_TYPE.ACCESS,           // Tipo do token
};
```

### Modo Opcional

Quando `optional: true`, o middleware nunca lanca excecao. Se o token for invalido ou ausente, `request.user` permanece `undefined`. Util para endpoints que funcionam tanto para visitantes quanto para usuarios autenticados.

### Exemplo de Uso

```typescript
// Autenticacao obrigatoria
@Hook('onRequest')
authHook = AuthenticationMiddleware();

// Autenticacao opcional (visitantes permitidos)
@Hook('onRequest')
authHook = AuthenticationMiddleware({ optional: true });
```

---

## table-access.middleware.ts

Middleware de controle de acesso a tabelas. Implementa logica complexa de permissoes com base no papel do usuario, propriedade da tabela e niveis de visibilidade.

### Assinatura

```typescript
export function TableAccessMiddleware(
  options: AccessOptions,
): (request: FastifyRequest) => Promise<void>
```

### Interface de Opcoes

```typescript
interface AccessOptions {
  requiredPermission: ValueOf<typeof E_TABLE_PERMISSION>;
}
```

### Fluxo de Decisao Completo

O middleware segue uma cascata de verificacoes, onde a primeira condicao satisfeita encerra a execucao:

#### 1. Validacao do parametro `slug`

Valida o parametro de rota usando Zod. Lanca `HTTPException.BadRequest` se invalido.

```typescript
const ParamsSchema = z.object({
  slug: z.string().trim().min(1).optional(),
});
```

#### 2. Busca da tabela

Se ha `slug` e a permissao nao e `CREATE_TABLE`, busca a tabela por slug no banco. Cacheia o resultado em `request.table` para evitar consultas repetidas.

```typescript
table = await TableModel.findOne({ slug }).lean();
if (!table) throw HTTPException.NotFound('Table not found', 'TABLE_NOT_FOUND');
request.table = table;
```

#### 3. Excecao PUBLIC + GET VIEW_*

Tabelas com visibilidade `PUBLIC` permitem que **visitantes nao autenticados** executem operacoes de leitura (`VIEW_TABLE`, `VIEW_FIELD`, `VIEW_ROW`) via metodo GET.

```typescript
if (table.visibility === E_TABLE_VISIBILITY.PUBLIC &&
    request.method === 'GET' &&
    ['VIEW_TABLE', 'VIEW_FIELD', 'VIEW_ROW'].includes(requiredPermission)) {
  return; // Acesso liberado
}
```

#### 4. Excecao FORM + POST CREATE_ROW

Tabelas com visibilidade `FORM` permitem que **visitantes nao autenticados** criem registros via POST.

```typescript
if (table.visibility === E_TABLE_VISIBILITY.FORM &&
    request.method === 'POST' &&
    requiredPermission === 'CREATE_ROW') {
  return; // Acesso liberado
}
```

#### 5. Sem usuario autenticado

Se nao ha `request.user`, lanca `HTTPException.Unauthorized`.

#### 6. MASTER

Usuarios com role `MASTER` tem **acesso total** a tudo, sem restricoes.

#### 7. ADMINISTRATOR

Usuarios com role `ADMINISTRATOR` tem **acesso total a todas as tabelas**, desde que estejam com status `ACTIVE`.

#### 8. CREATE_TABLE

Para criacao de tabelas, verifica apenas a permissao do grupo do usuario (nao depende de tabela especifica).

#### 9. Dono ou Admin da tabela

Verifica se o usuario e dono (`owner`) ou administrador da tabela (`administrators[]`). Se sim, armazena em `request.ownership` e concede acesso total (desde que o usuario esteja ativo).

```typescript
const isOwner = user.sub === table.owner?.toString();
const isTableAdmin = table.administrators?.some(a => a?.toString() === user.sub);
request.ownership = { isOwner, isAdministrator: isTableAdmin };
```

#### 10. Acoes exclusivas do dono/admin

As seguintes acoes sao bloqueadas para nao-donos, independente da visibilidade:

- `CREATE_FIELD`, `UPDATE_FIELD`, `REMOVE_FIELD`
- `UPDATE_TABLE`, `REMOVE_TABLE`
- `UPDATE_ROW`, `REMOVE_ROW`

```typescript
const ownerOnlyActions = [
  E_TABLE_PERMISSION.CREATE_FIELD,
  E_TABLE_PERMISSION.UPDATE_FIELD,
  E_TABLE_PERMISSION.REMOVE_FIELD,
  E_TABLE_PERMISSION.UPDATE_TABLE,
  E_TABLE_PERMISSION.REMOVE_TABLE,
  E_TABLE_PERMISSION.UPDATE_ROW,
  E_TABLE_PERMISSION.REMOVE_ROW,
];
```

#### 11. Regras por visibilidade

Para usuarios autenticados que nao sao donos/admin:

| Visibilidade | VIEW_* | CREATE_ROW | UPDATE/REMOVE_ROW |
|---|---|---|---|
| **PRIVATE** | Bloqueado | Bloqueado | Bloqueado |
| **RESTRICTED** | Permitido | Bloqueado | Bloqueado |
| **OPEN** | Permitido | Permitido | Bloqueado |
| **PUBLIC** | Permitido | Permitido | Bloqueado |
| **FORM** | Bloqueado | Permitido | Bloqueado |

#### 12. Verificacao final de permissao do grupo

Apos todas as regras de visibilidade, o middleware verifica se o usuario possui a permissao necessaria no seu grupo via `checkUserHasPermission()`.

### Funcao Auxiliar checkUserHasPermission

```typescript
async function checkUserHasPermission(
  userId: string,
  permission: ValueOf<typeof E_TABLE_PERMISSION>,
): Promise<void> {
  const user = await UserModel.findOne({ _id: userId })
    .populate({ path: 'group', populate: { path: 'permissions' } })
    .lean();

  if (!user) throw HTTPException.Forbidden('User not found');
  if (user.status !== E_USER_STATUS.ACTIVE) throw HTTPException.Forbidden('User is not active');

  const hasPermission = group.permissions.some(p => p.slug === permissionSlug);
  if (!hasPermission) throw HTTPException.Forbidden(`Permission denied. Required: ${permission}`);
}
```

### Exemplo de Uso

```typescript
// Exige permissao VIEW_ROW
@Hook('onRequest')
tableAccessHook = TableAccessMiddleware({
  requiredPermission: E_TABLE_PERMISSION.VIEW_ROW,
});

// Exige permissao CREATE_TABLE
@Hook('onRequest')
tableAccessHook = TableAccessMiddleware({
  requiredPermission: E_TABLE_PERMISSION.CREATE_TABLE,
});
```
