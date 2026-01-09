import { FieldLabel } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import { E_USER_STATUS } from '@/lib/constant';
import type { ValueOf } from '@/lib/interfaces';

interface FieldSwitchProps {
  label: string;
  description?: string;
  disabled?: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

export function FieldSwitch({
  label,
  description,
  disabled,
  activeLabel = 'Ativo',
  inactiveLabel = 'Inativo',
}: FieldSwitchProps): React.JSX.Element {
  const field = useFieldContext<ValueOf<typeof E_USER_STATUS>>();

  return (
    <div className="flex flex-row items-center justify-between rounded-lg border p-3">
      <div className="space-y-0.5">
        <FieldLabel>{label}</FieldLabel>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="inline-flex space-x-2 items-center">
        <span className="text-sm text-muted-foreground">{inactiveLabel}</span>
        <Switch
          disabled={disabled}
          checked={field.state.value === E_USER_STATUS.ACTIVE}
          onCheckedChange={(checked) => {
            field.handleChange(
              checked ? E_USER_STATUS.ACTIVE : E_USER_STATUS.INACTIVE,
            );
          }}
        />
        <span className="text-sm text-muted-foreground">{activeLabel}</span>
      </div>
    </div>
  );
}
