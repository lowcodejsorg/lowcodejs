# Relacionamento Bidirecional (Virtual Populate)

## Problema

No LowCodeJS, campos do tipo RELATIONSHIP criam um vinculo entre tabelas.
Quando a tabela `usuarios` tem um campo `contatos` do tipo RELATIONSHIP
apontando para a tabela `contatos`, ao consultar usuarios os contatos vem
populados. Porem, ao consultar contatos, nao havia como saber quais
usuarios os referenciam.

**Antes:**
- `GET /tables/usuarios/rows/paginated` → usuarios trazem contatos populados ✓
- `GET /tables/contatos/rows/paginated` → contatos NAO trazem usuarios ✗

**Depois:**
- `GET /tables/usuarios/rows/paginated` → usuarios trazem contatos populados ✓
- `GET /tables/contatos/rows/paginated` → contatos trazem usuarios via virtual ✓

## Como funciona

Usamos o recurso de **Virtual Populate** do Mongoose. Um virtual e um campo
que nao existe no MongoDB, mas e computado pela aplicacao no momento da consulta.

### Conceito

```
Tabela: usuarios
Campo: contatos (RELATIONSHIP → contatos)
Dado: { _id: "u1", nome: "João", contatos: ["c1", "c2"] }

Tabela: contatos
Dado: { _id: "c1", nome: "Maria" }
```

Sem virtual populate, ao consultar contato "c1", o retorno e:
```json
{ "_id": "c1", "nome": "Maria" }
```

Com virtual populate, o Mongoose descobre que `usuarios.contatos`
referencia a tabela `contatos` e adiciona um virtual:
```json
{
  "_id": "c1",
  "nome": "Maria",
  "usuarios": [
    { "_id": "u1", "nome": "Joao" }
  ]
}
```

### Fluxo tecnico

1. **Descoberta**: `findReverseRelationships(tableSlug)` busca todos os campos
   RELATIONSHIP em outras tabelas que apontam para `tableSlug`
2. **Registro**: `buildTable()` registra virtuals no schema Mongoose com
   `schema.virtual(name, { ref, localField, foreignField })`
3. **Populate**: `buildPopulate()` inclui os paths dos virtuals no array
   de populate, garantindo que o modelo da tabela source exista

### Queries executadas

Para uma tabela `contatos` referenciada por `usuarios.contatos`:

1. `Field.find({ type: 'RELATIONSHIP', 'relationship.table.slug': 'contatos' })`
   → encontra o campo `contatos` da tabela `usuarios`
2. `Table.find({ fields: { $in: [fieldId] } })`
   → encontra a tabela `usuarios`
3. No momento do populate: `usuarios.find({ contatos: { $in: [ids dos contatos] } })`
   → query batched (uma unica query para todos os contatos da pagina)

## Convencao de nomes

| Cenario | Nome do virtual | Exemplo |
|---------|----------------|---------|
| Uma tabela referencia | slug da tabela source | `usuarios` |
| Mesma tabela com 2+ campos | `tabela__campo` | `usuarios__contatos_pessoais` |

## Exemplos de API

### Forward (existente)
```
GET /tables/usuarios/rows/paginated
```
Retorno: usuarios com contatos populados (comportamento atual, sem mudanca).

### Reverse (novo)
```
GET /tables/contatos/rows/paginated
```
Retorno: contatos com virtual `usuarios` populado - array de usuarios que
referenciam cada contato.

### Outro exemplo: bairros x municipios

Tabela `bairros` tem campo `municipio` (RELATIONSHIP → municipios).

```
GET /tables/municipios/rows/paginated
```
Retorno: cada municipio inclui virtual `bairros` com todos os bairros
que o referenciam.

## Protecao contra loop infinito

Se A referencia B e B referencia A, os virtuals reversos so sao carregados
no nivel raiz da consulta. Na populacao recursiva de relacionamentos
diretos (forward), os virtuals reversos nao sao incluidos, prevenindo
ciclos A→B→A→B...

## Limpeza do foreignField

O foreignField (ex: `responsavel`, `equipe`) precisa estar no `select` para o
Mongoose fazer o match do virtual populate. Porem, sem tratamento, esse campo
apareceria no output como array de ObjectIds crus — dado circular e desnecessario.

A opcao `transform` do populate remove o foreignField de cada documento apos o match:

```json
// Antes (sem transform)
"departamentos-responsavel": [{
  "nome": "RH",
  "responsavel": ["698b805ba3b6ccad7ec7bb31"]
}]

// Depois (com transform)
"departamentos-responsavel": [{
  "nome": "RH"
}]
```

Isso e feito em `buildPopulate()` no `util.core.ts`.

## Arquivos envolvidos

| Arquivo | Funcao |
|---------|--------|
| `backend/application/core/util.core.ts` | `findReverseRelationships()`, `buildTable()`, `buildPopulate()` |
| `backend/application/resources/table-rows/paginated/paginated.use-case.ts` | Endpoint paginado |
| `backend/application/resources/table-rows/show/show.use-case.ts` | Endpoint show |
