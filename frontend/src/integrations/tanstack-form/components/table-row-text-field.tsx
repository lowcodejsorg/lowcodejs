import { TextIcon } from 'lucide-react';

import { useFieldContext } from '../form-context';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import type { IField } from '@/lib/interfaces';

interface RowTextFieldProps {
  field: IField;
  disabled?: boolean;
}

export function RowTextField({
  field,
  disabled,
}: RowTextFieldProps): React.JSX.Element {
  const formField = useFieldContext<string>();
  const isInvalid =
    formField.state.meta.isTouched && !formField.state.meta.isValid;
  const isRequired = field.configuration.required;

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
          value={formField.state.value ?? ''}
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
