# Field Visibility Service

Enforcement server-side da visibilidade de campo por contexto
(`field.permissions: { list, form, detail }`). Decide quais campos NAO nativos
ficam ocultos para o solicitante e remove esses campos das respostas/escritas de
row. Espelha o que o frontend ja faz como dica de UX (`useFieldVisibility`), mas
aqui e a fonte da verdade: impede vazamento do valor (list/detail) e escrita em
campo oculto (form).

## Arquivos

| Arquivo | Descricao |
|---------|-----------|
| `field-visibility-contract.service.ts` | Classe abstrata + tipos `FieldVisibilityContext` (`list`/`form`/`detail`) e `FieldVisibilityInput` |
| `field-visibility.service.ts` | Implementacao; delega o fecho de grupos ao `GroupResolverContractService` |
| `in-memory-field-visibility.service.ts` | Stub de teste (por padrao nao oculta nada; `setHidden` forca) |

## Metodos

| Metodo | Retorno | Descricao |
|--------|---------|-----------|
| `hiddenSlugs(input)` | `Set<string>` | Slugs dos campos **nao nativos** ocultos no contexto para o usuario. Vazio quando privilegiado |
| `project(target, hidden)` | `T` | Remove de `target` as chaves em `hidden` (usado em rows na resposta e no payload de escrita) |

## Logica de `hiddenSlugs`

1. **Privilegiado** (`userRole` MASTER/ADMINISTRATOR, `isOwner` ou `isAdministrator`) → nada oculto.
2. **Campo nativo** (`field.native`) → nunca oculto (estrutural; a migracao tambem o preenche a partir dos showIn*).
3. Para cada campo nao nativo, avalia `field.permissions[context]`:
   - sem binding (legado) → cai no boolean `showInList`/`showInForm`/`showInDetail`
   - `PUBLIC` → visivel; `NOBODY` → oculto; `GROUP` → visivel se o grupo estiver no fecho do usuario
4. So resolve o fecho de grupos (`UserContractRepository.findById` + `GroupResolverContractService`) quando ha algum binding `GROUP` no contexto.

## Onde e aplicado (`table-rows`)

| Use-case | Contexto | Efeito |
|----------|----------|--------|
| `paginated` | `list` | Remove os valores dos campos ocultos de cada row |
| `show` | `detail` | Remove os valores dos campos ocultos da row |
| `create` / `update` | `form` | Descarta do payload escritas em campos ocultos antes de validar/salvar |
| `bulk-update` | `form` | Reusa o `update` (encaminha os sinais do solicitante) |

Os controllers passam os sinais do solicitante via chaves reservadas `__role`,
`__isOwner`, `__isAdministrator` (descartadas pelo Mongoose strict, como
`__ownOnly`/`__actorUserId`). Em leitura (`paginated`/`show`) sao parametros
normais do payload do use-case.
