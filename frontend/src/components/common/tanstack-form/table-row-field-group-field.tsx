import { PlusIcon, TrashIcon } from 'lucide-react';

import {
  fieldContext,
  useFieldContext,
} from '@/integrations/tanstack-form/form-context';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { FIELD_TYPE } from '@/lib/constant';
import type { IField } from '@/lib/interfaces';

import { TableRowCategoryField } from './table-row-category-field';
import { TableRowDateField } from './table-row-date-field';
import { TableRowDropdownField } from './table-row-dropdown-field';
import { TableRowFileField } from './table-row-file-field';
import { TableRowRelationshipField } from './table-row-relationship-field';
import { TableRowTextareaField } from './table-row-textarea-field';
import { TableRowTextField } from './table-row-text-field';

interface TableRowFieldGroupFieldProps {
  field: IField;
  disabled?: boolean;
  tableSlug?: string;
}

export function TableRowFieldGroupField({
  field,
  disabled,
}: TableRowFieldGroupFieldProps): React.JSX.Element {
  const formField = useFieldContext<Array<Record<string, any>>>();
  const isInvalid =
    formField.state.meta.isTouched && !formField.state.meta.isValid;
  const isRequired = field.configuration.required;

  const groupConfig = field.configuration.group;

  const groupTable = useReadTable({ slug: groupConfig?.slug ?? '' });

  const items = formField.state.value ?? [{}];

  const addItem = (): void => {
    formField.handleChange([...items, {}]);
  };

  const removeItem = (index: number): void => {
    formField.handleChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (
    index: number,
    fieldSlug: string,
    value: any,
  ): void => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [fieldSlug]: value };
    formField.handleChange(newItems);
  };

  if (!groupConfig) {
    return (
      <Field>
        <FieldLabel>{field.name}</FieldLabel>
        <p className="text-muted-foreground text-sm">
          Grupo de campos não configurado
        </p>
      </Field>
    );
  }

  if (groupTable.status === 'pending') {
    return (
      <Field>
        <FieldLabel>{field.name}</FieldLabel>
        <div className="flex items-center justify-center py-4">
          <Spinner />
        </div>
      </Field>
    );
  }

  if (groupTable.status === 'error') {
    return (
      <Field>
        <FieldLabel>{field.name}</FieldLabel>
        <p className="text-destructive text-sm">
          Erro ao carregar grupo de campos
        </p>
      </Field>
    );
  }

  const groupFields = groupTable.data.fields.filter((f) => !f.trashed);

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={formField.name}>
        {field.name}
        {isRequired && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="border rounded-lg p-4 space-y-4 bg-muted/30"
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Item {index + 1}</span>
              {items.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={disabled}
                  onClick={() => removeItem(index)}
                >
                  <TrashIcon className="size-4" />
                </Button>
              )}
            </div>
            {groupFields.map((groupField) => (
              <RowFieldGroupItem
                key={groupField._id}
                groupField={groupField}
                value={item[groupField.slug]}
                onChange={(value) =>
                  updateItem(index, groupField.slug, value)
                }
                disabled={disabled}
              />
            ))}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={addItem}
        >
          <PlusIcon className="size-4" />
          <span>Adicionar item</span>
        </Button>
      </div>
      {isInvalid && <FieldError errors={formField.state.meta.errors} />}
    </Field>
  );
}

// Single field within a FIELD_GROUP
function RowFieldGroupItem({
  groupField,
  value,
  onChange,
  disabled,
}: {
  groupField: IField;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}): React.JSX.Element | null {
  if (
    groupField.type === FIELD_TYPE.REACTION ||
    groupField.type === FIELD_TYPE.EVALUATION
  ) {
    return null;
  }

  // Create a mock field context for nested fields
  const mockFormField = {
    name: groupField.slug,
    state: {
      value: value,
      meta: { isTouched: false, isValid: true, errors: [] },
    },
    handleChange: onChange,
    handleBlur: (): void => {},
  };

  // Render the appropriate field component based on type
  // Note: These are simplified versions since we're outside the form context
  switch (groupField.type) {
    case FIELD_TYPE.TEXT_SHORT:
      return (
        <MockFieldWrapper formField={mockFormField}>
          <TableRowTextField field={groupField} disabled={disabled} />
        </MockFieldWrapper>
      );
    case FIELD_TYPE.TEXT_LONG:
      return (
        <MockFieldWrapper formField={mockFormField}>
          <TableRowTextareaField field={groupField} disabled={disabled} />
        </MockFieldWrapper>
      );
    case FIELD_TYPE.DROPDOWN:
      return (
        <MockFieldWrapper formField={mockFormField}>
          <TableRowDropdownField field={groupField} disabled={disabled} />
        </MockFieldWrapper>
      );
    case FIELD_TYPE.DATE:
      return (
        <MockFieldWrapper formField={mockFormField}>
          <TableRowDateField field={groupField} disabled={disabled} />
        </MockFieldWrapper>
      );
    case FIELD_TYPE.FILE:
      return (
        <MockFieldWrapper formField={mockFormField}>
          <TableRowFileField field={groupField} disabled={disabled} />
        </MockFieldWrapper>
      );
    case FIELD_TYPE.RELATIONSHIP:
      return (
        <MockFieldWrapper formField={mockFormField}>
          <TableRowRelationshipField field={groupField} disabled={disabled} />
        </MockFieldWrapper>
      );
    case FIELD_TYPE.CATEGORY:
      return (
        <MockFieldWrapper formField={mockFormField}>
          <TableRowCategoryField field={groupField} disabled={disabled} />
        </MockFieldWrapper>
      );
    default:
      return null;
  }
}

// Wrapper to provide mock field context for nested fields
function MockFieldWrapper({
  formField,
  children,
}: {
  formField: any;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <fieldContext.Provider value={formField}>
      {children}
    </fieldContext.Provider>
  );
}
