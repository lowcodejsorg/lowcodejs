import * as React from 'react';

import { useFieldContext } from '../form-context';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useReadTable } from '@/integrations/tanstack-query/implementations/use-table-read';
import { cn } from '@/lib/utils';

interface RelationshipFieldSelectFieldProps {
  label: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  tableSlug: string;
  onFieldChange?: (fieldSlug: string) => void;
}

export function RelationshipFieldSelectField({
  label,
  placeholder = 'Selecione um campo',
  disabled,
  required,
  tableSlug,
  onFieldChange,
}: RelationshipFieldSelectFieldProps): React.JSX.Element {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const relationshipTable = useReadTable({
    slug: tableSlug,
  });

  const fields = relationshipTable.data?.fields ?? [];
  const isDisabled = disabled || relationshipTable.status === 'pending';

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <Select
        disabled={isDisabled}
        value={field.state.value}
        onValueChange={(value) => {
          field.handleChange(value);
          const selectedField = fields.find((f) => f._id === value);
          if (selectedField) {
            onFieldChange?.(selectedField.slug);
          }
        }}
      >
        <SelectTrigger className={cn('w-full', isInvalid && 'border-destructive')}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {fields.map((f) => (
            <SelectItem key={f._id} value={f._id}>
              {f.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
