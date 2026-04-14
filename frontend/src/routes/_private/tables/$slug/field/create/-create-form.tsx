import { useStore } from '@tanstack/react-form';
import { FileTextIcon } from 'lucide-react';
import z from 'zod';

import type { TreeNode } from '@/components/common/tree-editor/tree-list';
import { withForm } from '@/integrations/tanstack-form/form-hook';
import { E_FIELD_FORMAT, E_FIELD_TYPE } from '@/lib/constant';
import type { IDropdown } from '@/lib/interfaces';

export const FieldCreateSchema = z.object({
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
  category: z.array(z.custom<TreeNode>()).default([]),
  multiple: z.boolean().default(false),
  visibilityList: z.string().default('HIDDEN'),
  visibilityForm: z.string().default('HIDDEN'),
  visibilityDetail: z.string().default('HIDDEN'),
  required: z.boolean().default(false),
  widthInForm: z.number().default(50),
  widthInList: z.number().default(10),
});

export type FieldCreateFormValues = z.infer<typeof FieldCreateSchema>;

export const fieldCreateFormDefaultValues: FieldCreateFormValues = {
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
  visibilityList: 'HIDDEN',
  visibilityForm: 'HIDDEN',
  visibilityDetail: 'HIDDEN',
  required: false,
  widthInForm: 50,
  widthInList: 10,
};

export const CreateFieldFormFields = withForm({
  defaultValues: fieldCreateFormDefaultValues,
  props: {
    isPending: false,
    tableSlug: '' as string,
    blockedTypes: [] as Array<string>,
    defaultFieldType: undefined as string | undefined,
  },
  render: function Render({
    form,
    isPending,
    tableSlug,
    blockedTypes,
    defaultFieldType,
  }) {
    // useStore para valores reativos do form
    const fieldType = useStore(form.store, (state) => state.values.type);
    const relationshipTableSlug = useStore(
      form.store,
      (state) => state.values.relationship.tableSlug,
    );
    const textLongFormat = useStore(form.store, (state) => state.values.format);
    const dropdownOptions = useStore(
      form.store,
      (state) => state.values.dropdown,
    );
    const categoryOptions = useStore(
      form.store,
      (state) => state.values.category,
    );
    const relationshipFieldSlug = useStore(
      form.store,
      (state) => state.values.relationship.fieldSlug,
    );

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

    const showMultiple =
      isDropdown ||
      isFile ||
      isRelationship ||
      isFieldGroup ||
      isCategory ||
      isUser;
    const showRequired = !isReaction && !isEvaluation;

    return (
      <section
        data-test-id="field-create-form-fields"
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
              disabled={isPending}
              icon={<FileTextIcon />}
              required
            />
          )}
        </form.AppField>

        {/* Campo Tipo (oculto quando field-type=FIELD_GROUP na query) */}
        {defaultFieldType !== E_FIELD_TYPE.FIELD_GROUP && (
          <form.AppField
            name="type"
            validators={{
              onChange: ({ value }) => {
                if (!value || value.trim() === '') {
                  return 'Tipo é obrigatório';
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <field.TableFieldTypeSelect
                label="Tipo"
                placeholder="Selecione o tipo do campo"
                disabled={isPending || Boolean(defaultFieldType)}
                blockedTypes={blockedTypes}
                required
                onTypeChange={(type) => {
                  // Limpar metadados residuais de campos condicionais
                  // que podem ter erros de validacao de um tipo anterior
                  const conditionalFields = [
                    'format',
                    'defaultValue',
                    'dropdown',
                    'category',
                    'relationship.tableId',
                    'relationship.tableSlug',
                    'relationship.fieldId',
                    'relationship.fieldSlug',
                    'relationship.order',
                  ];
                  for (const fieldName of conditionalFields) {
                    if (form.getFieldMeta(fieldName)) {
                      form.deleteField(fieldName);
                    }
                  }

                  // Restaurar valores padrao dos campos condicionais
                  if (type === E_FIELD_TYPE.TEXT_LONG) {
                    form.setFieldValue('format', E_FIELD_FORMAT.PLAIN_TEXT);
                  } else {
                    form.setFieldValue('format', '');
                  }
                  form.setFieldValue('defaultValue', '');
                  form.setFieldValue('dropdown', []);
                  form.setFieldValue('category', []);
                  form.setFieldValue(
                    'relationship',
                    fieldCreateFormDefaultValues.relationship,
                  );
                }}
              />
            )}
          </form.AppField>
        )}

        {/* Texto informativo para grupo de campos (seleção manual) */}
        {isFieldGroup && defaultFieldType !== E_FIELD_TYPE.FIELD_GROUP && (
          <p className="text-sm text-muted-foreground">
            O grupo de campos é composto por outros campos que devem ser
            configurados nas configurações da tabela em "Gerenciar grupo de
            campos".
          </p>
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
                disabled={isPending}
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
                disabled={isPending}
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
                disabled={isPending}
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
                disabled={isPending}
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
                disabled={isPending}
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
                disabled={isPending}
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
                disabled={isPending}
                fieldType={E_FIELD_TYPE.DATE}
                required
              />
            )}
          </form.AppField>
        )}

        {/* Campo Valor Padrão (DATE) */}
        {isDate && (
          <form.AppField name="defaultValue">
            {(field) => (
              <field.TableFieldDateDefaultValue
                label="Valor padrão"
                disabled={isPending}
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
                disabled={isPending}
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
                disabled={isPending}
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
                disabled={isPending}
                required
              />
            )}
          </form.AppField>
        )}

        {/* Campo Valor Padrão (RELATIONSHIP) */}
        {isRelationship && relationshipTableSlug && relationshipFieldSlug && (
          <form.AppField name="defaultValue">
            {(field) => (
              <field.TableFieldRelationshipDefaultValue
                label="Valor padrão"
                disabled={isPending}
                tableSlug={relationshipTableSlug}
                fieldSlug={relationshipFieldSlug}
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

        {/* Campo Valor Padrão (CATEGORY) */}
        {isCategory && categoryOptions.length > 0 && (
          <form.AppField name="defaultValue">
            {(field) => (
              <field.TableFieldCategoryDefaultValue
                label="Valor padrão"
                disabled={isPending}
                categories={categoryOptions}
              />
            )}
          </form.AppField>
        )}

        {/* Campo Valor Padrão (USER) */}
        {isUser && (
          <form.AppField name="defaultValue">
            {(field) => (
              <field.TableFieldUserDefaultValue
                label="Valor padrão"
                disabled={isPending}
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
                disabled={isPending}
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
                disabled={isPending}
              />
            )}
          </form.AppField>
        )}

        {/* Campo Listagem - Desabilitado por enquanto a solicitação para desabilitar
        foi solicitada em 21/03/2026 pois não fazia mais sentido para o que temos hoje, e será analisado se vai continuar ou não. */}
        {/* <form.AppField name="showInList">
          {(field) => (
            <field.FieldBooleanSwitch
              label="Formato de listagem"
              description="Exibir no formato de listagem?"
              disabled={isPending}
            />
          )}
        </form.AppField> */}
      </section>
    );
  },
});
