# Sistema de Formularios

Documentacao do sistema de formularios do frontend LowCodeJS, baseado no TanStack Form. O sistema utiliza `createFormHook` para criar hooks tipados com campos registrados, organizados em 4 categorias: campos base, campos ricos, configuracao de tabela e input de dados de registros.

---

## Visao Geral

O sistema de formularios e composto por:

| Arquivo                                         | Descricao                                      |
|-------------------------------------------------|-------------------------------------------------|
| `src/integrations/tanstack-form/form-hook.ts`   | Hook principal `useAppForm` e `withForm`        |
| `src/integrations/tanstack-form/form-context.ts` | Contextos do formulario e campo                |
| `src/integrations/tanstack-form/use-field-validation.ts` | Hook de validacao de campo            |
| `src/integrations/tanstack-form/fields/base.ts` | Campos basicos (14 componentes)                 |
| `src/integrations/tanstack-form/fields/rich.ts` | Campos pesados com lazy loading (2 componentes) |
| `src/integrations/tanstack-form/fields/table-config.ts` | Campos de configuracao de tabela (11 componentes) |
| `src/integrations/tanstack-form/fields/table-row.ts` | Campos de input de registros (10 componentes) |

---

## form-context.ts

**Arquivo:** `src/integrations/tanstack-form/form-context.ts`

Cria os contextos do TanStack Form utilizados por todos os campos.

```ts
import { createFormHookContexts } from '@tanstack/react-form';

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();
```

### Exports

| Export             | Descricao                                                    |
|--------------------|--------------------------------------------------------------|
| `fieldContext`     | Contexto React para dados do campo individual                |
| `formContext`      | Contexto React para dados do formulario                      |
| `useFieldContext`  | Hook para acessar o estado e metodos do campo atual          |
| `useFormContext`   | Hook para acessar o estado e metodos do formulario           |

O `useFieldContext<T>()` e usado dentro de cada componente de campo para acessar `field.state.value`, `field.handleChange`, `field.handleBlur`, etc.

---

## use-field-validation.ts

**Arquivo:** `src/integrations/tanstack-form/use-field-validation.ts`

Hook utilitario que encapsula a logica de validacao de um campo.

```ts
import { useFieldContext } from './form-context';

export function useFieldValidation<T = unknown>(): {
  field: ReturnType<typeof useFieldContext<T>>;
  isInvalid: boolean;
  errors: Array<string>;
} {
  const field = useFieldContext<T>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return {
    field,
    isInvalid,
    errors: field.state.meta.errors,
  };
}
```

### Retorno

| Propriedade | Tipo             | Descricao                                           |
|-------------|------------------|------------------------------------------------------|
| `field`     | `FieldContext<T>` | Instancia do contexto de campo do TanStack Form      |
| `isInvalid` | `boolean`        | `true` se o campo foi tocado E tem erros             |
| `errors`    | `Array<string>`  | Lista de mensagens de erro do campo                  |

### Logica de Validacao

O campo e considerado invalido quando:
- `isTouched` e `true` (o usuario interagiu com o campo)
- `isValid` e `false` (existe pelo menos uma regra de validacao que falhou)

---

## form-hook.ts (useAppForm e withForm)

**Arquivo:** `src/integrations/tanstack-form/form-hook.ts`

O arquivo principal que cria `useAppForm` e `withForm` registrando todos os campos disponiveis.

```ts
import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from './form-context';

// Importa todos os campos...

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    // 37 componentes de campo registrados
  },
  formComponents: {},
});
```

### useAppForm

Hook principal para criar formularios tipados. Aceita as mesmas opcoes do `useForm` do TanStack Form, mas com campos pre-registrados.

```tsx
const form = useAppForm({
  defaultValues: {
    name: '',
    email: '',
    password: '',
  },
  onSubmit: async ({ value }) => {
    await createUser(value);
  },
});
```

### withForm

HOC (Higher-Order Component) que conecta um componente ao formulario, injetando automaticamente a instancia do form.

```tsx
const MyFormContent = withForm({
  // Componente recebe `form` como prop automaticamente
  render: ({ form }) => (
    <div>
      <form.AppField name="name" children={(field) => <field.FieldText label="Nome" />} />
      <form.AppField name="email" children={(field) => <field.FieldEmail label="Email" />} />
    </div>
  ),
});
```

---

## Campos Registrados

### Campos Base (fields/base.ts)

Campos leves e frequentemente usados em formularios gerais.

| Componente                  | Descricao                                  | Tipo do Valor        |
|-----------------------------|--------------------------------------------|-----------------------|
| `FieldText`                 | Campo de texto simples                     | `string`             |
| `FieldTextarea`             | Area de texto multi-linha                  | `string`             |
| `FieldEmail`                | Campo de email                             | `string`             |
| `FieldPassword`             | Campo de senha com icone de visibilidade   | `string`             |
| `FieldUrl`                  | Campo de URL                               | `string`             |
| `FieldSwitch`               | Toggle switch booleano                     | `boolean`            |
| `FieldBooleanSwitch`        | Switch com label booleano                  | `boolean`            |
| `FieldFileUpload`           | Upload de arquivo                          | `File \| string`     |
| `FieldGroupCombobox`        | Combobox de selecao de grupo de usuario    | `string`             |
| `FieldMenuCombobox`         | Combobox de selecao de menu                | `string`             |
| `FieldMenuTypeSelect`       | Select de tipo de menu                     | `string`             |
| `FieldPermissionMultiSelect`| Multi-select de permissoes                 | `Array<string>`      |
| `FieldUserMultiSelect`      | Multi-select de usuarios                   | `Array<string>`      |
| `FieldTableMultiSelect`     | Multi-select de tabelas                    | `Array<string>`      |

#### Exemplo de FieldText

```tsx
// Implementacao do componente
export function FieldText({
  label,
  placeholder,
  disabled,
  icon,
  required,
}: FieldTextProps): React.JSX.Element {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <InputGroup>
        <InputGroupInput
          disabled={disabled}
          id={field.name}
          name={field.name}
          type="text"
          placeholder={placeholder}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
        />
        {icon && <InputGroupAddon>{icon}</InputGroupAddon>}
      </InputGroup>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
```

#### Uso no Formulario

```tsx
const form = useAppForm({
  defaultValues: { name: '', email: '' },
});

<form.AppField
  name="name"
  validators={{
    onChange: ({ value }) => !value ? 'Nome obrigatorio' : undefined,
  }}
  children={(field) => (
    <field.FieldText
      label="Nome"
      placeholder="Digite seu nome"
      required
    />
  )}
/>
```

---

### Campos Ricos (fields/rich.ts)

Campos pesados que utilizam lazy loading interno para evitar impacto no bundle principal.

| Componente        | Descricao                                           |
|-------------------|------------------------------------------------------|
| `FieldEditor`     | Editor rich text (TipTap)                            |
| `FieldCodeEditor` | Editor de codigo com syntax highlighting              |

Estes componentes sao carregados sob demanda (lazy) quando renderizados pela primeira vez.

---

### Campos de Configuracao de Tabela (fields/table-config.ts)

Campos especializados para formularios de criacao e edicao de tabelas.

| Componente                             | Descricao                                              |
|----------------------------------------|---------------------------------------------------------|
| `TableComboboxField`                   | Combobox de selecao de tabela                          |
| `TableVisibilitySelectField`           | Select de visibilidade (PUBLIC, PRIVATE, etc.)          |
| `TableCollaborationSelectField`        | Select de modo de colaboracao (OPEN, RESTRICTED)        |
| `TableStyleSelectField`               | Select de estilo visual (LIST, GALLERY, KANBAN, etc.)   |
| `TableFieldTypeSelect`                | Select de tipo de campo (TEXT_SHORT, DATE, etc.)        |
| `TableFieldFormatSelect`              | Select de formato do campo (ALPHA_NUMERIC, etc.)        |
| `TableFieldDropdownOptions`           | Editor de opcoes de dropdown                            |
| `TableFieldRelationshipTableSelect`   | Select de tabela para relacionamento                    |
| `TableFieldRelationshipFieldSelect`   | Select de campo para relacionamento                     |
| `TableFieldRelationshipOrderSelect`   | Select de ordenacao para relacionamento                 |
| `TableFieldCategoryTree`              | Editor de arvore de categorias                          |

---

### Campos de Input de Registros (fields/table-row.ts)

Campos especializados para formularios de criacao e edicao de registros (rows) de tabelas. Cada campo recebe a definicao `IField` como propriedade para adaptar seu comportamento.

| Componente                   | Descricao                                       |
|------------------------------|-------------------------------------------------|
| `TableRowTextField`          | Texto curto para registros                      |
| `TableRowTextareaField`      | Texto longo para registros                      |
| `TableRowRichTextField`      | Editor rich text para registros                 |
| `TableRowDropdownField`      | Dropdown para registros                         |
| `TableRowDateField`          | Seletor de data para registros                  |
| `TableRowFileField`          | Upload de arquivo para registros                |
| `TableRowRelationshipField`  | Campo de relacionamento para registros          |
| `TableRowCategoryField`      | Campo de categoria para registros               |
| `TableRowFieldGroupField`    | Campo de grupo de campos para registros         |
| `TableRowUserField`          | Campo de selecao de usuario para registros      |

#### Diferenca entre Campos Base e Table Row

Os campos base (`FieldText`, etc.) recebem props simples como `label` e `placeholder`. Os campos de table row (`TableRowTextField`, etc.) recebem um objeto `IField` que contem metadados da definicao do campo na tabela:

```tsx
// Campo base - props simples
<field.FieldText label="Nome" placeholder="Digite..." />

// Campo de table row - recebe definicao do campo
<field.TableRowTextField field={fieldDefinition} disabled={!canEdit} />
```

#### Exemplo de TableRowTextField

```tsx
interface TableRowTextFieldProps {
  field: IField;
  disabled?: boolean;
}

export function TableRowTextField({
  field,
  disabled,
}: TableRowTextFieldProps): React.JSX.Element {
  const formField = useFieldContext<string>();
  const isInvalid =
    formField.state.meta.isDirty && !formField.state.meta.isValid;
  const isRequired = field.required;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={formField.name}>
        {field.name}
        {isRequired && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <InputGroup data-disabled={disabled}>
        <InputGroupInput
          disabled={disabled}
          id={formField.name}
          name={formField.name}
          type="text"
          placeholder={`Digite ${field.name.toLowerCase()}`}
          value={formField.state.value || ''}
          onBlur={formField.handleBlur}
          onChange={(e) => formField.handleChange(e.target.value)}
          aria-invalid={isInvalid}
        />
        <InputGroupAddon>
          <TextIcon className="size-4" />
        </InputGroupAddon>
      </InputGroup>
      {isInvalid && <FieldError errors={formField.state.meta.errors} />}
    </Field>
  );
}
```

**Nota sobre validacao:** Nos campos de table row, a validacao usa `isDirty` em vez de `isTouched`, pois registros podem ser carregados com valores preexistentes.

---

## Padrao de Modo View/Edit

Os campos de tabela suportam um padrao de modo view (somente leitura) e edit (edicao), controlado pela prop `disabled`:

```tsx
function TableRowForm({ table, row, mode }: Props) {
  const { can } = useTablePermission(table);
  const isEditable = mode === 'edit' && can('UPDATE_ROW');

  const form = useAppForm({
    defaultValues: buildDefaultValues(table.fields, row),
    onSubmit: async ({ value }) => {
      updateRow.mutate({ slug: table.slug, rowId: row._id, data: value });
    },
  });

  return (
    <div>
      {table.fields.map((field) => (
        <form.AppField
          key={field._id}
          name={field.slug}
          children={(formField) => (
            <formField.TableRowTextField
              field={field}
              disabled={!isEditable}
            />
          )}
        />
      ))}

      {isEditable && (
        <Button onClick={form.handleSubmit}>Salvar</Button>
      )}
    </div>
  );
}
```

---

## Todos os Campos Registrados

Tabela completa dos 37 componentes de campo registrados no `form-hook.ts`:

| #  | Componente                             | Categoria      | Descricao                                |
|----|----------------------------------------|----------------|------------------------------------------|
| 1  | `FieldText`                            | Base           | Campo de texto                           |
| 2  | `FieldTextarea`                        | Base           | Area de texto                            |
| 3  | `FieldEmail`                           | Base           | Campo de email                           |
| 4  | `FieldPassword`                        | Base           | Campo de senha                           |
| 5  | `FieldUrl`                             | Base           | Campo de URL                             |
| 6  | `FieldSwitch`                          | Base           | Toggle switch                            |
| 7  | `FieldBooleanSwitch`                   | Base           | Switch booleano                          |
| 8  | `FieldEditor`                          | Rich           | Editor rich text (lazy)                  |
| 9  | `FieldCodeEditor`                      | Rich           | Editor de codigo (lazy)                  |
| 10 | `FieldFileUpload`                      | Base           | Upload de arquivo                        |
| 11 | `FieldGroupCombobox`                   | Base           | Combobox de grupo                        |
| 12 | `FieldMenuCombobox`                    | Base           | Combobox de menu                         |
| 13 | `FieldMenuTypeSelect`                  | Base           | Select tipo de menu                      |
| 14 | `FieldPermissionMultiSelect`           | Base           | Multi-select permissoes                  |
| 15 | `FieldUserMultiSelect`                 | Base           | Multi-select usuarios                    |
| 16 | `FieldTableMultiSelect`                | Base           | Multi-select tabelas                     |
| 17 | `TableComboboxField`                   | Table Config   | Combobox de tabela                       |
| 18 | `TableVisibilitySelectField`           | Table Config   | Select visibilidade                      |
| 19 | `TableCollaborationSelectField`        | Table Config   | Select colaboracao                       |
| 20 | `TableStyleSelectField`               | Table Config   | Select estilo visual                     |
| 21 | `TableFieldTypeSelect`                | Table Config   | Select tipo de campo                     |
| 22 | `TableFieldFormatSelect`              | Table Config   | Select formato                           |
| 23 | `TableFieldDropdownOptions`           | Table Config   | Editor opcoes dropdown                   |
| 24 | `TableFieldRelationshipTableSelect`   | Table Config   | Select tabela relacionamento             |
| 25 | `TableFieldRelationshipFieldSelect`   | Table Config   | Select campo relacionamento              |
| 26 | `TableFieldRelationshipOrderSelect`   | Table Config   | Select ordenacao relacionamento          |
| 27 | `TableFieldCategoryTree`              | Table Config   | Arvore de categorias                     |
| 28 | `TableRowTextField`                    | Table Row      | Texto para registro                      |
| 29 | `TableRowTextareaField`                | Table Row      | Textarea para registro                   |
| 30 | `TableRowRichTextField`                | Table Row      | Rich text para registro                  |
| 31 | `TableRowDropdownField`                | Table Row      | Dropdown para registro                   |
| 32 | `TableRowDateField`                    | Table Row      | Data para registro                       |
| 33 | `TableRowFileField`                    | Table Row      | Arquivo para registro                    |
| 34 | `TableRowRelationshipField`            | Table Row      | Relacionamento para registro             |
| 35 | `TableRowCategoryField`                | Table Row      | Categoria para registro                  |
| 36 | `TableRowFieldGroupField`              | Table Row      | Grupo de campos para registro            |
| 37 | `TableRowUserField`                    | Table Row      | Usuario para registro                    |

---

## Fluxo Completo de um Formulario

```
1. Componente chama useAppForm com defaultValues e onSubmit
2. form.AppField renderiza cada campo com name e validators
3. Dentro do AppField, o fieldContext fornece estado do campo
4. O componente de campo (ex: FieldText) usa useFieldContext
5. Usuario interage -> handleChange atualiza o estado
6. handleBlur marca o campo como tocado (isTouched)
7. Validators rodam e erros sao exibidos via FieldError
8. No submit, todos os validators rodam
9. Se valido, onSubmit recebe os valores tipados
```

---

## Estrutura de Arquivos

```
src/integrations/tanstack-form/
  form-hook.ts                    # useAppForm + withForm (37 campos registrados)
  form-context.ts                 # Contextos (fieldContext, formContext)
  use-field-validation.ts         # Hook de validacao
  fields/
    base.ts                       # 14 campos basicos
    rich.ts                       # 2 campos ricos (lazy loading)
    table-config.ts               # 11 campos de configuracao de tabela
    table-row.ts                  # 10 campos de input de registro

src/components/common/tanstack-form/
  field-text.tsx                  # Implementacao do FieldText
  field-email.tsx                 # Implementacao do FieldEmail
  field-password.tsx              # Implementacao do FieldPassword
  field-textarea.tsx              # Implementacao do FieldTextarea
  field-url.tsx                   # Implementacao do FieldUrl
  field-switch.tsx                # Implementacao do FieldSwitch
  field-boolean-switch.tsx        # Implementacao do FieldBooleanSwitch
  field-file-upload.tsx           # Implementacao do FieldFileUpload
  field-editor.tsx                # Implementacao do FieldEditor
  field-code-editor.tsx           # Implementacao do FieldCodeEditor
  field-group-combobox.tsx        # Implementacao do FieldGroupCombobox
  field-menu-combobox.tsx         # Implementacao do FieldMenuCombobox
  field-menu-type-select.tsx      # Implementacao do FieldMenuTypeSelect
  field-permission-multi-select.tsx # Implementacao do FieldPermissionMultiSelect
  field-user-multi-select.tsx     # Implementacao do FieldUserMultiSelect
  field-table-multi-select.tsx    # Implementacao do FieldTableMultiSelect
  table-combobox-field.tsx        # Implementacao do TableComboboxField
  table-visibility-select-field.tsx  # Implementacao do TableVisibilitySelectField
  table-collaboration-select-field.tsx # Implementacao do TableCollaborationSelectField
  table-style-select-field.tsx    # Implementacao do TableStyleSelectField
  table-field-type-select.tsx     # Implementacao do TableFieldTypeSelect
  table-field-format-select.tsx   # Implementacao do TableFieldFormatSelect
  table-field-dropdown-options.tsx # Implementacao do TableFieldDropdownOptions
  table-field-relationship-table-select.tsx # Select tabela relacionamento
  table-field-relationship-field-select.tsx # Select campo relacionamento
  table-field-relationship-order-select.tsx # Select ordenacao relacionamento
  table-field-category-tree.tsx   # Arvore de categorias
  table-row-text-field.tsx        # Implementacao do TableRowTextField
  table-row-textarea-field.tsx    # Implementacao do TableRowTextareaField
  table-row-rich-text-field.tsx   # Implementacao do TableRowRichTextField
  table-row-dropdown-field.tsx    # Implementacao do TableRowDropdownField
  table-row-date-field.tsx        # Implementacao do TableRowDateField
  table-row-file-field.tsx        # Implementacao do TableRowFileField
  table-row-relationship-field.tsx # Implementacao do TableRowRelationshipField
  table-row-category-field.tsx    # Implementacao do TableRowCategoryField
  table-row-field-group-field.tsx # Implementacao do TableRowFieldGroupField
  table-row-user-field.tsx        # Implementacao do TableRowUserField
  filtered-table-combobox-field.tsx # Combobox de tabela com filtro
```
