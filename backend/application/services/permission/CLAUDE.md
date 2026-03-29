# Permission Service

Servico de logica de permissoes e controle de acesso (RBAC + visibilidade de tabela).

## Arquivos

| Arquivo | Descricao |
|---------|-----------|
| `permission-contract.service.ts` | Classe abstrata com tipos AccessCheckResult e AccessCheckInput |
| `permission.service.ts` | Implementacao com queries diretas ao UserModel |

## Metodos

| Metodo | Retorno | Descricao |
|--------|---------|-----------|
| `checkUserHasPermission(userId, permission)` | `void` | Verifica se o grupo do usuario possui a permissao; lanca Forbidden se nao |
| `checkUserIsActive(userId)` | `void` | Verifica se usuario esta ativo; lanca Forbidden se inativo |
| `isPublicAccess(input)` | `boolean` | Checa se a acao e publica (PUBLIC + GET view, ou FORM + POST CREATE_ROW) |
| `checkTableAccess(input)` | `AccessCheckResult` | Verificacao completa de acesso a tabela |

## Tipos

- `AccessCheckInput` - table, userId, userRole, requiredPermission (E_TABLE_PERMISSION), httpMethod
- `AccessCheckResult` - allowed (boolean), ownership (isOwner, isAdministrator)

## Logica de checkTableAccess

1. MASTER - acesso total (sem verificacao adicional)
2. ADMINISTRATOR - acesso total (verifica apenas se esta ativo)
3. CREATE_TABLE - apenas verifica permissao no grupo
4. Owner/Admin da tabela - acesso total (verifica se ativo)
5. Demais usuarios - aplica regras de visibilidade + verifica permissao no grupo

## Regras de Visibilidade

| Visibilidade | Restricao |
|-------------|-----------|
| PRIVATE | Bloqueia todos (exceto owner/admin) |
| RESTRICTED | Bloqueia CREATE_ROW |
| FORM | Bloqueia VIEW (apenas owner/admin pode visualizar) |
| OPEN / PUBLIC | Sem restricao adicional |

## Comportamentos Unicos

- Nao possui implementacao in-memory (apenas contract + implementacao)
- Acessa UserModel diretamente (com populate de group.permissions)
- Metodo privado `checkVisibilityRules` aplica restricoes por tipo de visibilidade
