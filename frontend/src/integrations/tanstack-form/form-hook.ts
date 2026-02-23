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
  TableFieldOrderSelect,
  TableFieldRelationshipFieldSelect,
  TableFieldRelationshipOrderSelect,
  TableFieldRelationshipTableSelect,
  TableFieldTypeSelect,
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
    TableStyleSelectField,
    // Table field configuration
    TableFieldTypeSelect,
    TableFieldOrderSelect,
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
    TableRowUserField,
  },
  formComponents: {},
});
