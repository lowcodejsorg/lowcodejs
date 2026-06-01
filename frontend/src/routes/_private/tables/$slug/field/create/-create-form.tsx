import { useStore } from '@tanstack/react-form';
import { FileTextIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import z from 'zod';

import { TableFieldRelationshipLabelComposer } from '@/components/common/dynamic-table/table-config/table-field-relationship-label-composer';
import type { TreeNode } from '@/components/common/tree-editor/tree-list';
import { withForm } from '@/integrations/tanstack-form/form-hook';
import { E_FIELD_FORMAT, E_FIELD_TYPE } from '@/lib/constant';
import {
  FIELD_NAME_MAX_LENGTH,
  FIELD_SLUG_MAX_LENGTH,
  getFieldSlugError,
  normalizeFieldSlug,
} from '@/lib/field-slug';
import type { IDropdown, IRelationshipLabelPart } from '@/lib/interfaces';

export const FieldCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Título exibido é obrigatório')
    .max(
      FIELD_NAME_MAX_LENGTH,
      `O título exibido deve ter no máximo ${FIELD_NAME_MAX_LENGTH} caracteres`,
    ),
  slug: z
    .string()
    .min(1, 'Slug é obrigatório')
    .max(
      FIELD_SLUG_MAX_LENGTH,
      `O slug deve ter no máximo ${FIELD_SLUG_MAX_LENGTH} caracteres`,
    )
    .refine((value) => !getFieldSlugError(value), {
      message: 'Use apenas letras minúsculas, números e hífens',
    }),
  tip: z
    .string()
    .max(500, 'A dica deve ter no máximo 500 caracteres')
    .default(''),
  type: z.string().min(1, 'Tipo é obrigatório'),
  format: z.string().default(''),
  defaultValue: z.string().default(''),
  dropdown: z.array(z.custom<IDropdown>()).default([]),
  allowCustomDropdownOptions: z.boolean().default(false),
  allowCreateRelationshipRecords: z.boolean().default(false),
  relationship: z.object({
    tableId: z.string().default(''),
    tableSlug: z.string().default(''),
    fieldId: z.string().default(''),
    fieldSlug: z.string().default(''),
    order: z.string().default(''),
    customLabel: z.boolean().default(false),
    labelParts: z.array(z.custom<IRelationshipLabelPart>()).default([]),
    labelSeparator: z.string().default(' - '),
  }),
  category: z.array(z.custom<TreeNode>()).default([]),
  multiple: z.boolean().default(false),
  showInFilter: z.boolean().default(true),
  showInForm: z.boolean().default(true),
  showInDetail: z.boolean().default(true),
  showInList: z.boolean().default(false),
  required: z.boolean().default(false),
  widthInForm: z.number().default(50),
  widthInList: z.number().default(10),
});

export type FieldCreateFormValues = z.infer<typeof FieldCreateSchema>;

export const fieldCreateFormDefaultValues: FieldCreateFormValues = {
  name: '',
  slug: '',
  tip: '',
  type: '',
  format: '',
  defaultValue: '',
  dropdown: [],
  allowCustomDropdownOptions: false,
  allowCreateRelationshipRecords: false,
  relationship: {
    tableId: '',
    tableSlug: '',
    fieldId: '',
    fieldSlug: '',
    order: '',
    customLabel: false,
    labelParts: [],
    labelSeparator: ' - ',
  },
  category: [],
  multiple: false,
  showInFilter: true,
  showInForm: true,
  showInDetail: true,
  showInList: false,
  required: false,
  widthInForm: 50,
  widthInList: 10,
};

// Toggles de exibição do grupo (formulário/detalhes) isolados em um componente
// próprio para reduzir a profundidade de inferência de tipos no form principal.
const FieldGroupDisplayToggles = withForm({
  defaultValues: fieldCreateFormDefaultValues,
  props: {
    isPending: false,
  },
  render: function Render({ form, isPending }) {
    return (
      <>
        {/* @ts-expect-error TanStack Form type depth issue with nested configuration */}
        <form.AppField name="showInForm">
          {(field) => (
            <field.FieldBooleanSwitch
              label="Exibir no formulário"
              description="Exibir este grupo no formulário de adicionar/editar registro?"
              disabled={isPending}
            />
          )}
        </form.AppField>
        <form.AppField name="showInDetail">
          {(field) => (
            <field.FieldBooleanSwitch
              label="Exibir nos detalhes"
              description="Exibir este grupo na página de detalhes do registro?"
              disabled={isPending}
            />
          )}
        </form.AppField>
      </>
    );
  },
});

export const CreateFieldFormFields = withForm({
  defaultValues: fieldCreateFormDefaultValues,
  props: {
    isPending: false,
    tableSlug: '',
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
    const fieldName = useStore(form.store, (state) => state.values.name);
    const slugManuallyEdited = useRef(false);
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
    const relationshipCustomLabel = useStore(
      form.store,
      (state) => state.values.relationship.customLabel,
    );
    const relationshipLabelParts = useStore(
      form.store,
      (state) => state.values.relationship.labelParts,
    );
    const relationshipLabelSeparator = useStore(
      form.store,
      (state) => state.values.relationship.labelSeparator,
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

    useEffect(() => {
      if (slugManuallyEdited.current) return;
      form.setFieldValue('slug', normalizeFieldSlug(fieldName));
    }, [fieldName, form]);

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
        <form.AppField
          name="name"
          validators={{
            onChange: ({ value }) => {
              if (!value || value.trim() === '') {
                return 'Título exibido é obrigatório';
              }
              if (value.length > FIELD_NAME_MAX_LENGTH) {
                return `O título exibido deve ter no máximo ${FIELD_NAME_MAX_LENGTH} caracteres`;
              }
              return undefined;
            },
          }}
        >
          {(field) => (
            <field.FieldTextarea
              label="Título exibido"
              placeholder="Título exibido para o usuário final"
              disabled={isPending}
              rows={3}
              required
            />
          )}
        </form.AppField>

        <form.AppField
          name="slug"
          validators={{
            onChange: ({ value }) => getFieldSlugError(value),
          }}
        >
          {(field) => (
            <field.FieldText
              label="Slug"
              placeholder="nome-slug-campo"
              disabled={isPending}
              icon={<FileTextIcon />}
              description="Identificador técnico usado em consultas e integrações"
              onChangeTransform={(value) => {
                slugManuallyEdited.current = true;
                return normalizeFieldSlug(value);
              }}
              required
            />
          )}
        </form.AppField>

        <form.AppField name="tip">
          {(field) => (
            <field.FieldTextarea
              label="Dica do campo"
              placeholder="Texto de ajuda exibido no formulário"
              disabled={isPending}
              rows={2}
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
                    'allowCustomDropdownOptions',
                    'allowCreateRelationshipRecords',
                  ];
                  for (const conditionalField of conditionalFields) {
                    if (form.getFieldMeta(conditionalField)) {
                      form.deleteField(conditionalField);
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
                  form.setFieldValue('allowCustomDropdownOptions', false);
                  form.setFieldValue('allowCreateRelationshipRecords', false);
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

        {isDropdown && (
          <form.AppField name="allowCustomDropdownOptions">
            {(field) => (
              <field.FieldBooleanSwitch
                label="Permitir usuário inserir novas tags"
                description="Permite salvar uma nova opção quando o usuário digitar um valor que ainda não existe."
                disabled={isPending}
              />
            )}
          </form.AppField>
        )}

        {isRelationship && (
          <form.AppField name="allowCreateRelationshipRecords">
            {(field) => (
              <field.FieldBooleanSwitch
                label="Permitir adicionar novos registros"
                description="Exibe a opção Novo para criar um registro na tabela relacionada durante o preenchimento."
                disabled={isPending}
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

        {/* Personalização do label (relacionamento) */}
        {isRelationship && relationshipTableSlug && (
          <form.AppField name="relationship.customLabel">
            {(field) => (
              <field.FieldBooleanSwitch
                label="Personalizar exibição das opções"
                description="Por padrão a opção exibe apenas o campo principal. Ative para compor o label com um ou mais campos (inclusive de tabelas relacionadas) e escolher o separador."
                disabled={isPending}
              />
            )}
          </form.AppField>
        )}

        {/* Compositor de label (relacionamento) */}
        {isRelationship && relationshipTableSlug && relationshipCustomLabel && (
          <TableFieldRelationshipLabelComposer
            rootTableSlug={relationshipTableSlug}
            parts={relationshipLabelParts}
            separator={relationshipLabelSeparator}
            disabled={isPending}
            onChange={(parts, separator) => {
              form.setFieldValue('relationship.labelParts', parts);
              form.setFieldValue('relationship.labelSeparator', separator);
            }}
          />
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

        {/* Exibição do grupo de campos: formulário e/ou detalhes.
            Extraído em componente próprio para não estourar a profundidade
            de tipos do TanStack Form neste render. */}
        {isFieldGroup && (
          <FieldGroupDisplayToggles
            form={form}
            isPending={isPending}
          />
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
