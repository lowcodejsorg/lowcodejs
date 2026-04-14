---
name: maiyu:frontend-dynamic-form
description: |
  Generates dynamic form components from field definitions at runtime.
  Use when: user asks to create dynamic form, form builder, schema-driven form,
  field definition form, configurable form, or mentions "dynamic form" for runtime-generated forms.
  Supports: TanStack Form, React Hook Form. Zod dynamic validation.
  Frameworks: TanStack Start, React (Vite), Next.js, Remix.
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
   - **DnD**: `@dnd-kit/core` | `@dnd-kit/sortable`
3. Scan existing code to detect:
   - Form setup file (`integrations/tanstack-form/form-hook.ts`)
   - Field components location (`components/common/tanstack-form/`)
   - Dynamic table or field management patterns already in use
   - UI components used (Field, FieldLabel, InputGroup, FieldError, Tabs, Accordion)
4. If form lib not detected, ask user

## Conventions

### Naming
- Dynamic form component: `dynamic-form.tsx`
- Field renderer: `field-renderer.tsx`
- Field definition types: `field-definition.ts`
- Dynamic Zod builder: `dynamic-schema-builder.ts`
- Field group renderer: `field-group-renderer.tsx`
- Conditional field wrapper: `conditional-field.tsx`
- Placement: `src/components/common/dynamic-form/`

### Rules
- No ternary operators — use `{condition && <element>}`, if/else, early return, or const mapper
- No `any` type — use concrete types, `unknown`, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- Explicit return types on all functions and components
- Multiple conditions use const mapper (`Record` lookup) instead of switch/if-else chains
- Named exports only (no default exports)
- Field type to component mapping via `Record<string, React.ComponentType>`
- Zod for dynamic validation schema construction
- Use `useFieldContext<T>()` for field state (not prop drilling)
- `data-slot` attributes on composable parts
- Tailwind CSS for styling (no inline styles)

## Templates

### Field Definition Types

```typescript
// field-definition.ts

interface IFieldOption {
  label: string;
  value: string;
  color?: string;
}

interface IConditionalRule {
  dependsOn: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_empty' | 'empty';
  value?: unknown;
}

interface IFieldDefinition {
  slug: string;
  name: string;
  type: string; // e.g., 'TEXT_SHORT', 'TEXT_LONG', 'DATE', 'DROPDOWN', 'FILE', etc.
  format?: string; // e.g., 'EMAIL', 'URL', 'PHONE', 'CPF', 'CNPJ', etc.
  required?: boolean;
  options?: IFieldOption[]; // for DROPDOWN, RADIO, CHECKBOX_GROUP
  showInForm?: boolean;
  showInList?: boolean;
  showInDetail?: boolean;
  widthInForm?: 'full' | 'half' | 'third';
  group?: string; // group name for sectioning
  order?: number;
  defaultValue?: unknown;
  placeholder?: string;
  description?: string;
  disabled?: boolean;
  conditionalRules?: IConditionalRule[];
}

type FieldType =
  | 'TEXT_SHORT'
  | 'TEXT_LONG'
  | 'NUMBER'
  | 'DATE'
  | 'DATETIME'
  | 'DROPDOWN'
  | 'CHECKBOX'
  | 'CHECKBOX_GROUP'
  | 'RADIO'
  | 'FILE'
  | 'IMAGE'
  | 'SWITCH'
  | 'COLOR'
  | 'RATING'
  | 'RICH_TEXT';

export type { FieldType, IConditionalRule, IFieldDefinition, IFieldOption };
```

### Field Type to Component Map

```tsx
// field-component-map.ts
import type { IFieldDefinition } from './field-definition';

import { FieldCheckbox } from './fields/field-checkbox';
import { FieldCheckboxGroup } from './fields/field-checkbox-group';
import { FieldColor } from './fields/field-color';
import { FieldDate } from './fields/field-date';
import { FieldDateTime } from './fields/field-datetime';
import { FieldDropdown } from './fields/field-dropdown';
import { FieldFile } from './fields/field-file';
import { FieldImage } from './fields/field-image';
import { FieldNumber } from './fields/field-number';
import { FieldRadio } from './fields/field-radio';
import { FieldRating } from './fields/field-rating';
import { FieldRichText } from './fields/field-rich-text';
import { FieldSwitch } from './fields/field-switch';
import { FieldTextLong } from './fields/field-text-long';
import { FieldTextShort } from './fields/field-text-short';

interface DynamicFieldProps {
  definition: IFieldDefinition;
}

type FieldComponent = React.ComponentType<DynamicFieldProps>;

const FIELD_COMPONENT_MAP: Record<string, FieldComponent> = {
  TEXT_SHORT: FieldTextShort,
  TEXT_LONG: FieldTextLong,
  NUMBER: FieldNumber,
  DATE: FieldDate,
  DATETIME: FieldDateTime,
  DROPDOWN: FieldDropdown,
  CHECKBOX: FieldCheckbox,
  CHECKBOX_GROUP: FieldCheckboxGroup,
  RADIO: FieldRadio,
  FILE: FieldFile,
  IMAGE: FieldImage,
  SWITCH: FieldSwitch,
  COLOR: FieldColor,
  RATING: FieldRating,
  RICH_TEXT: FieldRichText,
};

const FORMAT_COMPONENT_MAP: Record<string, FieldComponent> = {
  EMAIL: FieldTextShort,
  URL: FieldTextShort,
  PHONE: FieldTextShort,
  CPF: FieldTextShort,
  CNPJ: FieldTextShort,
};

export function getFieldComponent(definition: IFieldDefinition): FieldComponent | null {
  if (definition.format) {
    const formatComponent = FORMAT_COMPONENT_MAP[definition.format];
    if (formatComponent) {
      return formatComponent;
    }
  }

  return FIELD_COMPONENT_MAP[definition.type] ?? null;
}

export { FIELD_COMPONENT_MAP, FORMAT_COMPONENT_MAP };
export type { DynamicFieldProps, FieldComponent };
```

### Dynamic Zod Schema Builder

```typescript
// dynamic-schema-builder.ts
import { z } from 'zod';

import type { IFieldDefinition } from './field-definition';

function buildFieldSchema(definition: IFieldDefinition): z.ZodTypeAny {
  let schema: z.ZodTypeAny;

  switch (definition.type) {
    case 'TEXT_SHORT':
    case 'TEXT_LONG':
    case 'RICH_TEXT': {
      schema = z.string();
      break;
    }
    case 'NUMBER':
    case 'RATING': {
      schema = z.coerce.number();
      break;
    }
    case 'DATE':
    case 'DATETIME': {
      schema = z.coerce.date();
      break;
    }
    case 'DROPDOWN':
    case 'RADIO':
    case 'COLOR': {
      schema = z.string();
      break;
    }
    case 'CHECKBOX':
    case 'SWITCH': {
      schema = z.boolean();
      break;
    }
    case 'CHECKBOX_GROUP': {
      schema = z.array(z.string());
      break;
    }
    case 'FILE':
    case 'IMAGE': {
      schema = z.unknown();
      break;
    }
    default: {
      schema = z.unknown();
      break;
    }
  }

  if (definition.format) {
    schema = applyFormatValidation(schema, definition.format);
  }

  if (!definition.required) {
    schema = schema.optional();
  }

  return schema;
}

function applyFormatValidation(schema: z.ZodTypeAny, format: string): z.ZodTypeAny {
  if (!(schema instanceof z.ZodString)) {
    return schema;
  }

  switch (format) {
    case 'EMAIL': {
      return schema.email('Invalid email address');
    }
    case 'URL': {
      return schema.url('Invalid URL');
    }
    case 'PHONE': {
      return schema.regex(/^\+?[\d\s()-]{7,15}$/, 'Invalid phone number');
    }
    case 'CPF': {
      return schema.regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'Invalid CPF');
    }
    case 'CNPJ': {
      return schema.regex(
        /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
        'Invalid CNPJ',
      );
    }
    default: {
      return schema;
    }
  }
}

export function buildDynamicSchema(
  fields: IFieldDefinition[],
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    if (!field.showInForm) {
      continue;
    }
    shape[field.slug] = buildFieldSchema(field);
  }

  return z.object(shape);
}
```

### Dynamic Form Builder Component

```tsx
// dynamic-form.tsx
import { useAppForm } from '@/integrations/tanstack-form/form-hook';

import type { IFieldDefinition } from './field-definition';
import { buildDynamicSchema } from './dynamic-schema-builder';
import { FieldGroupRenderer } from './field-group-renderer';
import { FieldRenderer } from './field-renderer';
import { getWidthClass } from './width-config';

interface DynamicFormProps {
  fields: IFieldDefinition[];
  defaultValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  isPending?: boolean;
  submitLabel?: string;
}

function buildDefaultValues(fields: IFieldDefinition[]): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};

  for (const field of fields) {
    if (!field.showInForm) {
      continue;
    }
    if (field.defaultValue !== undefined) {
      defaults[field.slug] = field.defaultValue;
      continue;
    }

    switch (field.type) {
      case 'CHECKBOX':
      case 'SWITCH': {
        defaults[field.slug] = false;
        break;
      }
      case 'CHECKBOX_GROUP': {
        defaults[field.slug] = [];
        break;
      }
      case 'NUMBER':
      case 'RATING': {
        defaults[field.slug] = 0;
        break;
      }
      default: {
        defaults[field.slug] = '';
        break;
      }
    }
  }

  return defaults;
}

function getFormFields(fields: IFieldDefinition[]): IFieldDefinition[] {
  return fields
    .filter((f) => f.showInForm !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function groupFields(
  fields: IFieldDefinition[],
): Map<string, IFieldDefinition[]> {
  const groups = new Map<string, IFieldDefinition[]>();

  for (const field of fields) {
    const groupName = field.group ?? '__default__';
    const existing = groups.get(groupName);
    if (existing) {
      existing.push(field);
    } else {
      groups.set(groupName, [field]);
    }
  }

  return groups;
}

export function DynamicForm({
  fields,
  defaultValues: externalDefaults,
  onSubmit,
  isPending = false,
  submitLabel = 'Submit',
}: DynamicFormProps): React.JSX.Element {
  const formFields = getFormFields(fields);
  const schema = buildDynamicSchema(formFields);
  const computedDefaults = buildDefaultValues(formFields);
  const mergedDefaults = { ...computedDefaults, ...externalDefaults };
  const grouped = groupFields(formFields);
  const hasGroups = grouped.size > 1 || !grouped.has('__default__');

  const form = useAppForm({
    defaultValues: mergedDefaults,
    validators: {
      onChange: schema,
      onSubmit: schema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  return (
    <form
      data-slot="dynamic-form"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      {hasGroups && (
        <FieldGroupRenderer groups={grouped} form={form} />
      )}
      {!hasGroups && (
        <div className="grid grid-cols-12 gap-4">
          {formFields.map((fieldDef) => (
            <div
              key={fieldDef.slug}
              className={getWidthClass(fieldDef.widthInForm)}
            >
              <FieldRenderer definition={fieldDef} form={form} />
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending && 'Saving...'}
          {!isPending && submitLabel}
        </button>
      </div>
    </form>
  );
}
```

### Field Renderer Component

```tsx
// field-renderer.tsx
import type { IFieldDefinition } from './field-definition';
import { ConditionalField } from './conditional-field';
import { getFieldComponent } from './field-component-map';

interface FieldRendererProps {
  definition: IFieldDefinition;
  form: ReturnType<typeof useAppForm>;
}

function FieldRendererInner({
  definition,
  form,
}: FieldRendererProps): React.JSX.Element | null {
  const Component = getFieldComponent(definition);

  if (!Component) {
    if (process.env.NODE_ENV === 'development') {
      return (
        <div className="rounded border border-dashed border-yellow-500 p-2 text-xs text-yellow-600">
          Unknown field type: {definition.type}
        </div>
      );
    }
    return null;
  }

  return (
    <form.AppField
      name={definition.slug}
      children={() => <Component definition={definition} />}
    />
  );
}

export function FieldRenderer({
  definition,
  form,
}: FieldRendererProps): React.JSX.Element | null {
  const hasConditions =
    definition.conditionalRules && definition.conditionalRules.length > 0;

  if (!hasConditions) {
    return <FieldRendererInner definition={definition} form={form} />;
  }

  return (
    <ConditionalField definition={definition} form={form}>
      <FieldRendererInner definition={definition} form={form} />
    </ConditionalField>
  );
}
```

### Field Groups Renderer

```tsx
// field-group-renderer.tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import type { IFieldDefinition } from './field-definition';
import { FieldRenderer } from './field-renderer';
import { getWidthClass } from './width-config';

interface FieldGroupRendererProps {
  groups: Map<string, IFieldDefinition[]>;
  form: ReturnType<typeof useAppForm>;
}

export function FieldGroupRenderer({
  groups,
  form,
}: FieldGroupRendererProps): React.JSX.Element {
  const groupEntries = Array.from(groups.entries());
  const allGroupNames = groupEntries
    .filter(([name]) => name !== '__default__')
    .map(([name]) => name);

  const defaultGroup = groups.get('__default__');

  return (
    <div data-slot="field-groups" className="space-y-6">
      {defaultGroup && (
        <div className="grid grid-cols-12 gap-4">
          {defaultGroup.map((fieldDef) => (
            <div
              key={fieldDef.slug}
              className={getWidthClass(fieldDef.widthInForm)}
            >
              <FieldRenderer definition={fieldDef} form={form} />
            </div>
          ))}
        </div>
      )}

      <Accordion type="multiple" defaultValue={allGroupNames}>
        {groupEntries.map(([groupName, groupFields]) => {
          if (groupName === '__default__') {
            return null;
          }

          return (
            <AccordionItem key={groupName} value={groupName}>
              <AccordionTrigger className="text-sm font-semibold">
                {groupName}
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-12 gap-4 pt-2">
                  {groupFields.map((fieldDef) => (
                    <div
                      key={fieldDef.slug}
                      className={getWidthClass(fieldDef.widthInForm)}
                    >
                      <FieldRenderer definition={fieldDef} form={form} />
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
```

### Conditional Fields

```tsx
// conditional-field.tsx
import { useStore } from '@tanstack/react-store';

import type { IConditionalRule, IFieldDefinition } from './field-definition';

interface ConditionalFieldProps {
  definition: IFieldDefinition;
  form: ReturnType<typeof useAppForm>;
  children: React.ReactNode;
}

function evaluateRule(rule: IConditionalRule, dependencyValue: unknown): boolean {
  switch (rule.operator) {
    case 'equals': {
      return dependencyValue === rule.value;
    }
    case 'not_equals': {
      return dependencyValue !== rule.value;
    }
    case 'contains': {
      if (typeof dependencyValue === 'string') {
        return dependencyValue.includes(String(rule.value));
      }
      if (Array.isArray(dependencyValue)) {
        return dependencyValue.includes(rule.value);
      }
      return false;
    }
    case 'not_empty': {
      if (dependencyValue === null || dependencyValue === undefined) {
        return false;
      }
      if (typeof dependencyValue === 'string') {
        return dependencyValue.trim().length > 0;
      }
      return true;
    }
    case 'empty': {
      if (dependencyValue === null || dependencyValue === undefined) {
        return true;
      }
      if (typeof dependencyValue === 'string') {
        return dependencyValue.trim().length === 0;
      }
      return false;
    }
    default: {
      return true;
    }
  }
}

export function ConditionalField({
  definition,
  form,
  children,
}: ConditionalFieldProps): React.JSX.Element | null {
  const rules = definition.conditionalRules ?? [];

  const formValues = useStore(form.store, (state: { values: Record<string, unknown> }) => state.values);

  const allRulesMet = rules.every((rule) => {
    const dependencyValue = formValues[rule.dependsOn];
    return evaluateRule(rule, dependencyValue);
  });

  if (!allRulesMet) {
    return null;
  }

  return <>{children}</>;
}
```

### Width Configuration

```typescript
// width-config.ts

const WIDTH_CLASS_MAP: Record<string, string> = {
  full: 'col-span-12',
  half: 'col-span-12 sm:col-span-6',
  third: 'col-span-12 sm:col-span-4',
};

export function getWidthClass(width?: string): string {
  if (!width) {
    return WIDTH_CLASS_MAP.full;
  }

  return WIDTH_CLASS_MAP[width] ?? WIDTH_CLASS_MAP.full;
}
```

### Field Ordering with Drag-and-Drop

```tsx
// field-order-manager.tsx
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useState } from 'react';

import type { IFieldDefinition } from './field-definition';

interface FieldOrderManagerProps {
  fields: IFieldDefinition[];
  onReorder: (reorderedFields: IFieldDefinition[]) => void;
}

interface SortableFieldItemProps {
  field: IFieldDefinition;
}

function SortableFieldItem({ field }: SortableFieldItemProps): React.JSX.Element {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.slug });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 rounded-md border bg-background p-3',
        isDragging && 'opacity-50',
      )}
    >
      <button
        type="button"
        className="cursor-grab text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex flex-1 flex-col">
        <span className="text-sm font-medium">{field.name}</span>
        <span className="text-xs text-muted-foreground">
          {field.type}
          {field.format && ` (${field.format})`}
        </span>
      </div>
      <span className="text-xs text-muted-foreground">
        {field.widthInForm ?? 'full'}
      </span>
    </div>
  );
}

export function FieldOrderManager({
  fields: initialFields,
  onReorder,
}: FieldOrderManagerProps): React.JSX.Element {
  const [fields, setFields] = useState(initialFields);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;

    if (!over) {
      return;
    }
    if (active.id === over.id) {
      return;
    }

    const oldIndex = fields.findIndex((f) => f.slug === active.id);
    const newIndex = fields.findIndex((f) => f.slug === over.id);
    const reordered = arrayMove(fields, oldIndex, newIndex).map(
      (field, index) => ({
        ...field,
        order: index,
      }),
    );

    setFields(reordered);
    onReorder(reordered);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={fields.map((f) => f.slug)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {fields.map((field) => (
            <SortableFieldItem key={field.slug} field={field} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
```

### Example Field Component (TEXT_SHORT)

```tsx
// fields/field-text-short.tsx
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupInput,
} from '@/components/ui/input-group';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';

import type { DynamicFieldProps } from '../field-component-map';

const FORMAT_INPUT_TYPE_MAP: Record<string, string> = {
  EMAIL: 'email',
} as const;

function getInputType(format?: string): string {
  if (!format) return 'text';
  return FORMAT_INPUT_TYPE_MAP[format] ?? 'text';
}

export function FieldTextShort({
  definition,
}: DynamicFieldProps): React.JSX.Element {
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
        {definition.name}
        {definition.required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      {definition.description && (
        <p className="text-xs text-muted-foreground">{definition.description}</p>
      )}
      <InputGroup>
        <InputGroupInput
          disabled={definition.disabled}
          id={field.name}
          name={field.name}
          type={getInputType(definition.format)}
          placeholder={definition.placeholder}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
          aria-required={definition.required || undefined}
          aria-describedby={describedBy}
        />
      </InputGroup>
      {isInvalid && (
        <FieldError id={errorId} errors={field.state.meta.errors} />
      )}
    </Field>
  );
}
```

### Example Field Component (DROPDOWN)

```tsx
// fields/field-dropdown.tsx
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';

import type { DynamicFieldProps } from '../field-component-map';

export function FieldDropdown({
  definition,
}: DynamicFieldProps): React.JSX.Element {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const errorId = `${field.name}-error`;
  let describedBy: string | undefined;
  if (isInvalid) {
    describedBy = errorId;
  }
  const options = definition.options ?? [];

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>
        {definition.name}
        {definition.required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      {definition.description && (
        <p className="text-xs text-muted-foreground">{definition.description}</p>
      )}
      <Select
        value={field.state.value}
        onValueChange={(value) => field.handleChange(value)}
        disabled={definition.disabled}
      >
        <SelectTrigger
          id={field.name}
          aria-invalid={isInvalid}
          aria-required={definition.required || undefined}
          aria-describedby={describedBy}
        >
          <SelectValue placeholder={definition.placeholder ?? 'Select...'} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.color && (
                <span
                  className="mr-2 inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: option.color }}
                />
              )}
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isInvalid && (
        <FieldError id={errorId} errors={field.state.meta.errors} />
      )}
    </Field>
  );
}
```

### Complete Usage Example

```tsx
// pages/{entity}/create.tsx
import { DynamicForm } from '@/components/common/dynamic-form/dynamic-form';
import type { IFieldDefinition } from '@/components/common/dynamic-form/field-definition';

import { useCreate{Entity} } from '@/hooks/tanstack-query/use-{entity}-create';

const {ENTITY}_FIELDS: IFieldDefinition[] = [
  {
    slug: 'name',
    name: 'Name',
    type: 'TEXT_SHORT',
    required: true,
    showInForm: true,
    widthInForm: 'half',
    order: 0,
    group: 'General',
  },
  {
    slug: 'email',
    name: 'Email',
    type: 'TEXT_SHORT',
    format: 'EMAIL',
    required: true,
    showInForm: true,
    widthInForm: 'half',
    order: 1,
    group: 'General',
  },
  {
    slug: 'bio',
    name: 'Biography',
    type: 'TEXT_LONG',
    showInForm: true,
    widthInForm: 'full',
    order: 2,
    group: 'Profile',
  },
  {
    slug: 'role',
    name: 'Role',
    type: 'DROPDOWN',
    required: true,
    showInForm: true,
    widthInForm: 'third',
    order: 3,
    group: 'Profile',
    options: [
      { label: 'Admin', value: 'admin', color: '#ef4444' },
      { label: 'Editor', value: 'editor', color: '#3b82f6' },
      { label: 'Viewer', value: 'viewer', color: '#22c55e' },
    ],
  },
  {
    slug: 'birthDate',
    name: 'Birth Date',
    type: 'DATE',
    showInForm: true,
    widthInForm: 'third',
    order: 4,
    group: 'Profile',
  },
  {
    slug: 'active',
    name: 'Active',
    type: 'SWITCH',
    showInForm: true,
    widthInForm: 'third',
    order: 5,
    group: 'Profile',
    defaultValue: true,
  },
  {
    slug: 'notes',
    name: 'Admin Notes',
    type: 'TEXT_LONG',
    showInForm: true,
    widthInForm: 'full',
    order: 6,
    group: 'Profile',
    conditionalRules: [
      { dependsOn: 'role', operator: 'equals', value: 'admin' },
    ],
  },
];

export function {Entity}CreatePage(): React.JSX.Element {
  const mutation = useCreate{Entity}();

  async function handleSubmit(values: Record<string, unknown>): Promise<void> {
    await mutation.mutateAsync(values);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Create {Entity}</h1>
      <DynamicForm
        fields={{ENTITY}_FIELDS}
        onSubmit={handleSubmit}
        isPending={mutation.isPending}
        submitLabel="Create {Entity}"
      />
    </div>
  );
}
```

## Checklist

When generating dynamic forms:
- [ ] `IFieldDefinition` interface defined with all required properties
- [ ] Field type to component map using `Record<string, React.ComponentType>`
- [ ] Dynamic Zod schema builder with switch-case per field type
- [ ] Format validation applied (EMAIL, URL, PHONE, CPF, CNPJ)
- [ ] Fields filtered by `showInForm`
- [ ] Fields sorted by `order`
- [ ] Fields grouped by `group` (rendered in accordion or tabs)
- [ ] Width handled via CSS grid classes (full/half/third)
- [ ] Conditional fields evaluated with `useStore` from form state
- [ ] Each field component uses `useFieldContext<T>()` for state
- [ ] Invalid check: `isTouched && !isValid` on every field
- [ ] Render pattern: Field, FieldLabel, InputGroup, FieldError
- [ ] Zod validation on both `onChange` and `onSubmit`
- [ ] No ternary operators anywhere
- [ ] Named exports only
- [ ] Explicit return types on all functions
- [ ] `data-slot` attributes on composable parts
- [ ] Aria attributes for accessibility on every field
- [ ] Drag-and-drop reorder uses `@dnd-kit/core` and `@dnd-kit/sortable`
- [ ] Default values computed from field definitions
