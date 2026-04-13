import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import {
  E_SYSTEM_PERMISSION,
  SYSTEM_PERMISSION_LABEL_MAPPER,
} from '@/lib/constant';

interface FieldSystemPermissionCheckboxesProps {
  label: string;
  disabled?: boolean;
}

const SYSTEM_PERMISSION_ENTRIES = Object.values(E_SYSTEM_PERMISSION);

export function FieldSystemPermissionCheckboxes({
  label,
  disabled,
}: FieldSystemPermissionCheckboxesProps): React.JSX.Element {
  const field = useFieldContext<Record<string, boolean>>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const errorId = `${field.name}-error`;

  return (
    <Field
      data-slot="field-system-permission-checkboxes"
      data-test-id="field-system-permission-checkboxes"
      data-invalid={isInvalid}
    >
      <FieldLabel>{label}</FieldLabel>
      <div className="grid grid-cols-2 gap-3 rounded-lg border p-4">
        {SYSTEM_PERMISSION_ENTRIES.map((permission) => {
          const checked = field.state.value[permission] === true;
          return (
            <label
              key={permission}
              className="flex items-center gap-2 cursor-pointer text-sm"
            >
              <Checkbox
                disabled={disabled}
                checked={checked}
                onCheckedChange={(value) => {
                  field.handleChange({
                    ...field.state.value,
                    [permission]: value === true,
                  });
                }}
                data-test-id={`system-permission-${permission}`}
              />
              <span>
                {SYSTEM_PERMISSION_LABEL_MAPPER[permission] ?? permission}
              </span>
            </label>
          );
        })}
      </div>
      {isInvalid && (
        <FieldError
          id={errorId}
          errors={field.state.meta.errors}
        />
      )}
    </Field>
  );
}
