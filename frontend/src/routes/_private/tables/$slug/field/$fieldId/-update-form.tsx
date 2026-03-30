import { useStore } from '@tanstack/react-form';
import { FileTextIcon } from 'lucide-react';
import z from 'zod';

import { withForm } from '@/integrations/tanstack-form/form-hook';
import { E_FIELD_FORMAT, E_FIELD_TYPE } from '@/lib/constant';
import type { ICategory, IDropdown } from '@/lib/interfaces';

export const FieldUpdateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(40),
  type: z.string().min(1, 'Tipo é obrigatório'),
  format: z.string().default(''),
  defaultValue: z.string().default(''),
  dropdown: z.array(z.custom<IDropdown>()).default([]),
  relationship: z.object({
    tableId: z.string().default(''),
    tableSlug: z.string().default(''),
    fieldId: z.string().default(''),
    fieldSlug: z.string().default(''),
    order: z.string().default(''),
  }),
  category: z.array(z.custom<ICategory>()).default([]),
  multiple: z.boolean().default(false),
  showInFilter: z.boolean().default(false),
  showInForm: z.boolean().default(false),
  showInDetail: z.boolean().default(false),
  showInList: z.boolean().default(false),
  required: z.boolean().default(false),
  trashed: z.boolean().default(false),
  widthInForm: z.number().default(50),
  widthInList: z.number().default(10),
});

export type FieldUpdateFormValues = z.infer<typeof FieldUpdateSchema>;

export const fieldUpdateFormDefaultValues: FieldUpdateFormValues = {
  name: '',
  type: '',
  format: '',
  defaultValue: '',
  dropdown: [],
  relationship: {
    tableId: '',
    tableSlug: '',
    fieldId: '',
    fieldSlug: '',
    order: '',
  },
  category: [],
  multiple: false,
  showInFilter: false,
  showInForm: false,
  showInDetail: false,
  showInList: false,
  required: false,
  trashed: false,
  widthInForm: 50,
  widthInList: 10,
};

export const UpdateFieldFormFields = withForm({
  defaultValues: fieldUpdateFormDefaultValues,
  props: {
    isPending: false,
    mode: 'show' as 'show' | 'edit',
    tableSlug: '' as string,
    isLocked: false,
  },
  render: function Render({ form, isPending, mode, tableSlug, isLocked }) {
    // useStore para valores reativos do form
    const fieldType = useStore(form.store, (state) => state.values.type);
    const isTextShort = fieldType === E_FIELD_TYPE.TEXT_SHORT;
    const isTextLong = fieldType === E_FIELD_TYPE.TEXT_LONG;
    const isDropdown = fieldType === E_FIELD_TYPE.DROPDOWN;
    const isDate = fieldType === E_FIELD_TYPE.DATE;
    const isRelationship = fieldType === E_FIELD_TYPE.RELATIONSHIP;
    const isCategory = fieldType === E_FIELD_TYPE.CATEGORY;
    const isFile = fieldType === E_FIELD_TYPE.FILE;
    const isFieldGroup = fieldType === E_FIELD_TYPE.FIELD_GROUP;
    const isReaction = fieldType === E_FIELD_TYPE.REACTION;
    const isEvaluation = fieldType === E_FIELD_TYPE.EVALUATION;
    const isUser = fieldType === E_FIELD_TYPE.USER;

    // useStore para reatividade - re-renderiza quando tableSlug muda
    const relationshipTableSlug = useStore(
      form.store,
      (state) => state.values.relationship.tableSlug,
    );
    const textLongFormat = useStore(form.store, (state) => state.values.format);
    const dropdownOptions = useStore(
      form.store,
      (state) => state.values.dropdown,
    );
    const isTrashed = useStore(
      form.store,
      (state) => state.values.trashed,
    );

    const showMultiple =
      isDropdown ||
      isFile ||
      isRelationship ||
      isFieldGroup ||
      isCategory ||
      isUser;
    const showRequired = !isReaction && !isEvaluation;

    const isDisabled = mode === 'show' || isPending;
    const lockAllControls = isLocked && !isDropdown;
    const lockNonOptions = isLocked && isDropdown;

    return (
      <section
        data-test-id="field-update-form-fields"
        className="space-y-4 p-2"
      >
        {/* @ts-expect-error TanStack Form type depth issue with nested configuration */}
        <form.AppField
          name="name"
          validators={{
            onChange: ({ value }) => {
              if (!value || value.trim() === '') {
                return 'Nome é obrigatório';
              }
              if (value.length > 40) {
                return 'O nome deve ter no máximo 40 caracteres';
              }
              return undefined;
            },
          }}
        >
          {(field) => (
            <field.FieldText
              label="Nome"
              placeholder="Nome do campo"
              disabled={isDisabled || isLocked}
              icon={<FileTextIcon />}
              required
            />
          )}
        </form.AppField>

        {/* Campo Tipo (oculto para grupo de campos) */}
        {!isFieldGroup && (
          <form.AppField name="type">
            {(field) => (
              <field.TableFieldTypeSelect
                label="Tipo"
                placeholder="Tipo do campo"
                disabled={true}
                blockedTypes={[]}
              />
            )}
          </form.AppField>
        )}

        {/* Campo Formato (TEXT_SHORT) */}
        {isTextShort && (
          <form.AppField
            name="format"
            validators={{
              onChange: ({ value }) => {
                if (!value || value.trim() === '') {
                  return 'Formato é obrigatório';
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <field.TableFieldFormatSelect
                label="Formato"
                placeholder="Selecione um formato para o campo"
                disabled={isDisabled || lockAllControls}
                fieldType={E_FIELD_TYPE.TEXT_SHORT}
                required
              />
            )}
          </form.AppField>
        )}

        {/* Campo Valor Padrão (TEXT_SHORT) */}
        {isTextShort && (
          <form.AppField name="defaultValue">
            {(field) => (
              <field.FieldText
                label="Valor padrão"
                placeholder="Valor padrão (deixe em branco se não houver)"
                disabled={isDisabled || lockAllControls}
              />
            )}
          </form.AppField>
        )}

        {/* Campo Formato (TEXT_LONG) */}
        {isTextLong && (
          <form.AppField
            name="format"
            validators={{
              onChange: ({ value }) => {
                if (!value || value.trim() === '') {
                  return 'Formato é obrigatório';
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <field.TableFieldFormatSelect
                label="Formato"
                placeholder="Selecione um formato para o campo"
                disabled={isDisabled || lockAllControls}
                fieldType={E_FIELD_TYPE.TEXT_LONG}
                required
              />
            )}
          </form.AppField>
        )}

        {/* Campo Valor Padrão (TEXT_LONG - Editor Rico) */}
        {isTextLong && textLongFormat === E_FIELD_FORMAT.RICH_TEXT && (
          <form.AppField name="defaultValue">
            {(field) => <field.FieldEditor label="Valor padrão" />}
          </form.AppField>
        )}

        {/* Campo Valor Padrão (TEXT_LONG - Área de Texto) */}
        {isTextLong && textLongFormat !== E_FIELD_FORMAT.RICH_TEXT && (
          <form.AppField name="defaultValue">
            {(field) => (
              <field.FieldTextarea
                label="Valor padrão"
                placeholder="Valor padrão (Se deixar em branco, o campo ficará vazio)"
                disabled={isDisabled || lockAllControls}
                rows={3}
              />
            )}
          </form.AppField>
        )}

        {/* Campo Dropdown */}
        {isDropdown && (
          <form.AppField
            name="dropdown"
            validators={{
              onChange: ({ value }) => {
                if (!value || value.length === 0) {
                  return 'Adicione ao menos uma opção';
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <field.TableFieldDropdownOptions
                label="Opções"
                placeholder="Escreva e adicione"
                disabled={isDisabled}
                required
              />
            )}
          </form.AppField>
        )}

        {/* Valor padrão do Dropdown */}
        {isDropdown && (
          <form.AppField name="defaultValue">
            {(field) => (
              <field.TableFieldDropdownDefaultValue
                label="Valor padrão"
                disabled={isDisabled}
                dropdown={dropdownOptions}
              />
            )}
          </form.AppField>
        )}

        {/* Campo Formato Data */}
        {isDate && (
          <form.AppField
            name="format"
            validators={{
              onChange: ({ value }) => {
                if (!value || value.trim() === '') {
                  return 'Formato da data é obrigatório';
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <field.TableFieldFormatSelect
                label="Formato da data"
                placeholder="Selecione o formato da data"
                disabled={isDisabled || lockAllControls}
                fieldType={E_FIELD_TYPE.DATE}
                required
              />
            )}
          </form.AppField>
        )}

        {/* Campo Tabela de Relacionamento */}
        {isRelationship && (
          <form.AppField
            name="relationship.tableId"
            validators={{
              onChange: ({ value }) => {
                if (!value || value.trim() === '') {
                  return 'Tabela de relacionamento é obrigatória';
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <field.TableFieldRelationshipTableSelect
                label="Tabela de relacionamento"
                placeholder="Selecione uma tabela"
                disabled={isDisabled || lockAllControls}
                excludeTableSlug={tableSlug}
                onTableChange={(slug) => {
                  form.setFieldValue('relationship.tableSlug', slug);
                  form.setFieldValue('relationship.fieldId', '');
                  form.setFieldValue('relationship.fieldSlug', '');
                }}
                required
              />
            )}
          </form.AppField>
        )}

        {/* Campo de Relacionamento (coluna) */}
        {isRelationship && relationshipTableSlug && (
          <form.AppField
            name="relationship.fieldId"
            validators={{
              onChange: ({ value }) => {
                if (!value || value.trim() === '') {
                  return 'Campo é obrigatório';
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <field.TableFieldRelationshipFieldSelect
                label="Campo de relacionamento"
                placeholder="Selecione um campo"
                disabled={isDisabled || lockAllControls}
                tableSlug={relationshipTableSlug}
                onFieldChange={(slug) => {
                  form.setFieldValue('relationship.fieldSlug', slug);
                }}
                required
              />
            )}
          </form.AppField>
        )}

        {/* Campo Ordem (Relacionamento) */}
        {isRelationship && (
          <form.AppField
            name="relationship.order"
            validators={{
              onChange: ({ value }) => {
                if (!value || value.trim() === '') {
                  return 'Ordem é obrigatória';
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <field.TableFieldRelationshipOrderSelect
                label="Ordem"
                placeholder="Selecione uma ordem"
                disabled={isDisabled || lockAllControls}
                required
              />
            )}
          </form.AppField>
        )}

        {/* Campo Categoria (Tree) */}
        {isCategory && (
          <form.AppField
            name="category"
            validators={{
              onChange: ({ value }) => {
                if (!value || value.length === 0) {
                  return 'Estrutura da categoria é obrigatória';
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <field.TableFieldCategoryTree
                label="Estrutura da categoria"
                required
              />
            )}
          </form.AppField>
        )}

        {/* Campo Múltiplos */}
        {showMultiple && (
          <form.AppField name="multiple">
            {(field) => (
              <field.FieldBooleanSwitch
                label="Permitir múltiplos"
                description="Este campo deve permitir múltiplos valores?"
                disabled={isDisabled || lockNonOptions}
              />
            )}
          </form.AppField>
        )}

        {/* Campo Obrigatoriedade */}
        {showRequired && (
          <form.AppField name="required">
            {(field) => (
              <field.FieldBooleanSwitch
                label="Obrigatoriedade"
                description="Este campo é obrigatório?"
                disabled={isDisabled || lockNonOptions || isTrashed}
              />
            )}
          </form.AppField>
        )}

        {/* Campo Lixeira */}
        <form.AppField name="trashed">
          {(field) => (
            <field.FieldBooleanSwitch
              label="Enviar para lixeira"
              description="Enviar este campo para a lixeira?"
              disabled={isDisabled || isLocked}
              className="border-destructive/50"
            />
          )}
        </form.AppField>
      </section>
    );
  },
});
