import { AlertCircle } from 'lucide-react';
import { useMemo } from 'react';

import { TableComboboxFilteredSafe } from '@/components/common/table-combobox-filtered';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import { cn } from '@/lib/utils';

export interface TableEntity {
  _id: string;
  name: string;
}

interface SelectOption {
  value: string;
  label: string;
}

interface FilteredTableComboboxFieldProps {
  label: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;

  /** dados já carregados */
  tables: TableEntity[];

  /** IDs permitidos (vindos do settings) */
  allowedTableIds: string[];

  mapOption?: (table: TableEntity) => SelectOption;
}

export function FilteredTableComboboxField({
  label,
  placeholder,
  disabled,
  required,
  tables,
  allowedTableIds,
  mapOption,
}: FilteredTableComboboxFieldProps): React.JSX.Element {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  /**
   * Normaliza os IDs permitidos
   * - remove espaços
   * - garante string
   */
  const normalizedAllowedIds = useMemo(
    () => allowedTableIds.map((id) => String(id).trim()),
    [allowedTableIds]
  );

  /**
   * Filtragem REAL
   */
  const options: SelectOption[] = useMemo(() => {
    if (normalizedAllowedIds.length === 0) return [];

    return tables
      .filter((t) => normalizedAllowedIds.includes(String(t._id)))
      .map((t) =>
        mapOption
          ? mapOption(t)
          : {
              value: t._id,
              label: t.name,
            }
      );
  }, [tables, normalizedAllowedIds, mapOption]);

  /**
   * Não renderiza nada enquanto ainda não há IDs permitidos
   * (evita listar tudo no primeiro render)
   */
  if (normalizedAllowedIds.length === 0) {
    return null;
  }

  if (options.length === 0) {
    return (
      <Field>
        <FieldLabel>
          {label} {required && <span className="text-destructive">*</span>}
        </FieldLabel>

        <Alert className="bg-amber-50 border-amber-200 text-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            Nenhum registro disponível para seleção.
          </AlertDescription>
        </Alert>
      </Field>
    );
  }

  // Vou manter estes consoles para validações futuras
  // console.log('allowed', normalizedAllowedIds);
  // console.log('tables', tables.map(t => t._id));
  // console.log('options', options);

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel>
        {label} {required && <span className="text-destructive">*</span>}
      </FieldLabel>

      {/* key força o TableCombobox a respeitar a lista filtrada */}
      <TableComboboxFilteredSafe
        key={options.map((o) => o.value).join('|')}
        options={options}
        value={field.state.value}
        onValueChange={(value) => {
          field.handleChange(value);
          field.handleBlur();
        }}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(isInvalid && 'border-destructive')}
      />

      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
