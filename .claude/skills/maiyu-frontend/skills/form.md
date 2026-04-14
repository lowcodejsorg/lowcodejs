---
name: maiyu:frontend-form
description: |
  Generates form components and field components for frontend projects.
  Use when: user asks to create a form, edit form, form page, field component,
  useAppForm, withForm, or mentions "form" for data input.
  Supports: TanStack Form, React Hook Form, Zod validation.
  Frameworks: TanStack Start, React (Vite), Next.js, Next.js App Router, Remix.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **Form lib**: `@tanstack/react-form` | `react-hook-form` | `formik`
   - **Validation**: `zod` | `yup` | `valibot`
   - **Framework**: `@tanstack/react-start` | `next` | `@remix-run/react` | `react`
3. Scan existing forms to detect:
   - Form setup file (`integrations/tanstack-form/form-hook.ts`)
   - Field components location (`components/common/tanstack-form/`)
   - Error handling pattern (`handleApiError`, `createFieldErrorSetter`)
   - UI components used (Field, FieldLabel, InputGroup, FieldError)
4. If form lib not detected, ask user

## Conventions

### Naming
- Form field components: `field-{type}.tsx` (e.g., `field-text.tsx`, `field-email.tsx`)
- Form sections with `withForm`: `{Entity}{Action}FormFields`
- Placement: `src/components/common/tanstack-form/`

### Rules
- Use `useFieldContext<T>()` for field state (not prop drilling)
- Validate with: `field.state.meta.isTouched && !field.state.meta.isValid`
- Render pattern: `<Field data-invalid>` → `<FieldLabel>` → `<InputGroup>` → `<FieldError>`
- Zod schema for both `onChange` and `onSubmit` validation
- Error handling: `handleApiError()` with `onFieldErrors` + `createFieldErrorSetter()`
- No ternary operators — use `{condition && <element>}` or if/else
- No `any` type — use concrete types, `unknown`, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- Explicit return types on all functions and components
- Multiple conditions use const mapper (`Record` lookup) instead of switch/if-else chains
- Named exports only

## Templates

### TanStack Form (Reference Implementation)

**Field Component — FieldText:**
```tsx
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';

interface FieldTextProps {
  label: string;
  placeholder?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  required?: boolean;
}

export function FieldText({
  label,
  placeholder,
  disabled,
  icon,
  required,
}: FieldTextProps): React.JSX.Element {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const errorId = `${field.name}-error`;
  let describedBy: string | undefined;
  if (isInvalid) {
    describedBy = errorId;
  }

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
          aria-required={required || undefined}
          aria-describedby={describedBy}
        />
        {icon && <InputGroupAddon>{icon}</InputGroupAddon>}
      </InputGroup>
      {isInvalid && (
        <FieldError id={errorId} errors={field.state.meta.errors} />
      )}
    </Field>
  );
}
```

**Field Component — FieldSwitch (boolean):**
```tsx
import { FieldLabel } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';

interface FieldBooleanSwitchProps {
  label: string;
  description?: string;
  disabled?: boolean;
}

export function FieldBooleanSwitch({
  label,
  description,
  disabled,
}: FieldBooleanSwitchProps): React.JSX.Element {
  const field = useFieldContext<boolean>();

  return (
    <div className="flex flex-row items-center justify-between rounded-lg border p-3">
      <div className="space-y-0.5">
        <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch
        id={field.name}
        aria-label={label}
        disabled={disabled}
        checked={field.state.value}
        onCheckedChange={(checked) => field.handleChange(checked)}
      />
    </div>
  );
}
```

**Form Hook Setup — `form-hook.ts`:**
```typescript
import { createFormHook } from '@tanstack/react-form';

import { FieldText } from '@/components/common/tanstack-form/field-text';
import { FieldEmail } from '@/components/common/tanstack-form/field-email';
import { FieldPassword } from '@/components/common/tanstack-form/field-password';
import { fieldContext, formContext } from './form-context';

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    FieldText,
    FieldEmail,
    FieldPassword,
    // Add more field components as needed
  },
  formComponents: {},
});
```

**Form Context — `form-context.ts`:**
```typescript
import { createFormHookContexts } from '@tanstack/react-form';

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();
```

**Complete Form Usage:**
```tsx
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { handleApiError } from '@/lib/handle-api-error';
import { createFieldErrorSetter } from '@/lib/form-utils';
import { UserCreateSchema } from '@/lib/schemas';

import { useCreateUser } from '@/hooks/tanstack-query/use-user-create';

export function UserCreateForm(): React.JSX.Element {
  const mutation = useCreateUser({
    onSuccess(data) {
      // Navigate or show success toast
    },
    onError(error) {
      handleApiError(error, {
        context: 'Error creating user',
        onFieldErrors(errors) {
          const setFieldError = createFieldErrorSetter(form);
          for (const [field, message] of Object.entries(errors)) {
            setFieldError(field, message);
          }
        },
      });
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
    validators: {
      onChange: UserCreateSchema,
      onSubmit: UserCreateSchema,
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.AppField
        name="name"
        children={(field) => <field.FieldText label="Name" required />}
      />
      <form.AppField
        name="email"
        children={(field) => <field.FieldEmail label="Email" required />}
      />
      <form.AppField
        name="password"
        children={(field) => <field.FieldPassword label="Password" required />}
      />
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending && 'Creating...'}
        {!mutation.isPending && 'Create'}
      </button>
    </form>
  );
}
```

**withForm HOC Pattern:**
```tsx
import { withForm } from '@/integrations/tanstack-form/form-hook';
import { useStore } from '@tanstack/react-store';

export const EntityFormFields = withForm({
  defaultValues: { name: '', type: '' },
  props: { isPending: false },
  render: function Render({ form, isPending }) {
    const type = useStore(form.store, (state) => state.values.type);

    return (
      <div className="space-y-4">
        <form.AppField
          name="name"
          children={(field) => <field.FieldText label="Name" required />}
        />
        <form.AppField
          name="type"
          children={(field) => <field.FieldText label="Type" required />}
        />
        {type === 'advanced' && (
          <form.AppField
            name="config"
            children={(field) => <field.FieldTextarea label="Config" />}
          />
        )}
      </div>
    );
  },
});
```

### React Hook Form Alternative

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { UserCreateSchema, type UserCreatePayload } from '@/lib/schemas';

export function UserCreateForm(): React.JSX.Element {
  const { register, handleSubmit, formState: { errors } } = useForm<UserCreatePayload>({
    resolver: zodResolver(UserCreateSchema),
  });

  const onSubmit = handleSubmit(async (data) => {
    await mutation.mutateAsync(data);
  });

  return (
    <form onSubmit={onSubmit}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      <input {...register('email')} type="email" />
      {errors.email && <span>{errors.email.message}</span>}
      <button type="submit">Create</button>
    </form>
  );
}
```

### Error Handling Utilities

```typescript
// lib/form-utils.ts
interface FieldMeta {
  isTouched: boolean;
  errors: Array<{ message: string }>;
  errorMap: Record<string, { message: string }>;
}

interface FormWithFieldMeta {
  setFieldMeta: (field: string, updater: (prev: FieldMeta) => FieldMeta) => void;
}

export function createFieldErrorSetter(form: FormWithFieldMeta): (field: string, message: string) => void {
  return (field: string, message: string): void => {
    form.setFieldMeta(field, (prev: FieldMeta) => ({
      ...prev,
      isTouched: true,
      errors: [{ message }],
      errorMap: { onSubmit: { message } },
    }));
  };
}
```

### Next.js App Router Forms

**With Server Actions:**
```tsx
'use client'
import { useActionState } from 'react'

function {Entity}Form({ action }: { action: (prev: State, formData: FormData) => Promise<State> }) {
  const [state, formAction, isPending] = useActionState(action, { errors: {} })

  return (
    <form action={formAction}>
      <input name="name" defaultValue={state.data?.name} />
      {state.errors?.name && <p className="text-destructive text-sm">{state.errors.name}</p>}
      <button type="submit" disabled={isPending}>
        {isPending && 'Salvando...'}
        {!isPending && 'Salvar'}
      </button>
    </form>
  )
}
```

## Checklist

- [ ] Field uses `useFieldContext<T>()` for state
- [ ] Invalid check: `isTouched && !isValid`
- [ ] Render: Field → FieldLabel → InputGroup → FieldError
- [ ] Zod validation on both onChange and onSubmit
- [ ] `handleApiError` with `onFieldErrors` for server-side errors
- [ ] `createFieldErrorSetter` maps server errors to form fields
- [ ] aria attributes for accessibility
- [ ] No ternary operators
