import { createFormHook } from '@tanstack/react-form';

import { BooleanSwitchField } from './components/boolean-switch-field';
import { CodeEditorField } from './components/code-editor-field';
import { EditorField } from './components/editor-field';
import { EmailField } from './components/email-field';
import { FileUploadField } from './components/file-upload-field';
import { GroupComboboxField } from './components/group-combobox-field';
import { MenuComboboxField } from './components/menu-combobox-field';
import { MenuTypeSelectField } from './components/menu-type-select-field';
import { PasswordField } from './components/password-field';
import { PermissionMultiSelectField } from './components/permission-multi-select-field';
import { SwitchField } from './components/switch-field';
import { TableCollaborationSelectField } from './components/table-collaboration-select-field';
import { TableComboboxField } from './components/table-combobox-field';
import { TableStyleSwitchField } from './components/table-style-switch-field';
import { TableVisibilitySelectField } from './components/table-visibility-select-field';
import { TextField } from './components/text-field';
import { TextareaField } from './components/textarea-field';
import { UrlField } from './components/url-field';
import { fieldContext, formContext } from './form-context';
// Table field components (field configuration)
import { CategoryTreeField as TableFieldCategoryTree } from './components/table-field-category-tree';
import { DropdownOptionsField as TableFieldDropdownOptions } from './components/table-field-dropdown-options';
import { FieldFormatSelectField as TableFieldFormatSelect } from './components/table-field-format-select';
import { FieldTypeSelectField as TableFieldTypeSelect } from './components/table-field-type-select';
import { RelationshipFieldSelectField as TableFieldRelationshipFieldSelect } from './components/table-field-relationship-field-select';
import { RelationshipOrderSelectField as TableFieldRelationshipOrderSelect } from './components/table-field-relationship-order-select';
import { RelationshipTableSelectField as TableFieldRelationshipTableSelect } from './components/table-field-relationship-table-select';
// Table row components (row data input)
import { RowCategoryField as TableRowCategoryField } from './components/table-row-category-field';
import { RowDateField as TableRowDateField } from './components/table-row-date-field';
import { RowDropdownField as TableRowDropdownField } from './components/table-row-dropdown-field';
import { RowFieldGroupField as TableRowFieldGroupField } from './components/table-row-field-group-field';
import { RowFileField as TableRowFileField } from './components/table-row-file-field';
import { RowRelationshipField as TableRowRelationshipField } from './components/table-row-relationship-field';
import { RowTextareaField as TableRowTextareaField } from './components/table-row-textarea-field';
import { RowTextField as TableRowTextField } from './components/table-row-text-field';

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    // General fields
    TextField,
    TextareaField,
    EmailField,
    PasswordField,
    UrlField,
    SwitchField,
    BooleanSwitchField,
    EditorField,
    CodeEditorField,
    FileUploadField,
    GroupComboboxField,
    MenuComboboxField,
    MenuTypeSelectField,
    PermissionMultiSelectField,
    // Table configuration
    TableComboboxField,
    TableVisibilitySelectField,
    TableCollaborationSelectField,
    TableStyleSwitchField,
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
    TableRowDropdownField,
    TableRowDateField,
    TableRowFileField,
    TableRowRelationshipField,
    TableRowCategoryField,
    TableRowFieldGroupField,
  },
  formComponents: {},
});
