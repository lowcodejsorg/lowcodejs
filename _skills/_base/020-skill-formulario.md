# Skill: Formulario (TanStack Form)

O formulario e a camada de interacao do usuario para criacao e edicao de dados no frontend. O projeto utiliza `@tanstack/react-form` com uma abstracacao customizada via `createFormHook`, que expoe `useAppForm` e `withForm`. O `useAppForm` configura o form com `defaultValues`, validators Zod e callback de submit, enquanto `withForm` cria componentes de campos reutilizaveis que recebem o form tipado e props adicionais (como `isPending`). O binding entre campo e estado do form e feito via `form.AppField`, que injeta automaticamente o contexto do field no componente. Essa arquitetura separa a definicao dos campos (reusavel) da logica de submit (especifica da pagina).

---

## Estrutura do Arquivo

```
frontend/
  src/
    integrations/
      tanstack-form/
        form-hook.ts                          <-- createFormHook (setup global)
        form-context.ts                       <-- fieldContext e formContext
        fields/
          base/
            index.ts                          <-- re-export dos field components
            field-text.tsx
            field-email.tsx
            field-password.tsx
            field-url.tsx
            field-switch.tsx
            ...
    routes/
      _private/
        [entity]/
          [action]/
            -[action]-form.tsx                <-- definicao do form (withForm)
            index.tsx                         <-- pagina que usa useAppForm
    lib/
      payloads/
        [entity].payload.ts                   <-- types do payload
      schemas/
        [entity].schema.ts                    <-- schemas Zod de validacao
```

- O setup global vive em `frontend/src/integrations/tanstack-form/form-hook.ts`.
- Cada entidade/action define seu form em `frontend/src/routes/_private/[entity]/[action]/-[action]-form.tsx`.
- O form e consumido na pagina correspondente em `frontend/src/routes/_private/[entity]/[action]/index.tsx`.

---

## Template

**form-hook.ts (setup global -- criado uma unica vez):**

```typescript
import { createFormHook } from '@tanstack/react-form';
import { FieldText, FieldEmail, FieldPassword, FieldUrl, FieldSwitch /* ... */ } from './fields/base';
import { fieldContext, formContext } from './form-context';

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    FieldText,
    FieldEmail,
    FieldPassword,
    FieldUrl,
    FieldSwitch,
    // ... demais field components
  },
  formComponents: {},
});
```

**Definicao do form (-[action]-form.tsx):**

```typescript
import { withForm } from '@/integrations/tanstack-form/form-hook';
import type { {{Entity}}{{Action}}Payload } from '@/lib/payloads';
import { {{Entity}}{{Action}}BodySchema } from '@/lib/schemas';

export const {{Entity}}{{Action}}Schema = {{Entity}}{{Action}}BodySchema;
export type {{Entity}}FormType = {{Entity}}{{Action}}Payload;

export const {{entity}}FormDefaultValues: {{Entity}}FormType = {
  // campos com valores iniciais vazios
};

export const {{Action}}{{Entity}}FormFields = withForm({
  defaultValues: {{entity}}FormDefaultValues,
  props: { isPending: false },
  render: function Render({ form, isPending }) {
    return (
      <section className="space-y-4 p-2">
        <form.AppField name="campo1">
          {(field) => <field.FieldText label="Label" placeholder="Placeholder" disabled={isPending} />}
        </form.AppField>
        {/* demais campos */}
      </section>
    );
  },
});
```

**Uso na pagina (index.tsx):**

```typescript
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { {{entity}}FormDefaultValues, {{Action}}{{Entity}}FormFields, {{Entity}}{{Action}}Schema } from './-{{action}}-form';

const form = useAppForm({
  defaultValues: {{entity}}FormDefaultValues,
  validators: { onChange: {{Entity}}{{Action}}Schema },
  onSubmit: async ({ value }) => {
    await mutation.mutateAsync(value);
  },
});

return (
  <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
    <{{Action}}{{Entity}}FormFields form={form} isPending={mutation.isPending} />
    <Button type="submit" disabled={mutation.isPending}>Salvar</Button>
  </form>
);
```

---

## Exemplo Real

**Definicao do form de criacao de usuario (`-create-form.tsx`):**

```typescript
import { withForm } from '@/integrations/tanstack-form/form-hook';
import type { UserCreatePayload } from '@/lib/payloads';
import { UserCreateBodySchema } from '@/lib/schemas';

export const UserCreateSchema = UserCreateBodySchema;
export type UserFormType = UserCreatePayload;

export const userFormDefaultValues: UserFormType = {
  name: '',
  email: '',
  password: '',
  group: '',
};

export const CreateUserFormFields = withForm({
  defaultValues: userFormDefaultValues,
  props: { isPending: false },
  render: function Render({ form, isPending }) {
    return (
      <section className="space-y-4 p-2">
        <form.AppField name="name">
          {(field) => (
            <field.FieldText
              label="Nome"
              placeholder="Digite o nome completo"
              disabled={isPending}
              icon={<UserIcon />}
            />
          )}
        </form.AppField>
        <form.AppField name="email">
          {(field) => (
            <field.FieldEmail
              label="E-mail"
              placeholder="exemplo@email.com"
              disabled={isPending}
            />
          )}
        </form.AppField>
        <form.AppField name="password">
          {(field) => (
            <field.FieldPassword
              label="Senha"
              placeholder="Digite a senha"
              disabled={isPending}
            />
          )}
        </form.AppField>
        <form.AppField name="group">
          {(field) => (
            <field.FieldGroupCombobox
              label="Grupo"
              placeholder="Selecione..."
              disabled={isPending}
              required
            />
          )}
        </form.AppField>
      </section>
    );
  },
});
```

**Uso na pagina de criacao de usuario:**

```typescript
const form = useAppForm({
  defaultValues: userFormDefaultValues,
  validators: { onChange: UserCreateSchema },
  onSubmit: async ({ value }) => {
    await mutation.mutateAsync(value);
  },
});

return (
  <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
    <CreateUserFormFields form={form} isPending={mutation.isPending} />
    <Button type="submit" disabled={mutation.isPending}>Salvar</Button>
  </form>
);
```

**Leitura do exemplo:**

1. `UserCreateBodySchema` e o schema Zod importado de `@/lib/schemas` que define as regras de validacao dos campos. Ele e re-exportado como `UserCreateSchema` para uso no `validators`.
2. `userFormDefaultValues` define os valores iniciais de todos os campos do form, tipados com `UserFormType` (alias de `UserCreatePayload`).
3. `withForm` cria o componente `CreateUserFormFields`, que recebe `form` (instancia tipada do form) e `isPending` como props. O `defaultValues` passado para `withForm` garante a inferencia de tipos dos campos.
4. Dentro do `render`, cada campo e declarado via `form.AppField` com o `name` correspondente a uma chave do `defaultValues`. O callback recebe `field` com os componentes registrados no `form-hook.ts`.
5. Na pagina, `useAppForm` cria a instancia do form com `defaultValues`, `validators` (Zod no `onChange` para validacao em tempo real) e `onSubmit` que chama a mutation.
6. O `<form>` HTML usa `e.preventDefault()` seguido de `form.handleSubmit()` no `onSubmit`, delegando a execucao ao TanStack Form.
7. `isPending` e passado para desabilitar todos os campos e o botao de submit durante a mutation.

---

## Regras e Convencoes

1. **`useAppForm` (nao `useForm`) para formularios de entidade** -- formularios de CRUD sempre utilizam `useAppForm` do `form-hook.ts`, que injeta os field components e contextos configurados. O `useForm` puro do TanStack Form e reservado apenas para formularios simples fora do CRUD (ex.: login).

2. **`defaultValues` obrigatorio e tipado** -- todo form deve ter `defaultValues` definido como constante exportada, tipada com o payload correspondente. Isso garante inferencia de tipos em todos os campos.

3. **`validators` com schema Zod no `onChange`** -- a validacao e feita via schema Zod passado em `validators: { onChange: Schema }`. Isso dispara validacao em tempo real conforme o usuario digita.

4. **`withForm` para definicao de campos** -- os campos do formulario sao encapsulados em um componente criado via `withForm`. Esse componente e reutilizavel e recebe o form tipado + props customizadas (como `isPending`).

5. **`form.AppField` para binding** -- cada campo e declarado via `form.AppField` com a prop `name` correspondente a uma chave do `defaultValues`. O callback recebe `field` com os componentes de campo registrados.

6. **`handleSubmit` no `onSubmit` do form HTML** -- o submit e sempre feito via `e.preventDefault()` seguido de `form.handleSubmit()`. Nunca chame a mutation diretamente no `onSubmit` do `<form>`.

7. **Props `isPending` para disable** -- durante o submit, o componente de campos recebe `isPending` para desabilitar todos os inputs e evitar submissoes duplicadas.

8. **Schema exportado junto com defaultValues** -- o arquivo de definicao do form exporta o schema, o type e os defaultValues. A pagina importa tudo de um unico lugar.

9. **Nomenclatura** -- o arquivo segue o padrao `-[action]-form.tsx` (com hifen inicial para agrupar no file explorer). O componente segue `[Action][Entity]FormFields` (ex.: `CreateUserFormFields`).

10. **Separacao de responsabilidade** -- o arquivo `-[action]-form.tsx` define campos e layout. A pagina `index.tsx` define `useAppForm`, validators, submit e renderizacao do botao.

---

## Checklist

- [ ] O setup global (`form-hook.ts`) esta configurado com `createFormHook`, `fieldContext`, `formContext` e os field components necessarios.
- [ ] O arquivo de definicao do form esta em `routes/_private/[entity]/[action]/-[action]-form.tsx`.
- [ ] O form exporta: schema Zod, type do payload e `defaultValues`.
- [ ] O componente de campos e criado via `withForm` com `defaultValues` e `props`.
- [ ] Cada campo usa `form.AppField` com `name` correspondente a uma chave do `defaultValues`.
- [ ] O callback do `form.AppField` usa `field.Field[Tipo]` (field components registrados).
- [ ] Na pagina, `useAppForm` recebe `defaultValues`, `validators: { onChange: Schema }` e `onSubmit`.
- [ ] O `onSubmit` do `<form>` HTML usa `e.preventDefault()` + `form.handleSubmit()`.
- [ ] A prop `isPending` e passada para o componente de campos e para o botao de submit.
- [ ] O botao de submit tem `type="submit"` e `disabled={mutation.isPending}`.

---

## Erros Comuns

| Erro | Causa | Correcao |
|------|-------|----------|
| Campos nao validam em tempo real | Validator configurado como `onSubmit` em vez de `onChange` | Usar `validators: { onChange: Schema }` no `useAppForm` |
| Tipos dos campos nao inferidos corretamente | `defaultValues` nao tipado ou ausente no `withForm` | Garantir que `defaultValues` e passado tanto no `withForm` quanto no `useAppForm`, tipado com o payload |
| `form.AppField` nao reconhece o campo | O `name` passado nao corresponde a nenhuma chave do `defaultValues` | Verificar que o `name` e uma chave valida do objeto `defaultValues` |
| Field components nao aparecem no `field` | O componente nao foi registrado no `fieldComponents` do `form-hook.ts` | Adicionar o componente em `fieldComponents` dentro do `createFormHook` |
| Submit duplicado durante loading | Faltou desabilitar campos e botao com `isPending` | Passar `isPending={mutation.isPending}` para o componente de campos e `disabled` no botao |
| Form submete sem validacao | `handleSubmit` nao foi chamado (mutation chamada diretamente) | Usar `form.handleSubmit()` no `onSubmit` do `<form>`, nunca chamar mutation diretamente |
| Uso de `useForm` em vez de `useAppForm` | Confusao entre o hook puro do TanStack e o hook customizado | Para formularios de CRUD, sempre usar `useAppForm` de `@/integrations/tanstack-form/form-hook` |
| Componente de campos nao recebe props customizadas | Props nao declaradas no `props` do `withForm` | Adicionar as props no objeto `props` do `withForm` (ex.: `props: { isPending: false }`) |

---

**Cross-references:** ver [021-skill-form-field.md](./021-skill-form-field.md), [024-skill-schema-zod.md](./024-skill-schema-zod.md), [018-skill-hook-mutation.md](./018-skill-hook-mutation.md).
