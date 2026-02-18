# Skill: Frontend Schema (Zod)

Os schemas Zod do frontend definem e validam a estrutura dos dados de formularios e inputs do lado do cliente. Diferente dos validators do backend (que validam requests HTTP), esses schemas sao usados diretamente por bibliotecas de formulario como TanStack Form para validacao em tempo real. O padrao de composicao com `.extend()`, `.partial()` e `.merge()` permite criar variantes (create, update) a partir de um base schema, enquanto mensagens de erro em PT-BR oferecem feedback imediato ao usuario.

---

## Estrutura do Arquivo

Os schemas do frontend devem estar localizados em:

```
frontend/src/lib/schemas.ts
```

Diferente do backend (que possui um validator por action), o frontend centraliza todos os schemas em um unico arquivo. Isso ocorre porque os schemas do frontend sao consumidos por formularios em diversas rotas e componentes.

Dependencias tipicas:

- **z (zod)** - biblioteca de validacao e parsing
- **constant.ts** - enums e regex patterns (ex: `E_ENTITY_TYPE`, `PASSWORD_REGEX`)

---

## Template

```typescript
import z from 'zod';
import { E_{{ENTITY}}_{{CAMPO}}, PASSWORD_REGEX } from '@/lib/constant';

// Base schema -- campos comuns entre create e update
const {{Entity}}BaseSchema = z.object({
  {{campo1}}: z.string().trim().min(1, '{{Mensagem em PT-BR}}'),
  {{campo2}}: z.email('{{Mensagem em PT-BR}}').trim(),
  {{campo3}}: z.string().trim().min(1, '{{Mensagem em PT-BR}}'),
});

// Create -- estende base adicionando campos obrigatorios da criacao
export const {{Entity}}CreateBodySchema = {{Entity}}BaseSchema.extend({
  {{campoExtra}}: z.string().trim()
    .min({{n}}, '{{Mensagem em PT-BR}}')
    .regex({{REGEX}}, '{{Mensagem em PT-BR}}'),
});

// Update -- base com .partial() + campos fixos via .extend()
export const {{Entity}}UpdateBodySchema = {{Entity}}BaseSchema.partial().extend({
  id: z.string().trim(),
  {{campoOpcional}}: z.enum(['{{VALOR_1}}', '{{VALOR_2}}']).optional(),
});

// Composicao com .merge() -- para schemas complexos
export const {{Entity}}{{Action}}BodySchema = z.object({
  {{campo}}: z.string().trim(),
  {{campoEnum}}: z.enum([E_{{ENTITY}}_{{CAMPO}}.{{VALOR_1}}, E_{{ENTITY}}_{{CAMPO}}.{{VALOR_2}}]),
}).merge({{Entity}}BaseSchema);

// Campos dinamicos -- z.record para estruturas flexiveis
export const {{Entity}}DataSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(z.string())]),
);
```

---

## Exemplo Real

```typescript
import z from 'zod';
import { E_ENTITY_TYPE, PASSWORD_REGEX } from '@/lib/constant';

// Base schema para User
const UserBaseSchema = z.object({
  name: z.string().trim().min(1, 'O nome e obrigatorio'),
  email: z.email('Digite um email valido').trim(),
  group: z.string().trim().min(1, 'O grupo e obrigatorio'),
});

// Create: base + password com validacao de complexidade
export const UserCreateBodySchema = UserBaseSchema.extend({
  password: z.string().trim()
    .min(6, 'A senha deve ter no minimo 6 caracteres')
    .regex(PASSWORD_REGEX, 'A senha deve conter: 1 maiuscula, 1 minuscula, 1 numero e 1 especial'),
});

// Update: base com todos os campos opcionais + id obrigatorio + status opcional
export const UserUpdateBodySchema = UserBaseSchema.partial().extend({
  id: z.string().trim(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

// Entity create com merge de base schema
export const EntityCreateBodySchema = z.object({
  name: z.string().trim(),
  type: z.enum([E_ENTITY_TYPE.TYPE_A, E_ENTITY_TYPE.TYPE_B]),
}).merge(EntityBaseSchema);

// Dynamic data com campos dinamicos
export const DynamicDataSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(z.string())]),
);
```

Leitura do exemplo:

1. `UserBaseSchema` define os campos comuns da entidade User (`name`, `email`, `group`) com validacoes e mensagens em PT-BR. Este schema nao e exportado diretamente -- serve apenas como base para composicao.
2. `UserCreateBodySchema` estende o base adicionando `password` com validacao de tamanho minimo (6 caracteres) e regex de complexidade (`PASSWORD_REGEX` importado de `constant.ts`).
3. `UserUpdateBodySchema` usa `.partial()` no base (tornando `name`, `email` e `group` opcionais) e `.extend()` para adicionar `id` (obrigatorio) e `status` (opcional com valores restritos via `z.enum`).
4. `EntityCreateBodySchema` usa `.merge()` para combinar dois schemas independentes -- util quando os campos vem de fontes diferentes.
5. `DynamicDataSchema` usa `z.record()` para validar objetos com chaves dinamicas, onde os valores podem ser string, number, boolean, null ou array de strings.

---

## Regras e Convencoes

1. **Base schema + `.extend()` para variantes** -- campos comuns entre create e update devem ser extraidos para um base schema (nao exportado). Variantes sao criadas com `.extend()` para adicionar campos especificos.

2. **`.partial()` para schemas de update** -- ao atualizar uma entidade, nem todos os campos sao obrigatorios. Use `.partial()` no base schema para tornar todos os campos opcionais e `.extend()` para adicionar campos que permanecem obrigatorios (como `id`).

3. **`.merge()` para composicao de schemas independentes** -- quando dois schemas nao tem relacao de heranca (um nao e extensao do outro), use `.merge()` para combina-los. Diferente de `.extend()`, `.merge()` aceita outro schema completo como argumento.

4. **Mensagens de validacao em PT-BR** -- toda validacao deve incluir mensagens descritivas em portugues. Exemplos: `'O nome e obrigatorio'`, `'A senha deve ter no minimo 6 caracteres'`, `'Digite um email valido'`.

5. **`z.enum` com constantes de `constant.ts`** -- quando um campo aceita valores restritos definidos em um enum object, use `z.enum()` referenciando as constantes diretamente. Exemplo: `z.enum([E_ENTITY_TYPE.TEXT_SHORT, E_ENTITY_TYPE.TEXT_LONG])`.

6. **Regex patterns importados de `constant.ts`** -- patterns de validacao reutilizaveis (como `PASSWORD_REGEX`) devem ser importados de `constant.ts`, nunca definidos inline no schema. Isso garante consistencia entre frontend e qualquer outro ponto que use o mesmo pattern.

7. **`z.record()` para campos dinamicos** -- quando a estrutura dos dados e flexivel (ex: campos customizados de uma tabela), use `z.record(z.string(), z.union([...]))` para validar chaves e valores sem conhecer a estrutura antecipadamente.

8. **Sempre `.trim()` em campos string** -- todo campo `z.string()` deve incluir `.trim()` para remover espacos em branco desnecessarios antes da validacao.

9. **Schemas ficam em `schemas.ts`, payload types ficam em `payloads.ts`** -- schemas Zod sao para validacao de input (formularios). Payload types sao para tipagem de dados que nao precisam de validacao em runtime (ex: respostas da API, parametros de queries).

10. **Import default do Zod** -- use `import z from 'zod'` (default import), nao `import { z } from 'zod'`.

---

## Checklist

- [ ] Arquivo localizado em `frontend/src/lib/schemas.ts`
- [ ] Import default do Zod: `import z from 'zod'`
- [ ] Base schema criado para campos comuns (nao exportado diretamente)
- [ ] Variantes de create usam `BaseSchema.extend({ ... })`
- [ ] Variantes de update usam `BaseSchema.partial().extend({ id: ..., ... })`
- [ ] Todas as mensagens de validacao estao em PT-BR
- [ ] Todos os campos `z.string()` incluem `.trim()`
- [ ] `z.enum()` referencia constantes de `constant.ts` (nao strings literais)
- [ ] Regex patterns importados de `constant.ts` (nao definidos inline)
- [ ] `z.record()` usado para campos dinamicos
- [ ] `.merge()` usado para composicao de schemas independentes
- [ ] Schemas exportados com named export

---

## Erros Comuns

| Erro | Causa | Correcao |
|------|-------|----------|
| Update sobrescreve campos nao enviados com `undefined` | Schema de update nao usa `.partial()`, exigindo todos os campos | Aplicar `.partial()` no base schema antes de `.extend()` |
| Mensagem de erro exibida em ingles no formulario | Faltou mensagem customizada na validacao Zod | Adicionar mensagem em PT-BR: `z.string().min(1, 'O campo e obrigatorio')` |
| Enum no select aceita valores invalidos | `z.enum()` definido com strings literais em vez de constantes | Usar `z.enum([E_ENTITY_TYPE.TEXT_SHORT, ...])` referenciando o enum de `constant.ts` |
| Espacos em branco passam na validacao | Faltou `.trim()` na chain de validacao | Adicionar `.trim()` a todos os campos `z.string()` |
| Regex definido em dois lugares com patterns diferentes | Pattern duplicado entre schema e `constant.ts` | Centralizar o regex em `constant.ts` e importar no schema |
| `.extend()` usado com schema completo causa erro | `.extend()` aceita apenas shape object, nao outro schema | Usar `.merge()` para combinar dois schemas completos |
| Base schema exportado e usado incorretamente em formularios | Schema base exposto sem as validacoes especificas da action | Manter base schema como `const` local (nao exportado), exportar apenas as variantes |
| Import incorreto do Zod causa erro de compilacao | Usando `import { z } from 'zod'` em vez de default import | Corrigir para `import z from 'zod'` |
| `id` ausente no schema de update | `.partial()` tornou `id` opcional | Adicionar `id: z.string().trim()` no `.extend()` apos `.partial()` |

---

> **Cross-references:** ver [003-skill-validator.md](./003-skill-validator.md) | [026-skill-tipos-constantes.md](./026-skill-tipos-constantes.md) | [020-skill-formulario.md](./020-skill-formulario.md)
