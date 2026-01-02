import { AlertCircle } from 'lucide-react';

import { useFieldContext } from '@/integrations/tanstack-form/form-context';

import { TableCombobox } from '@/components/common/table-combobox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { useTablesReadPaginated } from '@/hooks/tanstack-query/use-tables-read-paginated';
import { cn } from '@/lib/utils';

interface TableComboboxFieldProps {
  label: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export function TableComboboxField({
  label,
  placeholder,
  disabled,
  required,
}: TableComboboxFieldProps): React.JSX.Element {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const { data, status } = useTablesReadPaginated();
  const tables = data?.data;

  // Se não houver tabelas, mostrar mensagem
  if (status === 'success' && tables?.length === 0) {
    return (
      <Field>
        <FieldLabel htmlFor={field.name}>
          {label} {required && <span className="text-destructive">*</span>}
        </FieldLabel>
        <Alert className="bg-amber-50 border-amber-200 text-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            Ainda não há tabelas configuradas. Configure uma tabela primeiro.
          </AlertDescription>
        </Alert>
      </Field>
    );
  }

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>
        {label} {required && <span className="text-destructive">*</span>}
      </FieldLabel>
      <TableCombobox
        disabled={disabled}
        value={field.state.value}
        onValueChange={(value) => {
          field.handleChange(value);
        }}
        placeholder={placeholder}
        className={cn(isInvalid && 'border-destructive')}
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
