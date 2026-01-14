import { LinkIcon } from 'lucide-react';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';

interface FieldUrlProps {
  label: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export function FieldUrl({
  label,
  placeholder,
  disabled,
  required,
}: FieldUrlProps): React.JSX.Element {
  const field = useFieldContext<string>();
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
          type="url"
          placeholder={placeholder}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
        />
        <InputGroupAddon>
          <LinkIcon />
        </InputGroupAddon>
      </InputGroup>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
