import { E_FIELD_FORMAT, E_FIELD_TYPE } from '@/lib/constant';
import type { IField } from '@/lib/interfaces';
import { buildFieldValidator } from '@/lib/table';

interface RowFormFieldsProps {
  form: any;
  fields: Array<IField>;
  disabled: boolean;
  tableSlug: string;
}

export function RowFormFields({
  form,
  fields,
  disabled,
  tableSlug,
}: RowFormFieldsProps): React.JSX.Element {
  return (
    <section className="space-y-4 p-2">
      {fields.map((field) => {
        // Skip non-editable field types
        if (
          field.type === E_FIELD_TYPE.REACTION ||
          field.type === E_FIELD_TYPE.EVALUATION
        ) {
          return null;
        }

        return (
          <form.AppField
            key={field._id}
            name={field.slug}
            validators={{
              onChange: ({ value }: { value: any }) => {
                return buildFieldValidator(field, value);
              },
            }}
          >
            {(formField: any) => {
              switch (field.type) {
                case E_FIELD_TYPE.TEXT_SHORT:
                  return (
                    <formField.TableRowTextField
                      field={field}
                      disabled={disabled}
                    />
                  );
                case E_FIELD_TYPE.TEXT_LONG:
                  if (field.configuration.format === E_FIELD_FORMAT.RICH_TEXT) {
                    return (
                      <formField.TableRowRichTextField
                        field={field}
                        disabled={disabled}
                      />
                    );
                  }
                  return (
                    <formField.TableRowTextareaField
                      field={field}
                      disabled={disabled}
                    />
                  );
                case E_FIELD_TYPE.DROPDOWN:
                  return (
                    <formField.TableRowDropdownField
                      field={field}
                      disabled={disabled}
                    />
                  );
                case E_FIELD_TYPE.DATE:
                  return (
                    <formField.TableRowDateField
                      field={field}
                      disabled={disabled}
                    />
                  );
                case E_FIELD_TYPE.FILE:
                  return (
                    <formField.TableRowFileField
                      field={field}
                      disabled={disabled}
                    />
                  );
                case E_FIELD_TYPE.RELATIONSHIP:
                  return (
                    <formField.TableRowRelationshipField
                      field={field}
                      disabled={disabled}
                    />
                  );
                case E_FIELD_TYPE.CATEGORY:
                  return (
                    <formField.TableRowCategoryField
                      field={field}
                      disabled={disabled}
                    />
                  );
                case E_FIELD_TYPE.FIELD_GROUP:
                  return (
                    <formField.TableRowFieldGroupField
                      field={field}
                      disabled={disabled}
                      tableSlug={tableSlug}
                      form={form}
                    />
                  );
                case E_FIELD_TYPE.USER:
                  return (
                    <formField.TableRowUserField
                      field={field}
                      disabled={disabled}
                    />
                  );
                default:
                  return null;
              }
            }}
          </form.AppField>
        );
      })}
    </section>
  );
}
