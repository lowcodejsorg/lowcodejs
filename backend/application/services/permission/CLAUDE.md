# Permission Service

Servico de logica de permissoes e controle de acesso a tabelas. Avalia
exclusivamente o modelo novo: bindings por acao (`table.permissions`) + perfis
de membro (`table.members`) + `table.owner`. Nao ha fallback legado — os campos
`visibility`/`collaboration`/`administrators` foram removidos e o servico nao tem
mais `checkLegacyAccess`/regras de visibilidade.

## Arquivos

| Arquivo | Descricao |
|---------|-----------|
| `permission-contract.service.ts` | Classe abstrata com tipos AccessCheckResult e AccessCheckInput |
| `permission.service.ts` | Implementacao; delega resolucao de grupos ao `GroupResolverContractService` |

## Metodos

| Metodo | Retorno | Descricao |
|--------|---------|-----------|
| `checkUserHasPermission(user, permission)` | `void` | Verifica se as capacidades do **fecho de grupos** do usuario contem a permissao; lanca Forbidden se nao |
| `checkUserIsActive(user)` | `void` | Verifica se usuario esta ativo; lanca Forbidden se inativo |
| `isPublicAccess(input)` | `boolean` | Acao publica quando o binding da acao aponta para PUBLIC |
| `checkTableAccess(input)` | `AccessCheckResult` | Verificacao completa de acesso a tabela |

## Tipos

- `AccessCheckInput` - table, userId, userRole, user, requiredPermission (E_TABLE_PERMISSION), httpMethod
- `AccessCheckResult` - allowed (boolean), ownership (isOwner, isAdministrator, ownOnly?)

## Logica de checkTableAccess

1. MASTER - acesso total (sem verificacao adicional)
2. ADMINISTRATOR - acesso total (verifica apenas se esta ativo)
3. CREATE_TABLE - apenas verifica capacidade no fecho de grupos
4. Dono da tabela (`table.owner` **ou** membro com perfil OWNER) - acesso total
5. Avalia, nesta ordem:
   - perfil de membro via `TABLE_PROFILE_MATRIX[profile][acao]` → ALLOW libera, OWN libera apenas as proprias rows (`ownership.ownOnly`), DENY segue
   - binding da acao (`bindingAllows`): PUBLIC libera todos; GROUP libera se o grupo estiver no fecho do usuario; NOBODY nega

## Perfis de membro (`TABLE_PROFILE_MATRIX`)

Perfis fixos (`E_TABLE_PROFILE`): owner, admin, editor, contributor, viewer.
`contributor` recebe OWN em update/remove de row (apenas as suas). Matriz
definida em `entity.core.ts`.

## Comportamentos Unicos

- Nao possui implementacao in-memory (apenas contract + implementacao)
- Resolucao de grupos/capacidades delegada ao `GroupResolverContractService`
  (fecho transitivo de `encompasses[]`), nao queries diretas ao UserModel
- `bindingAllows` avalia o binding `{ kind, group }` por acao
