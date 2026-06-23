# Checklist de Testes — Redesign de Relacionamentos (Cardinalidade + FK-inline)

Cobertura de QA de tudo implementado no redesign descrito em
[`relacionamento-cardinalidade.md`](./relacionamento-cardinalidade.md), incluindo o
fix `4462c9da` (persistência de `relationship.mirror`, que ativou o FK-inline 1:1/1:N).

**Legenda:** `[ ]` a fazer · `[x]` ok · `[~]` parcial/observação.
**IDs de referência do ambiente de teste atual:** def `AA ↔ BB` = `6a30dfd54356e8d4965d4c39`;
row aa "SSSS" = `6a30dfdd4356e8d4965d4d0e`; rows bb = Luvsd/Sbbb/Pedro.

> **Modelo de armazenamento (storage role) — base de quase todo teste:**
> | Cardinalidade | source (lado A) | target (lado B) | Onde mora o vínculo |
> |---|---|---|---|
> | 1:1 | OWNS_FK | REVERSE | FK single na row do source |
> | 1:N (A múltiplo) | REVERSE | OWNS_FK | FK single na row do "N" (target) |
> | N:N | PIVOT | PIVOT | coleção `relationship-links` |

---

## 1. Configuração da definição (tela de campo)

- [ ] Criar campo `RELATIONSHIP` em A apontando p/ B materializa a `RelationshipDefinition` + campo-espelho em B (mesma def, lados invertidos).
- [ ] Toggle **"permite múltiplo em A"** e **"permite múltiplo em B"** mapeiam `field.multiple` de cada lado (sem flag nova).
- [ ] **Cardinalidade derivada** exibida na tela conforme os dois toggles (1:1 / 1:N / N:N).
- [ ] `visible` por lado ("B aparece em A" / "A aparece em B") controla a tabela interna de cada lado.
- [ ] `label` por lado independente (ex.: "Pedidos" em A, "Cliente" em B).
- [ ] `required` por lado reusa `field.required` (A pode exigir ≥1 B sem B exigir ≥1 A).
- [ ] `onDelete` (único da def) selecionável: RESTRICT / SET_NULL / CASCADE.
- [ ] `name` da def editável (default "A ↔ B").
- [ ] Uma tabela com **vários** campos RELATIONSHIP (A→B, A→C) = defs independentes, cada uma sua tab.
- [ ] Auto-relacionamento: table-select **permite a própria tabela** (§4.5).
- [ ] Tipo `RELATIONSHIP` **escondido/desabilitado** ao adicionar campo dentro de um grupo.
- [ ] **Novo (mirror):** ao criar/editar, `field.relationship.mirror = { multiple, visible, label }` é gravado nos **dois** campos (não some no save).

## 2. Cardinalidade derivada + storage role

- [ ] `RelationshipCardinality.of`: (!a&&!b)→1:1; (a&&b)→N:N; senão→1:N.
- [ ] `roleOfField(field)` retorna **não-null** p/ todo campo materializado (depende de `mirror` presente).
- [ ] 1:1 → source OWNS_FK, target REVERSE.
- [ ] 1:N → lado **não-múltiplo** OWNS_FK, lado **múltiplo** REVERSE.
- [ ] N:N → ambos PIVOT; `isPivot(def)` = true.
- [ ] `field.relationship.mirror.multiple` == `multiple` do campo do **lado oposto** (conferir nos 2 campos no DB).
- [ ] Mudar cardinalidade pela UI (`syncConfig`) atualiza `multiple` **e** `mirror` dos dois lados.

## 3. Persistência física (FK-inline × pivô)

- [ ] **1:1**: vincular grava FK single (`ObjectId`) na row do source; **0** docs em `relationship-links` p/ a def.
- [ ] **1:N**: vincular grava FK single na row do **"N"** (target OWNS_FK); 0 docs em `relationship-links`.
- [ ] **N:N**: vincular cria doc em `relationship-links` (`relationshipId, sourceId, targetId, order`).
- [ ] `_schema` do lado OWNS_FK = `{ type: ObjectId, ref }` single; lado REVERSE = array transiente.
- [ ] Índice único `(relationshipId, sourceId, targetId)` bloqueia par duplicado no N:N sob concorrência.

## 4. Vincular / desvincular pelos dois lados

- [ ] `POST /relationships/:id/links?side=source` vincula a partir de A.
- [ ] `POST /relationships/:id/links?side=target` vincula a partir de B (simétrico).
- [ ] `DELETE /relationships/:id/links/:linkId` desvincula (FK→null no OWNS_FK; del doc no PIVOT).
- [ ] Lado **não-múltiplo** com vínculo já existente → `RELATIONSHIP_SOURCE_LIMIT` / `RELATIONSHIP_TARGET_LIMIT` (409).
- [ ] Par já vinculado → `RELATIONSHIP_LINK_DUPLICATE` (409).
- [ ] `sourceId === targetId` → `RELATIONSHIP_SELF_LINK` (400).
- [ ] No 1:N, vincular o lado "N" **rouba** o filho do pai anterior (FK single = 1 pai) — comportamento correto.
- [ ] Reordenar (`PATCH .../links/reorder`) atualiza `link.order` só no lado múltiplo/N:N.

## 5. Leitura / projeção (read-compat com a UI)

- [ ] `GET /tables/:slug/rows/:id` retorna `record[field.slug]` **sempre como array**.
- [ ] OWNS_FK: FK single é embrulhada em `[obj]`; vínculo vazio = `[]` (`normalizeReadProjection`).
- [ ] REVERSE: array dos filhos via 1 query reversa (FK == meuId).
- [ ] PIVOT: array via `relationship-links`.
- [ ] Lista paginada (`GET .../rows/paginated`) hidrata relacionamentos em **batch** (sem N+1).
- [ ] Filtro por relacionamento na listagem (`?<slug>=<ids>`) resolve por role (OWNS_FK direto / REVERSE / PIVOT).

## 6. Tela de detalhe (seções + tabs)

- [ ] Detalhe mostra **seção Relacionamentos** e **seção Grupos** separadas, cada item em **tab** (não empilhado).
- [ ] **REGRESSÃO DO BUG:** a tabela interna **lista** os relacionados. (aa "SSSS" → 3: Luvsd/Sbbb/Pedro; bb "Luvsd" → 1: SSSS.)
- [ ] Formato por cardinalidade: 1:1 vínculo único · 1:N lista no pai / único no filho · N:N lista nos dois.
- [ ] Tabela interna do lado `visible=false` **não** aparece.
- [ ] Paginação/scroll-infinito na tabela interna (N:N com muitos vínculos não carrega tudo).
- [ ] Reordenar por drag (`@dnd-kit`) só no lado múltiplo; persiste `link.order`.
- [ ] "Adicionar item" vincula existente **ou** cria novo inline; o item aparece sem reload manual.

## 7. Formulário criar/editar (single × múltiplo)

- [ ] Lado **não-múltiplo**: picker de 1 vínculo; trocar **substitui** o vínculo.
- [ ] Lado **múltiplo**: repetidor add/remove N linhas; cada adição passa por `canLink`.
- [ ] Mapa correto: 1:1 single/single · 1:N múltiplo(A)/single(B) · N:N múltiplo/múltiplo.
- [ ] `required` por lado: front exige ≥1 vínculo **só** no lado `required` antes de Salvar.
- [ ] `RowPayloadValidator` **ignora** campos RELATIONSHIP no payload do row (vínculos nascem após o row existir).
- [ ] Criar registro com filho inline: cria o row na outra tabela e o vínculo logo após (sem órfão em falha).

## 8. `onDelete` (por definition, direcional)

- [ ] **RESTRICT**: apagar registro com qualquer vínculo → bloqueia (`RELATIONSHIP_DELETE_RESTRICT`, 409).
- [ ] **SET_NULL**: apagar registro só remove os links/zera a FK que o tocam; nenhum outro registro apagado.
- [ ] **CASCADE 1:1 / 1:N**: apagar o **pai** (lado "um") remove links + registros **filhos** dependentes.
- [ ] **CASCADE 1:1 / 1:N**: apagar um **filho** só remove o link dele (não sobe a cascata).
- [ ] **CASCADE N:N**: remove apenas os links do registro (nenhuma ponta apagada).
- [ ] Cascata de filhos **reentra** no fluxo de delete respeitando o `onDelete` das defs deles.
- [ ] Auto-relacionamento: cascata **sem loop** infinito (guarda de ciclo).
- [ ] Apagar **tabela**: remove defs, links e o campo-espelho que a referenciam.

## 9. RELATIONSHIP ≠ FIELD_GROUP

- [ ] Criar/editar campo RELATIONSHIP **dentro de grupo** → rejeitado (`RELATIONSHIP_IN_FIELD_GROUP`, 400).
- [ ] Campo RELATIONSHIP apontando p/ tabela-relação (relationship-de-relationship) → rejeitado (`RELATIONSHIP_NESTED`, 400).
- [ ] Seams isolados: `field-group-builder` (subdoc nível único) e `relationship-builder` (links/FK) não se misturam.
- [ ] FIELD_GROUP de campos simples continua funcionando (intocado).

## 10. Migrations (boot `14 → 18`, idempotentes)

- [ ] **14 lift-out-of-groups**: promove RELATIONSHIP aninhado em grupo p/ top-level; 0 remanescentes em grupo; vínculos preservados.
- [ ] **15 embedded→links**: cria def + campo-espelho + 1 link por ObjectId embedded; contagem antes/depois idêntica; promove a N:N quando `targetId` aparece sob vários `sourceId`.
- [ ] **16 endpoint-flags**: backfill de `relationship.{side,visible,formMode}` sem tocar `multiple`/`relationshipId`.
- [ ] **17 links→FK**: converte 1:1/1:N (links→FK inline), deleta os links, reescreve `_schema` p/ FK single; N:N mantém pivô.
- [ ] **17 conflito**: owner apontando p/ >1 alvo → **mantém links** e **não grava marker** (reprocessa).
- [ ] **18 mirror backfill** *(novo)*: grava `relationship.mirror` nos dois lados de cada def; idempotente.
- [ ] **Idempotência geral**: 2º boot = no-op via marker no Setting singleton.
- [ ] `migrate-fieldgroup-to-relationship` (one-off manual, fora do boot): exige backup, valida contagem antes/depois.

## 11. Performance / N+1

- [ ] 1:1/1:N: leitura **não** consulta `relationship-links` (populate nativo da FK / 1 query reversa batched por página).
- [ ] N:N: resolução de links em **batch** (1 query por página, não por linha).
- [ ] Listagem paginada de N rows com relacionamento **não** dispara N+1 (conferir nº de queries / logs Mongo).
- [ ] Filtro/sort por relacionamento não degrada com volume (índices em `relationship-links` e FK).

## 12. Regressão do bug corrigido (split-brain)

- [ ] Criar relacionamento **1:N novo pela UI** grava **FK inline** (zero novo doc em `relationship-links`).
- [ ] A tabela interna do detalhe **lista de imediato** após criar/vincular (sem refresh manual).
- [ ] Não há divergência entre `GET /rows/:id` (`record[field.slug]`) e `GET /relationships/:id/links` — ambos retornam o mesmo conjunto.
- [ ] Estado do ambiente atual conferido no DB: `relationship-links` da def `…4c39` = **0**; `bb.aa-bb` = `ObjectId(SSSS)` nas 3 rows; `mirror` preenchido nos 2 campos.

## 13. Comandos de verificação

- [ ] `cd backend && npm run lint` limpo.
- [ ] `cd backend && npm run test:unit` verde (specs de relationship + schema-builder).
- [ ] **e2e**: rodado **pelo usuário** (`npm run test:e2e`) — não executar automaticamente.
- [ ] Migrations em dev (sem Docker) rodadas à mão: `node --import @swc-node/register/esm-register database/migrations/<arquivo>.ts`.

---

### Casos de borda extras (recomendado)

- [ ] Mudar cardinalidade 1:N → N:N (e volta) num relacionamento **com dados**: reshape de dados links↔FK (hoje **fora de escopo** — flags/mirror corrigem, dados exigem follow-up; documentar/observar).
- [ ] Campo sem `relationshipId` (não materializado): tela mostra empty-state pedindo migration, nunca célula legada.
- [ ] Vínculo apontando p/ registro na lixeira/`trashed`: não listar (ou listar conforme regra de status).
- [ ] Concorrência: dois vínculos simultâneos no lado não-múltiplo — só 1 vence (índice único / `canLink`).
