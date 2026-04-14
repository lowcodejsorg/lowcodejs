---
name: maiyu:frontend-field-mask
description: |
  Generates input mask configurations for formatted fields.
  Use when: user asks to create input masks, field formatting, CPF/CNPJ mask,
  phone mask, or mentions "mask" for formatted text input.
  Supports: IMask, react-imask, custom mask patterns.
  Frameworks: TanStack Start, React (Vite), Next.js, Remix.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **Mask lib**: `imask` | `react-imask` | `react-input-mask` | `@react-input/mask`
3. Scan existing mask code to detect:
   - Mask config location (`lib/field-masks.ts`)
   - Format constants (`lib/constant.ts`)

## Conventions

### File Placement
- `src/lib/field-masks.ts` — mask configurations and helpers

### Rules
- Masks defined as constants (reusable)
- `getMaskConfig(format)` returns mask pattern or null
- `isFormatMasked(format)` checks if format needs masking
- `getInputTypeForFormat(format)` maps to HTML input type
- `getInputModeForFormat(format)` maps to inputMode attribute
- No ternary operators — use switch-case, if/else, or const mapper
- No `any` type — use concrete types, `unknown`, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- Explicit return types on all functions
- Multiple conditions use const mapper (`Record` lookup) instead of switch/if-else chains

## Templates

### Mask Configuration (Reference Implementation)

```typescript
// Common mask patterns
export const PHONE_MASK = [
  { mask: '(00) 0000-0000' },
  { mask: '(00) 00000-0000' },
];

export const CPF_MASK = '000.000.000-00';
export const CNPJ_MASK = '00.000.000/0000-00';
export const CEP_MASK = '00000-000';
export const CREDIT_CARD_MASK = '0000 0000 0000 0000';
export const DATE_MASK = '00/00/0000';
export const TIME_MASK = '00:00';

// Get mask config for a format
export function getMaskConfig(
  format: string | null | undefined,
): Array<{ mask: string }> | string | null {
  switch (format) {
    case 'PHONE':
      return PHONE_MASK;
    case 'CPF':
      return CPF_MASK;
    case 'CNPJ':
      return CNPJ_MASK;
    case 'CEP':
      return CEP_MASK;
    case 'CREDIT_CARD':
      return CREDIT_CARD_MASK;
    default:
      return null;
  }
}

// Check if format requires masking
export function isFormatMasked(format: string | null | undefined): boolean {
  switch (format) {
    case 'PHONE':
    case 'CPF':
    case 'CNPJ':
    case 'CEP':
    case 'CREDIT_CARD':
      return true;
    default:
      return false;
  }
}

// Check if format is a password field
export function isPasswordFormat(format: string | null | undefined): boolean {
  return format === 'PASSWORD';
}

// Map format to HTML input type
export function getInputTypeForFormat(
  format: string | null | undefined,
): string {
  switch (format) {
    case 'EMAIL':
      return 'email';
    case 'URL':
      return 'url';
    case 'PASSWORD':
      return 'password';
    default:
      return 'text';
  }
}

// Map format to inputMode for mobile keyboards
export function getInputModeForFormat(
  format: string | null | undefined,
): string | undefined {
  switch (format) {
    case 'INTEGER':
      return 'numeric';
    case 'DECIMAL':
      return 'decimal';
    case 'EMAIL':
      return 'email';
    case 'URL':
      return 'url';
    case 'PHONE':
      return 'tel';
    case 'CPF':
    case 'CNPJ':
    case 'CEP':
    case 'CREDIT_CARD':
      return 'numeric';
    default:
      return undefined;
  }
}
```

### IMask Integration (React Component)

```tsx
import { IMaskInput } from 'react-imask';

import { getMaskConfig, isFormatMasked } from '@/lib/field-masks';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';

interface MaskedInputProps {
  label: string;
  format: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  isInvalid?: boolean;
  errors?: Array<string>;
}

export function MaskedInput({
  label,
  format,
  value,
  onChange,
  onBlur,
  placeholder,
  disabled,
  isInvalid,
  errors,
}: MaskedInputProps): React.JSX.Element {
  const maskConfig = getMaskConfig(format);

  if (!maskConfig) {
    return (
      <Field data-invalid={isInvalid}>
        <FieldLabel>{label}</FieldLabel>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
        />
        {isInvalid && errors && <FieldError errors={errors} />}
      </Field>
    );
  }

  // Dynamic mask (e.g., phone with multiple patterns)
  if (Array.isArray(maskConfig)) {
    return (
      <Field data-invalid={isInvalid}>
        <FieldLabel>{label}</FieldLabel>
        <IMaskInput
          mask={maskConfig}
          dispatch={(appended, dynamicMasked) => {
            const value = (dynamicMasked.value + appended).replace(/\D/g, '');
            if (value.length > 10) {
              return dynamicMasked.compiledMasks[1];
            }
            return dynamicMasked.compiledMasks[0];
          }}
          value={value}
          onAccept={(val) => onChange(val)}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
        />
        {isInvalid && errors && <FieldError errors={errors} />}
      </Field>
    );
  }

  // Static mask (e.g., CPF, CNPJ)
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel>{label}</FieldLabel>
      <IMaskInput
        mask={maskConfig}
        value={value}
        onAccept={(val) => onChange(val)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
      />
      {isInvalid && errors && <FieldError errors={errors} />}
    </Field>
  );
}
```

### TanStack Form Field Integration

```tsx
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import { getMaskConfig, getInputModeForFormat } from '@/lib/field-masks';

interface FieldMaskedTextProps {
  label: string;
  format: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export function FieldMaskedText({
  label,
  format,
  placeholder,
  disabled,
  required,
}: FieldMaskedTextProps): React.JSX.Element {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const inputMode = getInputModeForFormat(format);

  return (
    <MaskedInput
      label={label}
      format={format}
      value={field.state.value}
      onChange={(val) => field.handleChange(val)}
      onBlur={field.handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      isInvalid={isInvalid}
      errors={field.state.meta.errors}
    />
  );
}
```

## Common Mask Formats

| Format | Mask | inputMode | Example |
|--------|------|-----------|---------|
| PHONE | `(00) 0000-0000` / `(00) 00000-0000` | tel | (11) 99999-9999 |
| CPF | `000.000.000-00` | numeric | 123.456.789-00 |
| CNPJ | `00.000.000/0000-00` | numeric | 12.345.678/0001-00 |
| CEP | `00000-000` | numeric | 01234-567 |
| CREDIT_CARD | `0000 0000 0000 0000` | numeric | 4111 1111 1111 1111 |
| INTEGER | none | numeric | 42 |
| DECIMAL | none | decimal | 3.14 |
| EMAIL | none (type=email) | email | user@example.com |
| URL | none (type=url) | url | https://example.com |

## Checklist

- [ ] Mask constants for common formats
- [ ] `getMaskConfig()` returns mask or null
- [ ] `isFormatMasked()` checks if masking needed
- [ ] `getInputTypeForFormat()` for HTML type attribute
- [ ] `getInputModeForFormat()` for mobile keyboard
- [ ] IMask component integration
- [ ] TanStack Form field wrapper
- [ ] No ternary operators
