import { FingerprintIcon, PhoneIcon } from 'lucide-react';
import { IMaskInput } from 'react-imask';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import { E_FIELD_FORMAT } from '@/lib/constant';
import { getMaskConfig } from '@/lib/field-masks';
import type { IField } from '@/lib/interfaces';

interface TableRowMaskedTextFieldProps {
  field: IField;
  disabled?: boolean;
}

function getFormatIcon(format: string | null | undefined): React.JSX.Element {
  if (format === E_FIELD_FORMAT.PHONE) return <PhoneIcon className="size-4" />;
  return <FingerprintIcon className="size-4" />;
}

export function TableRowMaskedTextField({
  field,
  disabled,
}: TableRowMaskedTextFieldProps): React.JSX.Element {
  const formField = useFieldContext<string>();
  const isInvalid =
    formField.state.meta.isTouched && !formField.state.meta.isValid;
  const errorId = `${formField.name}-error`;
  const isRequired = field.required;

  const maskConfig = getMaskConfig(field.format);

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={formField.name}>
        {field.name}
        {isRequired && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <InputGroup data-disabled={disabled}>
        <IMaskInput
          className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex-1 rounded-none border-0 shadow-none focus-visible:ring-0"
          {...(Array.isArray(maskConfig)
            ? { mask: maskConfig }
            : { mask: maskConfig ?? '' })}
          unmask={false}
          value={formField.state.value || ''}
          onAccept={(value: string) => formField.handleChange(value)}
          onBlur={formField.handleBlur}
          disabled={disabled}
          id={formField.name}
          name={formField.name}
          placeholder={`Digite ${field.name.toLowerCase()}`}
          data-slot="input-group-control"
          aria-invalid={isInvalid}
          aria-required={isRequired || undefined}
          aria-describedby={isInvalid ? errorId : undefined}
        />
        <InputGroupAddon>{getFormatIcon(field.format)}</InputGroupAddon>
      </InputGroup>
      {isInvalid && (
        <FieldError
          id={errorId}
          errors={formField.state.meta.errors}
        />
      )}
    </Field>
  );
}
