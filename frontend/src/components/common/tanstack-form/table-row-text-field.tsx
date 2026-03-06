import { TextIcon } from 'lucide-react';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import type { IField } from '@/lib/interfaces';

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
    formField.state.meta.isTouched && !formField.state.meta.isValid;
  const errorId = `${formField.name}-error`;
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
          aria-required={isRequired || undefined}
          aria-describedby={isInvalid ? errorId : undefined}
        />
        <InputGroupAddon>
          <TextIcon className="size-4" />
        </InputGroupAddon>
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
