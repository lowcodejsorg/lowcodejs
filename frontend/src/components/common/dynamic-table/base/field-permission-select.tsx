import { useQuery } from '@tanstack/react-query';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { groupAllOptions } from '@/hooks/tanstack-query/_query-options';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import { cn } from '@/lib/utils';

type FieldPermissionMode = 'table' | 'menu' | 'field';

interface FieldPermissionSelectProps {
  label: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  mode: FieldPermissionMode;
}

const SENTINEL_BY_MODE: Record<
  FieldPermissionMode,
  Array<{ value: string; label: string }>
> = {
  table: [
    { value: 'PUBLIC', label: 'Público (visitantes)' },
    { value: 'NOBODY', label: 'Ninguém' },
  ],
  menu: [
    { value: 'PUBLIC', label: 'Público (visitantes)' },
    { value: 'NOBODY', label: 'Ninguém' },
  ],
  field: [{ value: 'HIDDEN', label: 'Oculto' }],
};

export function FieldPermissionSelect({
  label,
  placeholder = 'Selecione uma opção',
  disabled,
  required,
  mode,
}: FieldPermissionSelectProps): React.JSX.Element {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const errorId = `${field.name}-error`;

  const { data: groups = [], isLoading } = useQuery(groupAllOptions());
  const sentinels = SENTINEL_BY_MODE[mode];

  return (
    <Field
      data-slot="field-permission-select"
      data-test-id="field-permission-select"
      data-invalid={isInvalid}
    >
      <FieldLabel htmlFor={field.name}>
        {label} {required && <span className="text-destructive">*</span>}
      </FieldLabel>
      <Select
        data-test-id="field-permission-select-trigger"
        disabled={disabled || isLoading}
        value={field.state.value}
        aria-label={label}
        onValueChange={(value) => {
          field.handleChange(value);
        }}
      >
        <SelectTrigger className={cn(isInvalid && 'border-destructive')}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Sentinelas</SelectLabel>
            {sentinels.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
          {groups.length > 0 && (
            <>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Grupos</SelectLabel>
                {groups.map((group) => (
                  <SelectItem
                    key={group._id}
                    value={group._id}
                  >
                    {group.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </>
          )}
        </SelectContent>
      </Select>
      {isInvalid && (
        <FieldError
          id={errorId}
          errors={field.state.meta.errors}
        />
      )}
    </Field>
  );
}
