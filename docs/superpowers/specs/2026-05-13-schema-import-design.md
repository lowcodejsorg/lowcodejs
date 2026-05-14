# Schema Import — Design Spec

**Data:** 2026-05-13
**Branch:** `feat/schema-import`
**Status:** Aprovado, em implementação

## Problema

Hoje, criar uma tabela no LowCodeJS exige passar pela UI campo por campo. Para
inicializar um projeto com várias tabelas (10–20 tabelas, cada uma com 5–15
campos), o usuário leva horas em uma tarefa repetitiva e propensa a erro.

Inspiração: Supabase permite colar um arquivo de schema (SQL) e cria todas as
tabelas de uma vez. Queremos a mesma experiência no LowCodeJS, adaptada à
realidade do produto (MongoDB + schema dinâmico em JSON, não SQL).

## Solução

Nova feature core: **Schema Import**. O usuário cola (ou faz upload de) um
arquivo YAML declarativo que descreve várias tabelas; o backend valida, cria
todas as tabelas em sequência e retorna um relatório com tabelas criadas e
falhas.

Não é dry-run. Segue o modelo Supabase: "colar e executar". As tabelas que
funcionarem ficam criadas; as que falharem aparecem no relatório com a causa.

## Escopo da v1

### Tipos de campo suportados

- `TEXT_SHORT`, `TEXT_LONG`
- `DATE`
- `DROPDOWN` (com options inline: `label` + `color` opcional)
- `FILE`, `USER`
- `CATEGORY`
- `RELATIONSHIP` (cross-table dentro do mesmo schema; resolução em segundo passe)

### Propriedades de campo suportadas

- `required`, `multiple`, `format`
- `showInList`, `showInForm`, `showInFilter`, `showInDetail`
- `defaultValue`

### Propriedades de tabela suportadas

- `name`, `visibility`, `style`

### Fora do escopo (v2)

- `FIELD_GROUP` (grupos embutidos) — complexidade alta
- `methods` (beforeSave / afterSave / onLoad)
- `administrators`
- `layoutFields`, `fieldOrderList/Form/Filter/Detail` (usam defaults)
- Importação de `data` (linhas) — feature separada (já existe em
  `tables-import-export` para 1 tabela; multi-table data import fica para v2)

## Formato YAML

```yaml
tables:
  - name: Clientes
    visibility: PRIVATE       # opcional, default PRIVATE
    style: LIST               # opcional, default LIST
    fields:
      - name: Nome Completo
        type: TEXT_SHORT
        required: true
        showInList: true
        showInForm: true

      - name: Email
        type: TEXT_SHORT
        format: EMAIL
        required: true

      - name: Status
        type: DROPDOWN
        options:
          - label: Ativo
            color: "#22c55e"
          - label: Inativo
            color: "#ef4444"

  - name: Pedidos
    fields:
      - name: Título
        type: TEXT_SHORT
        required: true

      - name: Cliente
        type: RELATIONSHIP
        relationship:
          table: clientes          # slug da tabela referenciada
          field: nome-completo     # slug do campo
```

**Regras:**

- Slugs de tabela e campo são derivados de `name` via `slugify` (mesmo
  comportamento do `table-base/create` atual)
- Referências `relationship.table` / `relationship.field` aceitam slugs
- O parse usa `js-yaml` (já estável, sem dependências pesadas)
- Validação estrutural via Zod schema dedicado

## Arquitetura Backend

### Localização

```
backend/application/resources/table-base/
└── schema-import/
    ├── schema-import.controller.ts
    ├── schema-import.use-case.ts
    ├── schema-import.validator.ts
    ├── schema-import.schema.ts          # OpenAPI
    ├── schema-import.use-case.spec.ts   # Vitest unit
    └── schema-import.controller.spec.ts # Vitest e2e
```

### Endpoint

`POST /tables/schema-import`

- **Auth**: obrigatório (`AuthenticationMiddleware`)
- **Body**: `{ yaml: string }` (texto bruto)
- **Body limit**: 5 MB (tamanho generoso para schemas grandes)
- **Response 201**:
  ```json
  {
    "created": [
      { "name": "Clientes", "slug": "clientes", "fieldCount": 3 },
      { "name": "Pedidos", "slug": "pedidos", "fieldCount": 2 }
    ],
    "errors": [
      { "name": "TabelaInvalida", "message": "Já existe tabela com slug 'tabela-invalida'" }
    ]
  }
  ```
- **Response 400**: YAML malformado, schema inválido, ou body ausente
- **Response 401**: sem autenticação

### Use-Case (fluxo em 2 passes)

```ts
execute(payload: { yaml: string; ownerId: string }) {
  // 1. Parse YAML → obj
  // 2. Valida obj com Zod (SchemaImportPayloadValidator)
  // 3. Pass 1 — cria tabelas sem RELATIONSHIP
  //    - para cada table:
  //      - slugify(name) + check unicidade no DB e no batch
  //      - cria native fields
  //      - cria fields top-level (RELATIONSHIP fica pendente: cria com
  //        relationship=null inicialmente, registra no mapa para 2º passe)
  //      - cria a table com fieldOrder/layout default
  //      - acumula em created[] ou errors[]
  // 4. Pass 2 — resolve RELATIONSHIP
  //    - para cada relationship pendente:
  //      - resolve table.slug → table._id e field.slug → field._id
  //      - atualiza o field com fieldRepository.update(...)
  //      - se referência for inválida (slug não existe), reporta no errors[]
  //        mas mantém o campo (apenas relationship=null)
  // 5. Retorna { created, errors }
}
```

**Estratégia de erro:** "execute tudo, reporta no final" (escolha do usuário).
Erros isolam por tabela — uma tabela com erro não bloqueia as outras. Não
existe rollback (consistente com Supabase). MongoDB sem transactions cross-
collection facilita esse modelo.

### Reutilizar serviços existentes

- `TableContractRepository` (create, findBySlug)
- `FieldContractRepository` (create, createMany, update)
- `TableSchemaContractService` (computeSchema)

Reutilizar pontualmente a lógica do `tables-import-export/import-table.use-case.ts`
**sem** copiá-la cegamente — vamos extrair helpers comuns se valer a pena, ou
manter inline se for menor.

## Arquitetura Frontend

### Localização

```
frontend/src/routes/_private/tables/schema-import/
├── index.tsx          # loader + head
└── index.lazy.tsx     # componente UI
```

### UI

- **Editor**: Monaco Editor com syntax highlighting YAML (`language: "yaml"`)
- **Toolbar**:
  - Botão "Carregar arquivo .yaml" → input file invisível, FileReader lê e
    popula o editor
  - Botão "Ver exemplo" → cola o template do schema na editor
  - Botão "Limpar"
- **Botão primário**: "Importar Schema" → dispara mutation
- **Resultado inline** (após sucesso da mutation):
  - Cards verdes para tabelas criadas, com link para `/tables/:slug`
  - Cards vermelhos para tabelas com erro, com mensagem clara
  - Toast de sucesso/erro

### Card em `/tables/new`

Adicionar terceiro card "Importar Schema" com `UploadIcon` que navega para
`/tables/schema-import`.

### Hook

```
frontend/src/hooks/tanstack-query/
└── use-schema-import.tsx
```

Mutation que chama `POST /tables/schema-import` com `{ yaml: string }`.
Invalida `queryKeys.tables.all` em caso de sucesso.

### Payload e tipos

Adicionar em `lib/payloads.ts`:

```ts
export type SchemaImportPayload = { yaml: string };
export type SchemaImportResponse = {
  created: Array<{ name: string; slug: string; fieldCount: number }>;
  errors: Array<{ name: string; message: string }>;
};
```

## Dependências novas

### Backend

- `js-yaml` (~10kb minified, MIT, mantida ativamente, ~9M downloads/semana)
  - `@types/js-yaml` em devDependencies

### Frontend

- Monaco já tem suporte nativo a YAML (`language="yaml"`) — sem dependência
  adicional

## Testes

### Unit (backend)

`schema-import.use-case.spec.ts`:

1. YAML válido com 2 tabelas simples → cria ambas, sem erros
2. YAML com RELATIONSHIP cross-table → cria as duas, resolve relacionamento
3. Tabela com slug já existente → vai para `errors[]`, outras seguem
4. RELATIONSHIP apontando para slug inexistente → tabela criada, mas
   relationship.value fica null, erro reportado
5. YAML malformado → 400 BadRequest com cause `INVALID_YAML`
6. Zod validation failure (campo type inválido) → 400 com errors detalhados
7. Body ausente → 400

### E2E (backend)

`schema-import.controller.spec.ts`:

1. POST autenticado com YAML válido → 201, tabelas existem no MongoDB
2. POST sem auth → 401
3. POST com YAML malformado → 400 INVALID_YAML
4. POST com 1 tabela boa + 1 com slug duplicado → 201 com `created.length=1` e
   `errors.length=1`

### Frontend

Sem testes unitários inicialmente — toda a lógica crítica está no backend e o
componente é majoritariamente UI. Smoke teste manual via dev server cobre.

## Patterns seguidos

- Controller fino (HTTP), use-case com lógica e Either, validator Zod
- Either pattern para erros estruturados
- Mensagens em PT-BR
- Repositórios via `getInstanceByToken` / `@Inject`
- Slugify igual ao `table-base/create.use-case.ts`

## Riscos e mitigações

| Risco                                              | Mitigação                                                                          |
| -------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Schema gigante (>1000 tabelas) trava o servidor    | Body limit 5 MB + validação Zod com `.max(100)` no array `tables`                  |
| YAML com loops/anchors maliciosos                  | `js-yaml` usa `safeLoad`/`load` com schema FAILSAFE (não exec)                     |
| Race condition: duas tabelas no mesmo slug         | Pass 1 mantém set local de slugs já alocados no batch + check DB                   |
| RELATIONSHIP circular (A→B, B→A)                   | Cria ambas em Pass 1 com relationship=null, resolve em Pass 2; circular permitido  |
| Falha de campo individual quebra a tabela inteira  | Erros são reportados por tabela, não por campo — campo problemático fica `null`    |

## Critérios de aceite

- [ ] Usuário em `/tables/new` vê o card "Importar Schema"
- [ ] Em `/tables/schema-import`, usuário cola YAML e clica "Importar"
- [ ] Tabelas válidas são criadas e listadas no resultado
- [ ] Tabelas inválidas aparecem com mensagem clara
- [ ] RELATIONSHIP entre tabelas do mesmo schema funciona
- [ ] Upload de arquivo `.yaml` popula o editor
- [ ] Botão "Ver exemplo" cola um template de schema funcional
- [ ] Todos os testes unitários e e2e passam
- [ ] `npm run lint` passa
- [ ] Smoke test manual via Docker Compose
