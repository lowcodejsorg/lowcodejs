import { EyeClosedIcon, EyeIcon, LockIcon } from 'lucide-react';
import React from 'react';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import type { IField } from '@/lib/interfaces';

interface TableRowPasswordFieldProps {
  field: IField;
  disabled?: boolean;
}

export function TableRowPasswordField({
  field,
  disabled,
}: TableRowPasswordFieldProps): React.JSX.Element {
  const formField = useFieldContext<string>();
  const [showPassword, setShowPassword] = React.useState(false);
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
          type={showPassword ? 'text' : 'password'}
          placeholder={`Digite ${field.name.toLowerCase()}`}
          value={formField.state.value || ''}
          onBlur={formField.handleBlur}
          onChange={(e) => formField.handleChange(e.target.value)}
          aria-invalid={isInvalid}
          aria-required={isRequired || undefined}
          aria-describedby={isInvalid ? errorId : undefined}
        />
        <InputGroupAddon>
          <LockIcon className="size-4" />
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            disabled={disabled}
            type="button"
            aria-label="toggle password visibility"
            title="toggle password visibility"
            size="icon-xs"
            className="cursor-pointer"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? <EyeClosedIcon /> : <EyeIcon />}
          </InputGroupButton>
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
