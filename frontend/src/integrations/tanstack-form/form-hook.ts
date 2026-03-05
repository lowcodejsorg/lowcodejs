/* eslint-disable import/order */
import { createFormHook } from '@tanstack/react-form';

// Campos basicos (leves)
import {
  FieldBooleanSwitch,
  FieldEmail,
  FieldFileUpload,
  FieldGroupCombobox,
  FieldMenuCombobox,
  FieldMenuTypeSelect,
  FieldPassword,
  FieldPermissionMultiSelect,
  FieldSwitch,
  FieldTableMultiSelect,
  FieldText,
  FieldTextarea,
  FieldUrl,
  FieldUserMultiSelect,
} from './fields/base';

// Campos pesados com lazy loading interno
import { FieldCodeEditor, FieldEditor } from './fields/rich';

// Configuracao de tabela
import {
  TableCollaborationSelectField,
  TableComboboxField,
  TableFieldCategoryTree,
  TableFieldDropdownOptions,
  TableFieldFormatSelect,
  TableFieldRelationshipFieldSelect,
  TableFieldRelationshipOrderSelect,
  TableFieldRelationshipTableSelect,
  TableFieldTypeSelect,
  TableOrderSelectField,
  TableStyleSelectField,
  TableVisibilitySelectField,
} from './fields/table-config';

// Campos de input de dados de registros
import {
  TableRowCategoryField,
  TableRowDateField,
  TableRowDropdownField,
  TableRowFieldGroupField,
  TableRowFileField,
  TableRowMarkdownField,
  TableRowRelationshipField,
  TableRowRichTextField,
  TableRowTextField,
  TableRowTextareaField,
  TableRowUserField,
} from './fields/table-row';
import { fieldContext, formContext } from './form-context';

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
    TableOrderSelectField,
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
    TableRowMarkdownField,
    TableRowDropdownField,
    TableRowDateField,
    TableRowFileField,
    TableRowRelationshipField,
    TableRowCategoryField,
    TableRowFieldGroupField,
    TableRowUserField,
  },
  formComponents: {},
});
