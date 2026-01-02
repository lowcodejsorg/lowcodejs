import { createFormHook } from '@tanstack/react-form';

import { BooleanSwitchField } from './components/boolean-switch-field';
import { CategoryTreeField } from './components/category-tree-field';
import { CodeEditorField } from './components/code-editor-field';
import { DropdownOptionsField } from './components/dropdown-options-field';
import { EditorField } from './components/editor-field';
import { EmailField } from './components/email-field';
import { FieldFormatSelectField } from './components/field-format-select-field';
import { FieldTypeSelectField } from './components/field-type-select-field';
import { FileUploadField } from './components/file-upload-field';
import { GroupComboboxField } from './components/group-combobox-field';
import { MenuComboboxField } from './components/menu-combobox-field';
import { MenuTypeSelectField } from './components/menu-type-select-field';
import { PasswordField } from './components/password-field';
import { PermissionMultiSelectField } from './components/permission-multi-select-field';
import { RelationshipFieldSelectField } from './components/relationship-field-select-field';
import { RelationshipOrderSelectField } from './components/relationship-order-select-field';
import { RelationshipTableSelectField } from './components/relationship-table-select-field';
import { RowCategoryField } from './components/row-category-field';
import { RowDateField } from './components/row-date-field';
import { RowDropdownField } from './components/row-dropdown-field';
import { RowFieldGroupField } from './components/row-field-group-field';
import { RowFileField } from './components/row-file-field';
import { RowRelationshipField } from './components/row-relationship-field';
import { RowTextareaField } from './components/row-textarea-field';
import { RowTextField } from './components/row-text-field';
import { SwitchField } from './components/switch-field';
import { TableCollaborationSelectField } from './components/table-collaboration-select-field';
import { TableComboboxField } from './components/table-combobox-field';
import { TableStyleSwitchField } from './components/table-style-switch-field';
import { TableVisibilitySelectField } from './components/table-visibility-select-field';
import { TextField } from './components/text-field';
import { TextareaField } from './components/textarea-field';
import { UrlField } from './components/url-field';
import { fieldContext, formContext } from './form-context';

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
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
    TableComboboxField,
    MenuTypeSelectField,
    PermissionMultiSelectField,
    TableVisibilitySelectField,
    TableCollaborationSelectField,
    TableStyleSwitchField,
    FieldTypeSelectField,
    FieldFormatSelectField,
    DropdownOptionsField,
    RelationshipTableSelectField,
    RelationshipFieldSelectField,
    RelationshipOrderSelectField,
    CategoryTreeField,
    // Row field components
    RowTextField,
    RowTextareaField,
    RowDropdownField,
    RowDateField,
    RowFileField,
    RowRelationshipField,
    RowCategoryField,
    RowFieldGroupField,
  },
  formComponents: {},
});
