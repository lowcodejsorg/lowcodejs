import { useFieldContext } from '@/integrations/tanstack-form/form-context';

import { FieldLabel } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';

interface TableStyleSwitchFieldProps {
  label: string;
  description?: string;
  disabled?: boolean;
}

export function TableStyleSwitchField({
  label,
  description,
  disabled,
}: TableStyleSwitchFieldProps): React.JSX.Element {
  const field = useFieldContext<string>();

  return (
    <div className="flex flex-row items-center justify-between rounded-lg border p-3">
      <div className="space-y-0.5">
        <FieldLabel>{label}</FieldLabel>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="inline-flex space-x-2 items-center">
        <span className="text-sm text-muted-foreground">Lista</span>
        <Switch
          disabled={disabled}
          checked={field.state.value === 'gallery'}
          onCheckedChange={(checked) => {
            field.handleChange(checked ? 'gallery' : 'list');
          }}
        />
        <span className="text-sm text-muted-foreground">Galeria</span>
      </div>
    </div>
  );
}
