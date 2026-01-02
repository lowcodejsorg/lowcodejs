import { useFieldContext } from '@/integrations/tanstack-form/form-context';

import { FieldLabel } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface FieldBooleanSwitchProps {
  label: string;
  description?: string;
  disabled?: boolean;
  yesLabel?: string;
  noLabel?: string;
  className?: string;
}

export function FieldBooleanSwitch({
  label,
  description,
  disabled,
  yesLabel = 'Sim',
  noLabel = 'Não',
  className,
}: FieldBooleanSwitchProps): React.JSX.Element {
  const field = useFieldContext<boolean>();

  return (
    <div
      className={cn(
        'flex flex-row items-center justify-between rounded-lg border p-3',
        className,
      )}
    >
      <div className="space-y-0.5">
        <FieldLabel>{label}</FieldLabel>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="inline-flex space-x-2 items-center">
        <span className="text-sm text-muted-foreground">{noLabel}</span>
        <Switch
          disabled={disabled}
          checked={field.state.value}
          onCheckedChange={(checked) => {
            field.handleChange(checked);
          }}
        />
        <span className="text-sm text-muted-foreground">{yesLabel}</span>
      </div>
    </div>
  );
}
