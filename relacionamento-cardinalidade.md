# Redesenho do sistema de relacionamentos (lowcodejs)

> Spec aterrada na arquitetura real do monorepo. Substitui o modelo embedded
> atual (array de ObjectIds dentro da row, config no `field.model.ts`) por uma
> entidade de primeira classe com coleção de junção (pivô), mantendo as features
> que já existem e o caminho de upgrade para instalações legadas. Convenções
> obrigatórias: classes (não funções soltas), padrão `Either`, DI por
> `di-registry`, repositórios contract+impl+in-memory, mensagens de erro em
> pt-BR, sem `any`/`as T` (só `as const`), return type explícito.

---

## 1. Contexto e objetivo

Hoje existe um campo do tipo `RELATIONSHIP` que mora dentro de uma tabela e liga
exatamente duas tabelas. Ele é sempre 1:N e só funciona em um sentido: a partir
de A enxergamos e gerenciamos os registros de B; o caminho contrário (abrir um
registro de B e relacionar registros de A) não existe. Esse é o buraco principal.

Objetivos:

1. Tratar o relacionamento como **entidade de primeira classe**, independente das
   duas tabelas.
2. Suportar **1:1, 1:N e N:N**, criando e gerenciando os vínculos **pelos dois
   lados**.
3. **Consistência em todo o sistema**: o mesmo registro é visto e editado de
   qualquer lado relacionado e na sua própria tabela, sem duplicar estrutura de
   dados, servindo de base para filtragem consistente.
4. Manter o modelo portável para um banco relacional no futuro (hoje MongoDB).

Nada do que já existe se perde: rótulo customizado (`labelParts`), ordenação
(`order`), criação inline (`allowCreateRelationshipRecords`) e o plugin
`cascade-dropdown`.

### Decisão: core, não plugin

Cogitou-se resolver isso com um plugin genérico ("exibir registros de outra
tabela relacionados ao registro visualizado"). **Decisão: é core.**
Relacionamento bidirecional com cardinalidade faz parte do núcleo da plataforma,
não é uma extensão opcional.

### O que motivou (bug real)

Hoje usuários abusam de `FIELD_GROUP` para simular relacionamento: ex., criam um
grupo "agendamentos" dentro de "equipamento". Mas grupo de campos é subdocumento
embedded (composição), não associação a tabela externa. Por isso:

- criar um agendamento na tabela agendamentos não o faz aparecer no grupo dentro
  do equipamento, e vice-versa (são estruturas de dados separadas);
- não há consistência nem filtragem entre os locais.

O esperado (e que este redesenho entrega): agendamento é uma tabela independente
que se vincula a equipamento (e a colaborador) como um pivô com atributos. O
mesmo agendamento aparece no equipamento, no colaborador e na tabela de
agendamentos, com filtragem consistente (§4.6).

---

## 2. RELATIONSHIP ≠ FIELD_GROUP (regra transversal)

`RELATIONSHIP` e `FIELD_GROUP` são tipos distintos e não podem ser confundidos em
nenhuma camada (schema, model, populate, query, migração, UI). Em UML:
**FIELD_GROUP = composição** (a classe é composta por partes que não existem sem
o pai); **RELATIONSHIP = associação** (entre entidades independentes).

| Aspecto       | `FIELD_GROUP` (composição)                   | `RELATIONSHIP` (associação)                     |
| ------------- | -------------------------------------------- | ----------------------------------------------- |
| Natureza      | subcampos **embedded** no próprio documento  | vínculo entre **tabelas independentes** (pivô)  |
| Existência    | parte **não existe** sem o pai               | os dois lados existem por si (têm tabela/menu)   |
| Nível         | nível 1, sem grupo-em-grupo                   | dado nível 1 (sem rel-de-rel); label navega read-only |
| Armazenamento | subdocumento na row                          | documentos `RelationshipLink` (coleção pivô)    |
| Performance   | **embedded: 10–20× mais rápido** (sem join)  | join/lookup via links (custo relacional)         |
| Enum          | `E_FIELD_TYPE.FIELD_GROUP` / `E_TABLE_TYPE.FIELD_GROUP` | `E_FIELD_TYPE.RELATIONSHIP`           |

**Quando usar cada um.** Use `FIELD_GROUP` quando os dados são partes intrínsecas
do registro pai, sem vida própria (ex.: linhas de um endereço, itens que só fazem
sentido dentro daquele documento); aí se ganha a performance do embedded. Use
`RELATIONSHIP` quando o outro lado é uma entidade independente (tem tabela
própria, aparece no menu, é filtrável e gerenciável por si), como agendamento,
consumo ou colaborador. Simular relacionamento com grupo de campos é o erro que
esta spec elimina.

**Regra dura: RELATIONSHIP não pode estar dentro de FIELD_GROUP.** Um grupo de
campos contém apenas campos simples, nunca um campo `RELATIONSHIP` (nem outro
grupo). Relacionamento é sempre top-level na tabela e aparece na sua própria
seção/tab no detalhe (§10.2). Isso elimina o caminho aninhado de populate (hoje
em `populate-builder.service.ts:193-222`) e deixa a separação estrutural, não só
por convenção.

Garantias exigidas:

- O ramo de FIELD_GROUP nos builders permanece intacto e isolado, e não trata
  mais relationship: grupo só monta subdocumento de campos simples.
- Criar/editar campo `RELATIONSHIP` dentro de um grupo é rejeitado na validação
  (use-case de field, Zod + regra de domínio).
- A migração embedded→links toca apenas campos `type === RELATIONSHIP`, nunca
  FIELD_GROUP; relationship que hoje esteja dentro de grupo é promovido a
  top-level (§11), preservando os vínculos.
- O caminho de populate de relationship dentro de grupo é removido.

---

## 3. Os dois controles de cada lado

Cada lado do relacionamento (A e B) tem dois controles independentes. Misturar os
dois é o erro a evitar.

1. **Visibilidade** (`visible`) — "este lado pode gerenciar o vínculo?". Quando
   ligado, a tela de detalhe daquele registro mostra a tabela interna de gestão.
   É só apresentação/interação.
2. **Aceita múltiplos** — "um registro deste lado pode ter vários do outro?".
   Reusa o `field.multiple` que já existe no campo daquele lado, sem flag nova.
   Define a cardinalidade, que cai sozinha das duas respostas:

| A aceita múltiplos? | B aceita múltiplos? | Cardinalidade               |
| ------------------- | ------------------- | --------------------------- |
| Não                 | Não                 | 1:1                         |
| Sim                 | Não                 | 1:N (A é o "pai")           |
| Não                 | Sim                 | 1:N invertido (B é o "pai") |
| Sim                 | Sim                 | N:N                         |

Derivar a cardinalidade dos dois `field.multiple` evita tratar um lado como "o
lado de sempre": tanto A quanto B podem ser o "um" de um 1:N sem inverter
source/target na config. Como visibilidade e múltiplos são controles separados,
dá para ter um 1:N gerenciado só por A (`source.visible = true`,
`target.visible = false`); no nível do dado o registro de B continua tendo seu
único "pai".

A cardinalidade não é persistida; é derivada (ver §5.2).

---

## 4. Modelo de dados

### 4.1 Camada lógica × física (portabilidade)

A camada lógica é agnóstica de banco: a `RelationshipDefinition` (os dois
endpoints, controles por lado, comportamento no delete) e o conceito de link.

A camada física muda conforme o banco. No MongoDB usamos uma única coleção de
junção (`RelationshipLink`) para os três tipos: caminho único de código, vínculo
simétrico, dois lados consultáveis. O N:N usa o mesmo pivô (`RelationshipLink`)
de 1:1 e 1:N; em N:N cada doc de link é um par `(sourceId, targetId)` e há vários
pares nos dois sentidos. Num backend relacional futuro a mesma definição mapeia
para FK em 1:1 e 1:N e tabela pivô em N:N. Em ambos referenciamos coleções e
registros por `_id`, nunca por slug (`[[project_relationship_table_id]]`), para
que renomear tabela/coluna não quebre vínculo.

**Não confundir dois "pivôs":** o `RelationshipLink` é o pivô de infraestrutura
(escondido, sempre presente, inclusive no N:N). Já a tabela associativa (§4.6) é
uma tabela de usuário com atributos próprios, modelada como duas relações 1:N, e
não como um N:N de links gordos.

### 4.2 Tipos (`application/core/entity.core.ts`)

```ts
export const E_RELATIONSHIP_ON_DELETE = {
  CASCADE: 'CASCADE',
  SET_NULL: 'SET_NULL',
  RESTRICT: 'RESTRICT',
} as const;

export interface IRelationshipEndpoint {
  // referência por _id (com slug de fallback para dados legados)
  table: Pick<ITable, '_id' | 'slug'>;
  // o campo RELATIONSHIP deste lado — fonte de "aceita múltiplos" e "obrigatório"
  field: Pick<IField, '_id' | 'slug'>;
  visible: boolean; // mostra a tabela interna de gestão neste lado
  label: string; // rótulo exibido na UI deste lado (independente do outro)
}
// "aceita múltiplos" e "obrigatório" do lado NÃO são duplicados aqui — são o
// field.multiple e o field.required do campo referenciado em endpoint.field
// (ambos já existem no Field). A definition resolve o campo quando precisa dos
// flags (cardinalidade, canLink, validação de required). Só `visible` e `label`
// são exclusivos do endpoint.

export interface IRelationshipDefinition {
  _id: string;
  // rótulo interno; default derivado dos labels dos dois lados ("A ↔ B"),
  // editável na config. Só para identificação administrativa.
  name: string;
  source: IRelationshipEndpoint; // lado A (escolhido primeiro)
  target: IRelationshipEndpoint; // lado B
  onDelete: ValueOf<typeof E_RELATIONSHIP_ON_DELETE>; // único; semântica SQL (§9)
  createdAt: Date;
  updatedAt: Date;
  trashed: boolean;
  trashedAt: Date | null;
}

export interface IRelationshipLink {
  _id: string;
  relationshipId: string; // qual definição
  sourceId: string; // _id do registro de A
  targetId: string; // _id do registro de B
  order: number; // posição do vínculo na lista do lado múltiplo (§10.2)
  metadata: Record<string, unknown> | null; // extensível (papel, etc.)
  createdAt: Date;
  updatedAt: Date;
}
```

A config de apresentação existente (`IFieldConfigurationRelationship`:
`table`, `field`, `order`, `customLabel`, `labelParts`, `labelSeparator`)
permanece no campo. O "aceita múltiplos" continua sendo o `field.multiple` que já
existe (não duplicar). Novos no campo: apenas `visible` (toggle da tabela
interna) e `relationshipId` (back-pointer para a definition). Um endpoint é um
campo `RELATIONSHIP` na sua tabela; a `RelationshipDefinition` é a fonte de
verdade do vínculo, e os campos guardam como cada lado se apresenta.

### 4.3 Models Mongoose (`application/model/`)

`relationship-definition.model.ts` e `relationship-link.model.ts`, com
`timestamps`, soft-delete (`trashed`/`trashedAt`) na definition, e índice único
composto garantindo idempotência do vínculo sob concorrência:

```ts
// relationship-link.model.ts
Schema.index({ relationshipId: 1, sourceId: 1, targetId: 1 }, { unique: true });
Schema.index({ relationshipId: 1, sourceId: 1, order: 1 }); // listar/ordenar lado source
Schema.index({ relationshipId: 1, targetId: 1, order: 1 }); // listar/ordenar lado target
```

```ts
// relationship-definition.model.ts — achar definições que tocam uma tabela
// (delete de tabela §9, read-compat §6, montar tabs do detalhe §10.2)
Schema.index({ 'source.table._id': 1 });
Schema.index({ 'target.table._id': 1 });
```

Os models vivem no DB system (`DB_DATABASE`), como os demais metadados; as rows
continuam no DB data (`getDataConnection()`).

### 4.4 Repositórios (`application/repositories/`)

Triplo contract+mongoose+in-memory por convenção (`di-registry` pareia sozinho,
zero edição):

- `relationship-definition/relationship-definition-contract.repository.ts` (+ impl + in-memory)
- `relationship-link/relationship-link-contract.repository.ts` (+ impl + in-memory)

Contract de exemplo:

```ts
export abstract class RelationshipLinkContractRepository {
  abstract create(payload: RelationshipLinkCreatePayload): Promise<IRelationshipLink>;
  abstract exists(payload: RelationshipLinkExistsPayload): Promise<boolean>;
  abstract findBySource(relationshipId: string, sourceId: string): Promise<IRelationshipLink[]>;
  abstract findByTarget(relationshipId: string, targetId: string): Promise<IRelationshipLink[]>;
  abstract delete(_id: string): Promise<void>;
  abstract deleteByRecord(relationshipId: string, recordId: string): Promise<void>;
  abstract count(relationshipId: string, where: RelationshipLinkCountPayload): Promise<number>;
}
```

### 4.5 Auto-relacionamento (mesma tabela nos dois lados)

`source.table` e `target.table` podem ser a mesma tabela (ex.:
funcionário→gestor, categoria→categoria-pai). O modelo de pivô já suporta sem
caso especial: `sourceId` e `targetId` apontam para a mesma collection. Cuidados:

- O `table-field-relationship-table-select` deixa de excluir a própria tabela
  (hoje usa `excludeTableSlug`); passa a permitir selecioná-la.
- O campo-espelho do lado target é criado na mesma tabela (dois campos
  `RELATIONSHIP` na tabela, um por lado), com slugs distintos.
- `resolveRelation` funciona igual; ao ler, source e target buscam na mesma
  collection.
- Guardar contra auto-vínculo trivial (`sourceId === targetId`) quando não fizer
  sentido: bloquear em `canLink` com erro de domínio (`RELATIONSHIP_SELF_LINK`),
  salvo se o caso de uso permitir explicitamente.

### 4.6 Tabela associativa (junção com atributos)

Há dois jeitos de relacionar, e a spec cobre os dois com o mesmo modelo:

- **Relação direta A↔B** — o vínculo não tem atributos próprios; o
  `RelationshipLink` (com `metadata`/`order` opcionais) basta. Vale para qualquer
  cardinalidade, inclusive N:N (o pivô são os próprios links).
- **Tabela associativa C** — quando o vínculo é uma entidade com atributos e vida
  própria (ex.: agendamento entre equipamento e colaborador; consumo entre
  item-de-estoque e tarefa). C é uma tabela independente (no menu, com CRUD
  próprio) que se realiza como duas (ou mais) relações 1:N apontando para C:
  `equipamento (1) → agendamento (N)` e `colaborador (1) → agendamento (N)`. Não
  há entidade nova no modelo; é a composição de relações já descritas.

**Regra de decisão.** Precisa de atributos próprios, CRUD, presença no menu ou
filtragem na junção? Então tabela associativa (2× 1:N). Senão, relação direta
(qualquer cardinalidade, incluindo N:N) sobre o link-pivô.

**Garantia de consistência** (objetivo 3 do §1): o registro de C é um só e
aparece, sem duplicação, em todos os lados:

- na tela de detalhe de equipamento (tab de agendamentos, §10.2);
- na tela de detalhe de colaborador (idem);
- na própria tabela agendamentos (listagem normal);
- e é filtrável consistentemente, porque é dado relacional real (links), não
  subdocumento embedded.

Criar a partir de qualquer lado cria o mesmo registro de C + os links; o
inline-create (§10.3) renderiza o form da tabela C, então dá para preencher os
demais vínculos de C (ex.: ao criar o agendamento dentro do equipamento, já
escolher o colaborador) e os atributos próprios.

**Perfis/telas diferentes, mesmo dado** (caso consumo): o bolsista registra o
consumo pela tarefa (tab interna), o responsável de estoque registra pela tela de
consumos do módulo de estoque. É o mesmo registro de consumo, visto e filtrado de
forma consistente em ambos. As permissões por tela seguem o RBAC existente
(`table.permissions`/`field.permissions`), sem caminho especial.

---

## 5. Camada de aplicação

### 5.1 Service de domínio (`application/services/relationship/`)

`relationship-contract.service.ts` + impl (`@Service() export default`), no padrão
dos builders de `services/table/`. Concentra a lógica reusável de domínio:
`cardinalityOf`, `canLink`, `link`, `unlink`, `resolveRelation`. Consumido pelos
use-cases via constructor injection (caminho direto do contract, nunca barrel —
`[[project_di_pattern]]`).

### 5.2 Cardinalidade derivada

```ts
export class RelationshipCardinality {
  // lê o field.multiple dos campos dos dois lados (resolvidos via endpoint.field)
  static of(
    sourceField: Pick<IField, 'multiple'>,
    targetField: Pick<IField, 'multiple'>,
  ): '1:1' | '1:N' | 'N:N' {
    const a = sourceField.multiple;
    const b = targetField.multiple;
    if (!a && !b) return '1:1';
    if (a && b) return 'N:N';
    return '1:N';
  }
}
```

Não é persistida; serve só para exibição e escolha de rótulos. O service resolve
os campos dos dois lados (`endpoint.field`, no DB system, barato/cacheável) antes
de chamar.

### 5.3 Garantia de cardinalidade ao vincular

A regra vive na aplicação, no momento de criar o vínculo (combina com `Either` +
Zod). O índice único `(relationshipId, sourceId, targetId)` bloqueia par
duplicado mesmo sob concorrência. Erros de domínio são factories de
`HTTPException`, em pt-BR:

```ts
async canLink(
  relationship: IRelationshipDefinition,
  sourceField: Pick<IField, 'multiple'>,
  targetField: Pick<IField, 'multiple'>,
  sourceId: string,
  targetId: string,
): Promise<Either<HTTPException, true>> {
  // auto-relacionamento (§4.5): bloquear vínculo trivial de um registro consigo
  if (sourceId === targetId) {
    return left(
      HTTPException.BadRequest(
        'Um registro não pode se vincular a si mesmo',
        'RELATIONSHIP_SELF_LINK',
      ),
    );
  }

  const duplicate = await this.links.exists({
    relationshipId: relationship._id,
    sourceId,
    targetId,
  });
  if (duplicate) {
    return left(
      HTTPException.Conflict('Vínculo já existe', 'RELATIONSHIP_LINK_DUPLICATE'),
    );
  }

  if (!sourceField.multiple) {
    const used = await this.links.count(relationship._id, { sourceId });
    if (used > 0) {
      return left(
        HTTPException.Conflict(
          'Este lado não aceita múltiplos vínculos',
          'RELATIONSHIP_SOURCE_LIMIT',
        ),
      );
    }
  }

  if (!targetField.multiple) {
    const used = await this.links.count(relationship._id, { targetId });
    if (used > 0) {
      return left(
        HTTPException.Conflict(
          'Este lado não aceita múltiplos vínculos',
          'RELATIONSHIP_TARGET_LIMIT',
        ),
      );
    }
  }

  return right(true);
}
```

### 5.4 Leitura e criação pelos dois lados (simétrico)

A leitura é a mesma busca em duas direções; o formato (objeto único ou lista)
segue o `field.multiple` daquele lado:

```ts
async resolveRelation(
  relationship: IRelationshipDefinition,
  sourceField: Pick<IField, 'multiple'>,
  targetField: Pick<IField, 'multiple'>,
  recordId: string,
  side: 'source' | 'target',
): Promise<IRow | IRow[] | null> {
  if (side === 'source') {
    const links = await this.links.findBySource(relationship._id, recordId);
    const docs = await this.rows.findManyByIds(
      relationship.target.table,
      links.map((link) => link.targetId),
    );
    if (sourceField.multiple) return docs;
    return docs.at(0) ?? null;
  }

  const links = await this.links.findByTarget(relationship._id, recordId);
  const docs = await this.rows.findManyByIds(
    relationship.source.table,
    links.map((link) => link.sourceId),
  );
  if (targetField.multiple) return docs;
  return docs.at(0) ?? null;
}
```

A criação também é simétrica, e é o que falta hoje. Adicionar a partir de A fixa
`sourceId` e recebe `targetId`; a partir de B fixa `targetId` e recebe
`sourceId`. Ambos escrevem no mesmo `RelationshipLink` e passam por `canLink`. No
fluxo "criar novo inline", o registro na outra tabela é criado primeiro e o
vínculo logo em seguida, na mesma transação. Mongo roda como replica set, então
usar `mongoose` session + `withTransaction` (cria o registro e o link de forma
atômica; rollback automático se `canLink`/escrita falhar). As duas operações
tocam DBs distintos (row no DB data, link no DB system); a transação precisa de
uma session por conexão. Se não houver tx cross-connection, encadear: link
primeiro com a session do DB system e compensar a row em falha.

### 5.5 Use-cases e rotas (`application/resources/relationships/`)

Uma pasta por operação, cada uma com `*.controller.ts` + `*.use-case.ts` +
`*.validator.ts` (Zod) + `*.schema.ts` (OpenAPI) + specs. Use-cases retornam
`Either<HTTPException, T>`; controllers só fazem HTTP e propagam `errors`.

- `create/`, `update/`, `delete/` — CRUD da `RelationshipDefinition`
- `link/`, `unlink/` — vínculo pelos dois lados (existente ou inline)
- `list-by-side/` — lista paginada dos vínculos de um registro num lado (alimenta
  a tabela interna)
- `reorder/` — atualiza `link.order` no lado múltiplo

Rotas (sob `TableAccessMiddleware`, formato de resposta padrão do projeto):

| Método | Rota                                                  | Operação            |
| ------ | ----------------------------------------------------- | ------------------- |
| POST   | `/relationships`                                      | criar definition    |
| PUT    | `/relationships/:id`                                  | atualizar definition|
| DELETE | `/relationships/:id`                                  | excluir definition  |
| POST   | `/relationships/:id/links`                            | vincular (2 lados)  |
| DELETE | `/relationships/:id/links/:linkId`                    | desvincular         |
| GET    | `/relationships/:id/links?side=&recordId=&page=`      | listar por lado     |
| PATCH  | `/relationships/:id/links/reorder`                    | reordenar           |

Permissões: reusar as de tabela (`CREATE_FIELD`/`UPDATE_FIELD` para a definition,
`CREATE_ROW`/`UPDATE_ROW` para vincular/desvincular) via `TableAccessMiddleware`,
sem nova capacidade (decisão registrada; granularidade extra fica para depois se
necessário).

### 5.6 Catálogo de erros de domínio (`HTTPException`, pt-BR)

| `cause`                        | code | Quando                                            |
| ------------------------------ | ---- | ------------------------------------------------- |
| `RELATIONSHIP_LINK_DUPLICATE`  | 409  | par `(source, target)` já vinculado               |
| `RELATIONSHIP_SOURCE_LIMIT`    | 409  | lado source não-múltiplo já tem vínculo           |
| `RELATIONSHIP_TARGET_LIMIT`    | 409  | lado target não-múltiplo já tem vínculo           |
| `RELATIONSHIP_SELF_LINK`       | 400  | `sourceId === targetId` (auto-relação trivial)    |
| `RELATIONSHIP_REQUIRED`        | 400  | salvar row sem o vínculo obrigatório do lado       |
| `RELATIONSHIP_DELETE_RESTRICT` | 409  | `onDelete = RESTRICT` e existe vínculo            |
| `RELATIONSHIP_IN_FIELD_GROUP`  | 400  | criar/editar campo `RELATIONSHIP` dentro de grupo |
| `RELATIONSHIP_NESTED`          | 400  | campo `RELATIONSHIP` apontando para tabela-relação |

### 5.7 Builders dedicados (isolar FIELD_GROUP de RELATIONSHIP)

Hoje os builders de `services/table/` tratam FIELD_GROUP e RELATIONSHIP em ramos
espalhados no mesmo arquivo (ex.: `populate-builder.service.ts:193-222` resolve
relationship dentro de grupo no meio da lógica de grupo). Extraímos dois seams
privados do módulo (impl, não contratos —
`[[feedback_classes_over_loose_functions]]`):

- `field-group-builder.service.ts` — dona a fatia de subdocumento embedded
  nível-único (sub-schema, populate dentro do grupo, filtro). Só campos simples,
  não trata mais relationship.
- `relationship-builder.service.ts` — dona a fatia de vínculo via links
  (ref/schema, resolução por `RelationshipLink`, filtro). Apenas top-level
  (relationship não vive dentro de grupo, §2).

Os builders existentes (`schema/model/populate/query-builder`) passam a delegar a
esses seams nos ramos de cada tipo, em vez de inline. O caminho aninhado de
relationship-dentro-de-grupo (`populate-builder.service.ts:193-222`) é removido.
A separação RELATIONSHIP ≠ FIELD_GROUP vira estrutural e cada seam fica testável
isolado. Escopo contido: só esses dois seams (já tocados pelo redesenho).

---

## 6. Leitura compatível (read-compat) com a UI atual

A UI atual lê `row[field.slug]` (array de _ids populados). Para não quebrar, o
`RelationshipBuilder` resolve os links e projeta o resultado em `row[field.slug]`
no momento da leitura (paginated/show), respeitando `field.multiple` daquele lado
(lista ou objeto único). Assim, cells, detalhe, documento, `cascade-dropdown` e o
CSV import seguem funcionando enquanto a fonte de verdade passa a ser os links.

---

## 7. Aninhamento: dado × label

Distinção explícita (resolve a tensão com `[[project_field_group_single_level]]`):

- **Proibido** (dado nível > 1): um campo `RELATIONSHIP` não pode apontar para
  uma tabela que é só relacionamento; não há relacionamento-de-relacionamento.
  Validado na criação/edição do campo.
- **Proibido** (dentro de grupo): um campo `RELATIONSHIP` não pode estar dentro
  de um `FIELD_GROUP` (§2). Relacionamento é sempre top-level.
- **Permitido** (leitura read-only): o label composer pode navegar por relações
  para compor o rótulo de exibição (`labelParts`), pois é só apresentação; não
  cria vínculo nem estrutura de dado aninhada.

---

## 8. Features incorporadas

Todas as features atuais continuam, convivendo com o pivô:

- **`order` (asc/desc)** — ordenação das opções no picker; mantido na config do
  campo, aplicado ao listar candidatos.
- **Custom label (`customLabel`, `labelParts`, `labelSeparator`)** — composição
  de rótulo multi-parte com navegação read-only (ver §7); resolvido na leitura.
- **`allowCreateRelationshipRecords`** — criar registro na outra tabela inline e
  já vincular, na mesma transação (§5.4).
- **Plugin `cascade-dropdown`** — extensão que filtra opções do filho pelo valor
  do pai; passa a ler candidatos pelo mesmo caminho de links, sem mudança de
  contrato da extensão.

---

## 9. Comportamento ao excluir (`onDelete`)

`onDelete` é um valor por definition (não por endpoint) com semântica de delete
cascade do relacional. A direção (quem é "pai"/"filho") é a da cardinalidade
derivada (§3): no 1:N o lado que aceita múltiplos é o pai, o outro é o
filho/dependente. Quando um registro que participa de um relacionamento é
apagado, para cada definição em que ele aparece:

1. `RESTRICT` — bloqueia a exclusão se existir qualquer vínculo (Left com erro de
   domínio), em qualquer lado.
2. `SET_NULL` — remove apenas os links que tocam aquele registro; o outro lado
   fica sem aquele vínculo (slot vazio). Nenhum registro é apagado.
3. `CASCADE` — segue a direção pai→filho:
   - **1:1 / 1:N**: apagar o pai (o lado "um") remove os links e os registros
     filhos (o lado "muitos") que dependiam dele. Apagar um filho só remove o
     link dele (não sobe a cascata).
   - **N:N**: não há pai/filho; `CASCADE` remove apenas os links do registro
     (equivale ao pivô do relacional: apagar uma linha não apaga a outra ponta).

Plugado no fluxo de delete de row (`row.repository`/use-case de exclusão) e no
delete de table (remover definitions, links e o campo-espelho que referenciam a
tabela). A cascata de registros filhos reentra no mesmo fluxo de delete
(respeitando o `onDelete` das definições deles), com guarda contra ciclo em
auto-relacionamento (§4.5).

---

## 10. Tela de configuração e tabela interna (frontend)

### 10.1 Configuração da definição (tela de novo/editar campo)

Mantém o fluxo atual do campo `RELATIONSHIP` e adiciona as sub-configurações de
cada lado. `components/common/dynamic-table/table-config/` captura:

1. **Manter o que já existe**: selecionar a tabela de relacionamento (define qual
   A se relaciona com qual B), campo visível, `order`, `customLabel` via
   `table-field-relationship-{table,field,order}-select.tsx` e
   `-label-composer.tsx`. Uma mesma tabela pode ter vários campos `RELATIONSHIP`
   apontando para tabelas diferentes, cada um uma definition independente.
2. **Sub-config por lado** (o que é novo na UI): dois pares de controles.
   - **"B aparece em A"** e **"A aparece em B"** → o `visible` de cada lado
     (mostra ou não a tabela interna naquele lado).
   - **"permite múltiplo" em A** e **"permite múltiplo" em B** → dois toggles,
     cada um mapeando o `field.multiple` do campo daquele lado (source = o próprio
     campo em edição; target = o campo-espelho que a config cria/atualiza na
     tabela B). Sem flag nova: reusa `field.multiple`.
   - A cardinalidade derivada (§5.2) aparece na própria tela conforme os dois
     "permite múltiplo".
3. `label` por lado (rótulos independentes: "Pedidos" em A, "Cliente" em B) e
   `required` por lado, que reusa o `field.required` que já existe no campo
   daquele lado (A pode exigir ≥1 B sem B exigir ≥1 A). Sem flag nova.
4. `onDelete` (único da definition, §9) e, quando source/target forem a mesma
   tabela, o auto-relacionamento habilitado (§4.5).

Configurar a partir do campo de A também materializa o campo-espelho de B (mesma
definition, lados invertidos), para que B possa gerenciar o vínculo.

Validação com Zod (`lib/schemas.ts`), payloads em `lib/payloads.ts`, tipos em
`lib/interfaces.ts`, enums em `lib/constant.ts`.

### 10.2 Tela de detalhe: seções + tabs (não empilhado)

Hoje a tela de detalhe mostra os grupos de campos empilhados. Para
relacionamentos isso não serve, porque pode haver relação entre as tabelas
relacionadas, e empilhar tabelas uma sob a outra fica confuso. Layout:

- **Duas seções** no detalhe: uma de Relacionamentos e uma de Grupos.
- Cada relacionamento (cada lado `visible`) e cada grupo ocupa uma tab dentro da
  sua seção, em vez de empilhados.
- Múltiplos relacionamentos (A→B, A→C, …) viram múltiplas tabs na seção de
  Relacionamentos.

Dentro da tab de cada relacionamento fica a tabela interna de gestão, que aceita
vincular existente ou criar novo inline. O formato segue o `field.multiple`
daquele lado:

| Cardinalidade | Tabela interna em A     | Tabela interna em B       |
| ------------- | ----------------------- | ------------------------- |
| 1:1           | vínculo único           | vínculo único             |
| 1:N (A pai)   | lista de registros de B | vínculo único com o A pai |
| N:N           | lista de registros de B | lista de registros de A   |

Implementação:

- Container de seções/tabs no detalhe (reusar o componente de tabs do design
  system `components/ui/`); a seção de Grupos reaproveita a renderização de grupo
  existente, só movida para tabs.
- Tabela interna estende `table-row/table-row-relationship-field.tsx` (single
  combobox / multi chips, infinite scroll, inline create já existentes); cells em
  `table-cells/table-row-relationship-cell.tsx` leem o resultado projetado (§6).
- **Ordem** dos vínculos no lado múltiplo segue `link.order` (default = ordem de
  inserção); reordenar arrasta e atualiza `order` (reusar `@dnd-kit` já no
  projeto).
- **Paginação**: `list-by-side` retorna no formato `Meta` padrão (N:N pode ter
  muitos vínculos); a tabela interna pagina/scroll-infinito, não carrega tudo.
- Hooks novos em `hooks/tanstack-query/` (CRUD da definition, link/unlink,
  list-by-side paginado); manter `use-relationship-rows-read-paginated*` para o
  picker; chaves em `_query-keys.ts`.

### 10.3 Formulário (criar/editar): single × múltiplo pela cardinalidade

O comportamento do formulário daquele lado é derivado do `field.multiple` (logo,
da cardinalidade). É o mesmo controle da tabela interna do detalhe, só que no
fluxo de criação/edição do registro:

- **Não múltiplo (single)** — um único vínculo: um picker (vincular existente ou
  criar novo inline). Valida normal, igual hoje. Trocar substitui o vínculo
  único.
- **Múltiplo** — repetidor de N registros, no espírito do grupo de campos de hoje
  (mas relationship ≠ grupo): adicionar/remover várias linhas, cada linha
  vincula existente ou cria novo inline. Cada adição passa por `canLink`.

Mapa por cardinalidade (cada lado segue o seu `field.multiple`):

| Cardinalidade | Form em A (source)        | Form em B (target)        |
| ------------- | ------------------------- | ------------------------- |
| 1:1           | single (um registro)      | single (um registro)      |
| 1:N (A pai)   | múltiplo (vários B)       | single (um A pai)         |
| N:N           | múltiplo (vários B)       | múltiplo (vários A)       |

Reuso: o padrão repetidor do grupo de campos (`dynamic-table/group-rows/`) para o
caso múltiplo, mas escrevendo links (não subdocumento embedded); o caso single
reusa o picker atual. A validação `required` é por lado (reusa `field.required`,
§10.1): quando o campo daquele lado é `required`, o form exige ≥1 vínculo naquele
lado, enforçado no use-case de criar/atualizar row da tabela daquele lado. Mesmo
componente no detalhe (§10.2) e no form, alternado por `field.multiple`: caminho
único de código.

---

## 11. Migração e seeders (instalações legadas)

Caminho de upgrade para bases em produção, não só greenfield. Rodam idempotentes
no boot via `docker-entrypoint.sh`, com marcador no Setting singleton (padrão de
`migrate-relationship-table-id.ts`).

1. **`migrate-relationship-lift-out-of-groups.ts`** — roda primeiro. Instalações
   legadas podem ter campo `RELATIONSHIP` dentro de um `FIELD_GROUP` (hoje
   permitido; §2 passa a proibir). A migração:
   - encontra todo campo `type === RELATIONSHIP` aninhado em grupo
     (`table.groups[].fields[]`);
   - promove a top-level (move o campo para `table.fields[]`, fora do grupo),
     preservando a config e os vínculos (os ObjectIds embedded vão junto);
   - reconstrói o `_schema` da tabela sem o relationship dentro do subdocumento;
   - valida: nenhum vínculo perdido; nenhum relationship remanescente dentro de
     grupo ao final;
   - idempotente via marcador no Setting.
2. **`migrate-relationship-embedded-to-links.ts`** — depois do passo 1, para cada
   campo `type === RELATIONSHIP` (já todos top-level; nunca FIELD_GROUP). Em
   legado existe só o campo do lado source (o que declarava o relacionamento); o
   lado target não tem campo. A migração:
   - cria `RelationshipDefinition` (source = tabela declarante, target =
     referenciada) preservando o comportamento 1:N atual;
   - mantém o `field.multiple` do campo source como está (1:N → já era múltiplo);
     define `source.visible = true`;
   - cria o campo `RELATIONSHIP` do lado target (que não existia) com
     `multiple = false` e `visible = false`, para que B passe a poder gerenciar;
   - cria um `RelationshipLink` por ObjectId embedded;
   - valida contagem antes/depois (nenhum vínculo pode ser perdido);
   - se um mesmo `targetId` aparece sob vários `sourceId`, é N:N implícito:
     promove o campo target para `multiple = true`;
   - só então faz `$unset` do array embedded;
   - idempotente via marcador; mantém leitura compatível durante a transição.
3. **`migrate-backfill-relationship-endpoint-flags.ts`** — popula apenas `visible`
   e `relationshipId` nos campos `RELATIONSHIP` legados sem sobrescrever valores
   existentes (`multiple` já existe; não tocar). Padrão de
   `migrate-backfill-relationship-create-records.ts`.
4. **Seeders** — relationships são dado de usuário; não há seed de domínio. Como
   reusamos as permissões de tabela (§5.5), não há novo seeder de permissão. (Se a
   implementação optar por capacidade dedicada depois, aí entra um seeder
   idempotente de permissão no padrão `*.seed.ts`.)

Ordem no `docker-entrypoint.sh`: **1 → 2 → 3**, todas idempotentes (no-op nos
boots seguintes via marcador).

### FIELD_GROUP usado como falso relacionamento (remodel manual)

Distinto dos passos 1–3. Bases legadas (ex.: labgestor) abusaram de `FIELD_GROUP`
para simular relacionamento: os "registros" vivem como subdocumentos embedded
dentro do pai (agendamentos dentro de equipamento), não como tabela independente.
Convertê-los para o modelo correto é um remodel de dados, não um backfill:
extrair cada subdocumento para uma tabela independente nova, recriar os campos,
gerar `RelationshipDefinition` + links. Isso é data-specific e destrutivo, fora
das migrations automáticas de boot. A spec entrega:

- um script one-off opcional (`migrate-fieldgroup-to-relationship.ts`), executado
  manualmente, com backup obrigatório e validação de contagem antes/depois
  (parametrizado por tabela/grupo, pois o mapeamento é por caso);
- ou, na falta dele, orientação para remodelar pela UI.

Não roda no boot; não é idempotente-por-marcador no mesmo sentido (depende de
decisão humana sobre qual grupo vira qual tabela).

---

## 12. Mapa file-by-file (checklist de implementação)

### Backend — novos

- `application/model/relationship-definition.model.ts`
- `application/model/relationship-link.model.ts` (índice único composto)
- `application/repositories/relationship-definition/` (contract + impl + in-memory)
- `application/repositories/relationship-link/` (contract + impl + in-memory)
- `application/services/relationship/relationship-contract.service.ts` (+ impl)
- `application/services/table/field-group-builder.service.ts` (seam FIELD_GROUP)
- `application/services/table/relationship-builder.service.ts` (seam RELATIONSHIP)
- `application/resources/relationships/{create,update,delete,link,unlink,list-by-side,reorder}/`
  (cada uma: controller + use-case + validator + schema + specs)
- `database/migrations/migrate-relationship-lift-out-of-groups.ts` (roda 1º)
- `database/migrations/migrate-relationship-embedded-to-links.ts` (roda 2º)
- `database/migrations/migrate-backfill-relationship-endpoint-flags.ts` (roda 3º)
- `database/migrations/migrate-fieldgroup-to-relationship.ts` (**opcional**,
  one-off manual, fora do boot — remodel de field-group-falso-relacionamento §11)

### Backend — alterados

- `application/core/entity.core.ts` (tipos + `E_RELATIONSHIP_ON_DELETE` + extensão do field)
- `application/model/field.model.ts` (novos: `visible`, `relationshipId`; `multiple` e `required` já existem — reusar)
- `application/resources/table-fields/{create,update}/` (validação: **rejeitar
  `RELATIONSHIP` dentro de grupo** — Zod + regra de domínio no use-case)
- `application/services/table/{schema,model,populate,query}-builder.service.ts`
  (delegar aos seams; read-compat; **remover** o caminho de relationship dentro
  de grupo em `populate-builder.service.ts:193-222`)
- `application/services/csv-import/relationship-resolver.ts` (resolver via links)
- fluxos de delete de **row** e **table** (`onDelete`)

### Frontend — novos/alterados

- `lib/{interfaces,constant,payloads,schemas}.ts` (definition/link/onDelete/cardinalidade + extensão do field)
- `components/common/dynamic-table/table-config/` (controle `visible` por lado + reuso de `field.multiple` e `field.required` por lado, `onDelete` único, `name` editável (default "A ↔ B"), cardinalidade derivada; reusar selects + label-composer; **permitir a própria tabela** no table-select p/ auto-relacionamento (§4.5); **esconder/desabilitar o tipo `RELATIONSHIP`** ao adicionar campo dentro de grupo)
- detalhe do registro: container de **seções (Relacionamentos / Grupos) + tabs**
  (reusar tabs de `components/ui/`; mover render de grupo existente para tab)
- `components/common/dynamic-table/table-row/table-row-relationship-field.tsx` (tabela interna por lado: single vs list)
- `components/common/dynamic-table/table-cells/table-row-relationship-cell.tsx` (ler resultado projetado)
- `hooks/tanstack-query/` (CRUD definition, link/unlink, list-by-side; manter `use-relationship-rows-read-paginated*`; `_query-keys.ts`)

---

## 13. Testes (escopo mínimo)

1. **Cardinalidade** — rejeitar o segundo vínculo quando o lado não aceita
   múltiplos (`SOURCE_LIMIT`/`TARGET_LIMIT`), e duplicado (`DUPLICATE`).
2. **Criação e leitura pelos dois lados** — `link`/`resolveRelation` em source e
   target; formato lista vs único conforme `field.multiple`.
3. **`onDelete`** — `RESTRICT` (bloqueia com vínculo); `SET_NULL` (só remove
   links); `CASCADE` direcional: apagar pai remove filhos (1:1/1:N), apagar filho
   só desvincula, N:N remove só links; cascata reentra respeitando o onDelete dos
   filhos; sem loop em auto-relacionamento.
4. **Migração** — contagem de vínculos idêntica antes/depois; idempotência no 2º
   boot; promoção a N:N quando detectado; **lift de relationship que estava em
   grupo para top-level** (nenhum remanescente em grupo); FIELD_GROUP de campos
   simples intocado.
5. **RELATIONSHIP ≠ FIELD_GROUP** — seams isolados; criação de campo
   relationship-de-relationship rejeitada; **criação de `RELATIONSHIP` dentro de
   grupo rejeitada**.
6. **Form criar/editar single × múltiplo** — lado não-múltiplo aceita 1 vínculo
   e a troca substitui; lado múltiplo aceita N (adiciona/remove), cada um via
   `canLink`; `required` **por lado** exige ≥1 só no lado ligado.
7. **Auto-relacionamento** — source/target na mesma tabela: criar definition,
   campo-espelho na mesma tabela, vincular dois registros distintos OK; vínculo
   `sourceId === targetId` rejeitado (`RELATIONSHIP_SELF_LINK`).

Unit (`npm run test:unit`) + lint localmente; e2e o usuário roda
(`[[feedback_never_run_e2e]]`).

---

## 14. Camada física relacional futura

A mesma `RelationshipDefinition` mapeia para:

- **FK** no 1:1 e no 1:N (o lado "muitos" guarda a referência ao "um");
- **tabela pivô** no N:N (vocabulário nativo do relacional).

A abstração de link é o que existe de mais portável, e é por isso que hoje há a
coleção de junção única no MongoDB, com referência sempre por `_id`.
