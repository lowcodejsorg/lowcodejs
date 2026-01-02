import { EyeClosedIcon, EyeIcon } from 'lucide-react';
import React from 'react';

import { useFieldContext } from '../form-context';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';

interface PasswordFieldProps {
  label: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export function PasswordField({
  label,
  placeholder,
  disabled,
  required,
}: PasswordFieldProps): React.JSX.Element {
  const field = useFieldContext<string>();
  const [showPassword, setShowPassword] = React.useState(false);
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>
        {label} {required && <span className="text-destructive">*</span>}
      </FieldLabel>
      <InputGroup>
        <InputGroupInput
          disabled={disabled}
          id={field.name}
          name={field.name}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            disabled={disabled}
            type="button"
            aria-label="toggle password visibility"
            title="toggle password visibility"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? <EyeClosedIcon /> : <EyeIcon />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
