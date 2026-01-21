import { createFormHook } from '@tanstack/react-form';

// General fields
import { fieldContext, formContext } from './form-context';

import { FieldBooleanSwitch } from '@/components/common/tanstack-form/field-boolean-switch';
import { FieldCodeEditor } from '@/components/common/tanstack-form/field-code-editor';
import { FieldEditor } from '@/components/common/tanstack-form/field-editor';
import { FieldEmail } from '@/components/common/tanstack-form/field-email';
import { FieldFileUpload } from '@/components/common/tanstack-form/field-file-upload';
import { FieldGroupCombobox } from '@/components/common/tanstack-form/field-group-combobox';
import { FieldMenuCombobox } from '@/components/common/tanstack-form/field-menu-combobox';
import { FieldMenuTypeSelect } from '@/components/common/tanstack-form/field-menu-type-select';
import { FieldPassword } from '@/components/common/tanstack-form/field-password';
import { FieldPermissionMultiSelect } from '@/components/common/tanstack-form/field-permission-multi-select';
import { FieldSwitch } from '@/components/common/tanstack-form/field-switch';
import { FieldTableMultiSelect } from '@/components/common/tanstack-form/field-table-multi-select';
import { FieldText } from '@/components/common/tanstack-form/field-text';
import { FieldTextarea } from '@/components/common/tanstack-form/field-textarea';
import { FieldUrl } from '@/components/common/tanstack-form/field-url';
import { FieldUserMultiSelect } from '@/components/common/tanstack-form/field-user-multi-select';
// Table configuration
import { TableCollaborationSelectField } from '@/components/common/tanstack-form/table-collaboration-select-field';
import { TableComboboxField } from '@/components/common/tanstack-form/table-combobox-field';
// Table field configuration
import { TableFieldCategoryTree } from '@/components/common/tanstack-form/table-field-category-tree';
import { TableFieldDropdownOptions } from '@/components/common/tanstack-form/table-field-dropdown-options';
import { TableFieldFormatSelect } from '@/components/common/tanstack-form/table-field-format-select';
import { TableFieldRelationshipFieldSelect } from '@/components/common/tanstack-form/table-field-relationship-field-select';
import { TableFieldRelationshipOrderSelect } from '@/components/common/tanstack-form/table-field-relationship-order-select';
import { TableFieldRelationshipTableSelect } from '@/components/common/tanstack-form/table-field-relationship-table-select';
import { TableFieldTypeSelect } from '@/components/common/tanstack-form/table-field-type-select';
// Table row data input
import { TableRowCategoryField } from '@/components/common/tanstack-form/table-row-category-field';
import { TableRowDateField } from '@/components/common/tanstack-form/table-row-date-field';
import { TableRowDropdownField } from '@/components/common/tanstack-form/table-row-dropdown-field';
import { TableRowFieldGroupField } from '@/components/common/tanstack-form/table-row-field-group-field';
import { TableRowFileField } from '@/components/common/tanstack-form/table-row-file-field';
import { TableRowRelationshipField } from '@/components/common/tanstack-form/table-row-relationship-field';
import { TableRowRichTextField } from '@/components/common/tanstack-form/table-row-rich-text-field';
import { TableRowTextField } from '@/components/common/tanstack-form/table-row-text-field';
import { TableRowTextareaField } from '@/components/common/tanstack-form/table-row-textarea-field';
import { TableStyleSelectField } from '@/components/common/tanstack-form/table-style-select-field';
import { TableVisibilitySelectField } from '@/components/common/tanstack-form/table-visibility-select-field';

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    // General fields
    FieldText,
    FieldTextarea,
    FieldEmail,
    FieldPassword,
    FieldUrl,
    FieldSwitch,
    FieldBooleanSwitch,
    FieldEditor,
    FieldCodeEditor,
    FieldFileUpload,
    FieldGroupCombobox,
    FieldMenuCombobox,
    FieldMenuTypeSelect,
    FieldPermissionMultiSelect,
    FieldUserMultiSelect,
    FieldTableMultiSelect,
    // Table configuration
    TableComboboxField,
    TableVisibilitySelectField,
    TableCollaborationSelectField,
    TableStyleSelectField,
    // Table field configuration
    TableFieldTypeSelect,
    TableFieldFormatSelect,
    TableFieldDropdownOptions,
    TableFieldRelationshipTableSelect,
    TableFieldRelationshipFieldSelect,
    TableFieldRelationshipOrderSelect,
    TableFieldCategoryTree,
    // Table row data input
    TableRowTextField,
    TableRowTextareaField,
    TableRowRichTextField,
    TableRowDropdownField,
    TableRowDateField,
    TableRowFileField,
    TableRowRelationshipField,
    TableRowCategoryField,
    TableRowFieldGroupField,
  },
  formComponents: {},
});
