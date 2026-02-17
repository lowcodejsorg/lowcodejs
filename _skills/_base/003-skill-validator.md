# Skill: Validator (Zod)

Os validators sao schemas Zod que definem e validam a estrutura dos dados de entrada (body, params, query) de cada action. Cada validator exporta o schema e o type inferido via `z.infer`, garantindo que a validacao em runtime e a tipagem em compile-time estejam sempre sincronizados. O padrao de composicao com `.extend()` permite reutilizar campos comuns entre actions da mesma entidade.

---

## Estrutura do Arquivo

```
backend/
  application/
    resources/
      [entity]/
        [entity]-base.validator.ts          <-- campos compartilhados (opcional)
        [action]/
          [action].validator.ts             <-- validator da action especifica
          [action].controller.ts
          [action].use-case.ts
```

- Validators de action ficam em `backend/application/resources/[entity]/[action]/[action].validator.ts`.
- O base validator (opcional) fica na raiz da entidade: `backend/application/resources/[entity]/[entity]-base.validator.ts`.
- Cada arquivo exporta o schema Zod e o type inferido.

---

## Template

**Validator simples (params/query):**

```typescript
import z from 'zod';

export const {{Entity}}{{Action}}{{Params|Body}}Validator = z.object({
  {{campo}}: z.string({ message: '{{mensagem em PT-BR}}' })
    .min(1, '{{mensagem em PT-BR}}')
    .trim(),
});

export type {{Entity}}{{Action}}Payload = z.infer<typeof {{Entity}}{{Action}}{{Params|Body}}Validator>;
```

**Base validator + extend:**

```typescript
// [entity]-base.validator.ts
import z from 'zod';

export const {{Entity}}BaseValidator = z.object({
  {{campo1}}: z.string({ message: '{{mensagem}}' }).trim().min(1, '{{mensagem}}'),
  {{campo2}}: z.email({ message: '{{mensagem}}' }).trim(),
});

// [action]/[action].validator.ts
import z from 'zod';
import { {{Entity}}BaseValidator } from '../{{entity}}-base.validator';

export const {{Entity}}{{Action}}BodyValidator = {{Entity}}BaseValidator.extend({
  {{campoExtra}}: z.string({ message: '{{mensagem}}' }).trim()
    .min({{n}}, '{{mensagem}}'),
});

export type {{Entity}}{{Action}}Payload = z.infer<typeof {{Entity}}{{Action}}BodyValidator>;
```

---

## Exemplo Real

**Validator simples (params):**

```typescript
import z from 'zod';

export const UserShowParamValidator = z.object({
  _id: z.string({ message: 'O ID e obrigatorio' }).min(1, 'O ID e obrigatorio').trim(),
});

export type UserShowPayload = z.infer<typeof UserShowParamValidator>;
```

**Base + extend pattern:**

```typescript
// user-base.validator.ts
import z from 'zod';

export const UserBaseValidator = z.object({
  name: z.string({ message: 'O nome e obrigatorio' }).trim().min(1, '...'),
  email: z.email({ message: 'O email e obrigatorio' }).trim(),
  group: z.string({ message: 'O grupo e obrigatorio' }).trim(),
});
```

```typescript
// create/create.validator.ts
import z from 'zod';
import { UserBaseValidator } from '../user-base.validator';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;

export const UserCreateBodyValidator = UserBaseValidator.extend({
  password: z.string({ message: 'A senha e obrigatoria' }).trim()
    .min(6, 'A senha deve ter no minimo 6 caracteres')
    .regex(PASSWORD_REGEX, 'A senha deve conter: 1 maiuscula, 1 minuscula, 1 numero e 1 especial'),
});

export type UserCreatePayload = z.infer<typeof UserCreateBodyValidator>;
```

**Leitura do exemplo:**

1. `UserShowParamValidator` valida o parametro `_id` da URL -- e um schema simples com `.string()`, `.min(1)` e `.trim()`.
2. `UserBaseValidator` agrupa os campos comuns da entidade `User` (name, email, group) que aparecem em mais de uma action.
3. `UserCreateBodyValidator` estende o base adicionando o campo `password` com validacao de tamanho minimo e regex de complexidade.
4. O type `UserCreatePayload` e inferido automaticamente do schema, mantendo tipagem e validacao sincronizados.

---

## Regras e Convencoes

1. **Sempre `.trim()` em strings** -- todo campo `z.string()` deve incluir `.trim()` para remover espacos extras.
2. **Mensagens customizadas em PT-BR** -- toda validacao deve incluir `{ message: '...' }` no construtor e mensagens descritivas nos metodos de refinamento (`.min()`, `.regex()`, etc.).
3. **Composicao com `.extend()`** -- campos comuns entre actions da mesma entidade devem ser extraidos para um base validator e reutilizados via `.extend()`.
4. **Export do validator + type inferido** -- cada arquivo exporta o schema Zod (named export) e o type via `z.infer<typeof Schema>`.
5. **Nomenclatura** -- o padrao de nomes segue `[Entity][Action][Params|Body]Validator` para o schema e `[Entity][Action]Payload` para o type.
   - `Params` para validacao de parametros da URL.
   - `Body` para validacao do corpo da requisicao.
6. **Um validator por action** -- cada action possui seu proprio arquivo de validator. Nao misture validators de actions diferentes no mesmo arquivo.
7. **Sem logica de negocio** -- o validator apenas valida a estrutura e formato dos dados. Regras de negocio ficam no use case.

---

## Checklist

- [ ] O arquivo esta em `backend/application/resources/[entity]/[action]/[action].validator.ts`.
- [ ] O schema Zod e exportado com named export.
- [ ] O type inferido e exportado via `z.infer<typeof Schema>`.
- [ ] Todos os campos `z.string()` incluem `.trim()`.
- [ ] Todas as validacoes possuem mensagens customizadas em PT-BR.
- [ ] O nome segue o padrao `[Entity][Action][Params|Body]Validator`.
- [ ] O type segue o padrao `[Entity][Action]Payload`.
- [ ] Campos compartilhados entre actions usam base validator + `.extend()`.
- [ ] Nao ha logica de negocio no validator.

---

## Erros Comuns

| Erro | Causa | Correcao |
|------|-------|----------|
| Espacos em branco passando na validacao | Faltou `.trim()` no campo string | Adicionar `.trim()` a toda chain de `z.string()` |
| Mensagem de erro generica em ingles | Nao foi passada `{ message: '...' }` no construtor do tipo Zod | Adicionar mensagem customizada em PT-BR como primeiro argumento: `z.string({ message: '...' })` |
| Duplicacao de campos entre validators | Campos comuns nao foram extraidos para o base validator | Criar `[entity]-base.validator.ts` e usar `.extend()` nas actions |
| Type nao reflete o schema | O type foi definido manualmente em vez de inferido | Sempre usar `z.infer<typeof Schema>` em vez de definir a interface manualmente |
| Validator nomeado incorretamente | Nao segue o padrao `[Entity][Action][Params\|Body]Validator` | Renomear seguindo a convencao: ex. `UserCreateBodyValidator`, `UserShowParamValidator` |
| Validacao de regex sem mensagem descritiva | Segundo argumento do `.regex()` omitido | Adicionar mensagem explicando os requisitos: `.regex(REGEX, 'A senha deve conter: ...')` |
| Import errado do Zod | Usando `import { z } from 'zod'` em vez de default import | Usar `import z from 'zod'` (default import) |

---

**Cross-references:** ver [002-skill-controller.md](./002-skill-controller.md), [024-skill-schema-zod.md](./024-skill-schema-zod.md).
