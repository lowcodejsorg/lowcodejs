import { useParams } from '@tanstack/react-router';
import { useFormContext } from 'react-hook-form';

import { TableFieldCategory } from '@/components/common/-table-field-category';
import { TableFieldDateFormat } from '@/components/common/-table-field-date-format';
import { TableFieldDropdown } from '@/components/common/-table-field-dropdown';
import { TableFieldListing } from '@/components/common/-table-field-listing';
import { TableFieldRelationshipColumn } from '@/components/common/-table-field-relationship-column';
import { TableFieldRelationshipOrder } from '@/components/common/-table-field-relationship-order';
import { TableFieldFiltering } from '@/components/common/-table-filtering';
import { TableFieldMultiple } from '@/components/common/table-field-multiple';
import { TableFieldName } from '@/components/common/table-field-name';
import { TableFieldRelationship } from '@/components/common/table-field-relationship';
import { TableFieldRequired } from '@/components/common/table-field-required';
import { TableFieldTextLongDefaultValue } from '@/components/common/table-field-text-long-default-value';
import { TableFieldTextShortDefaultValue } from '@/components/common/table-field-text-short-default-value';
import { TableFieldTextShortFormat } from '@/components/common/table-field-text-short-format';
import { TableFieldType } from '@/components/common/table-field-type';
import { FIELD_TYPE } from '@/lib/constant';

export function CreateTableFieldForm(): React.JSX.Element {
  const { slug } = useParams({
    from: '/_private/tables/$slug/field/create/',
  });

  const form = useFormContext();

  const type: keyof typeof FIELD_TYPE = form.watch('type');

  return (
    <section className="space-y-4 p-2">
      <TableFieldName required />
      <TableFieldType
        required
        tableSlug={slug}
      />

      {type === FIELD_TYPE.TEXT_SHORT && (
        <TableFieldTextShortFormat required={type === FIELD_TYPE.TEXT_SHORT} />
      )}

      {type === FIELD_TYPE.TEXT_SHORT && <TableFieldTextShortDefaultValue />}

      {type === FIELD_TYPE.TEXT_LONG && <TableFieldTextLongDefaultValue />}

      {type === FIELD_TYPE.DROPDOWN && (
        <TableFieldDropdown required={type === FIELD_TYPE.DROPDOWN} />
      )}

      {type === FIELD_TYPE.RELATIONSHIP && (
        <TableFieldRelationship
          required={[FIELD_TYPE.RELATIONSHIP].includes(type)}
          tableSlug={slug}
        />
      )}

      {form.watch('configuration.relationship.table._id') &&
        type === FIELD_TYPE.RELATIONSHIP && (
          <TableFieldRelationshipColumn
            required={!!form.watch('configuration.relationship.table._id')}
          />
        )}

      {type === FIELD_TYPE.RELATIONSHIP && (
        <TableFieldRelationshipOrder
          required={[FIELD_TYPE.RELATIONSHIP].includes(type)}
        />
      )}

      {type === FIELD_TYPE.DATE && (
        <TableFieldDateFormat required={type === FIELD_TYPE.DATE} />
      )}

      {[FIELD_TYPE.CATEGORY].includes(type) && (
        <TableFieldCategory required={[FIELD_TYPE.CATEGORY].includes(type)} />
      )}

      {[
        FIELD_TYPE.DROPDOWN,
        FIELD_TYPE.FILE,
        FIELD_TYPE.RELATIONSHIP,
        FIELD_TYPE.FIELD_GROUP,
        FIELD_TYPE.CATEGORY,
      ].includes(type) && <TableFieldMultiple />}

      {![FIELD_TYPE.REACTION, FIELD_TYPE.FILE].includes(type) && (
        <TableFieldFiltering />
      )}

      <TableFieldListing />

      {![FIELD_TYPE.REACTION, FIELD_TYPE.EVALUATION].includes(type) && (
        <TableFieldRequired />
      )}
    </section>
  );
}
