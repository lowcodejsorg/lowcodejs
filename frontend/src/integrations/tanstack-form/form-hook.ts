import { createFormHook } from '@tanstack/react-form';

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
  },
  formComponents: {},
});
