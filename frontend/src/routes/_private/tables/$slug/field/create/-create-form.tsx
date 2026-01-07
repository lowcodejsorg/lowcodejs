import { useStore } from '@tanstack/react-form';
import { FileTextIcon } from 'lucide-react';
import z from 'zod';

import type { ComboboxOption } from '@/components/ui/combobox';
import type { TreeNode } from '@/components/common/-tree-list';
import { withForm } from '@/integrations/tanstack-form/form-hook';
import { E_FIELD_TYPE } from '@/lib/constant';

export const FieldCreateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(40),
  type: z.string().min(1, 'Tipo é obrigatório'),
  configuration: z.object({
    format: z.string().default(''),
    defaultValue: z.string().default(''),
    dropdown: z.array(z.custom<ComboboxOption>()).default([]),
    relationship: z.object({
      tableId: z.string().default(''),
      tableSlug: z.string().default(''),
      fieldId: z.string().default(''),
      fieldSlug: z.string().default(''),
      order: z.string().default(''),
    }),
    category: z.array(z.custom<TreeNode>()).default([]),
    multiple: z.boolean().default(false),
    filtering: z.boolean().default(false),
    listing: z.boolean().default(false),
    required: z.boolean().default(false),
  }),
});

export type FieldCreateFormValues = z.infer<typeof FieldCreateSchema>;

export const fieldCreateFormDefaultValues: FieldCreateFormValues = {
  name: '',
  type: '',
  configuration: {
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
    filtering: false,
    listing: false,
    required: false,
  },
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
      (state) => state.values.configuration.relationship.tableSlug,
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

    const showMultiple =
      isDropdown || isFile || isRelationship || isFieldGroup || isCategory;
    const showFiltering = !isReaction && !isFile;
    const showRequired = !isReaction && !isEvaluation;

    return (
      <section className="space-y-4 p-2">
        {/* @ts-expect-error TanStack Form type depth issue with nested configuration */}
        <form.AppField
          name="name"
          validators={{
            onBlur: ({ value }) => {
              if (!value || value.trim() === '') {
                return { message: 'Nome é obrigatório' };
              }
              if (value.length > 40) {
                return { message: 'O nome deve ter no máximo 40 caracteres' };
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
              onBlur: ({ value }) => {
                if (!value || value.trim() === '') {
                  return { message: 'Tipo é obrigatório' };
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
            name="configuration.format"
            validators={{
              onBlur: ({ value }) => {
                if (!value || value.trim() === '') {
                  return { message: 'Formato é obrigatório' };
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
                fieldType="TEXT_SHORT"
                required
              />
            )}
          </form.AppField>
        )}

        {/* Campo Valor Padrão (TEXT_SHORT) */}
        {isTextShort && (
          <form.AppField name="configuration.defaultValue">
            {(field) => (
              <field.FieldText
                label="Valor padrão"
                placeholder="Valor padrão (deixe em branco se não houver)"
                disabled={isPending}
              />
            )}
          </form.AppField>
        )}

        {/* Campo Valor Padrão (TEXT_LONG) */}
        {isTextLong && (
          <form.AppField name="configuration.defaultValue">
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
            name="configuration.dropdown"
            validators={{
              onBlur: ({ value }) => {
                if (!value || value.length === 0) {
                  return { message: 'Adicione ao menos uma opção' };
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

        {/* Campo Formato Data */}
        {isDate && (
          <form.AppField
            name="configuration.format"
            validators={{
              onBlur: ({ value }) => {
                if (!value || value.trim() === '') {
                  return { message: 'Formato da data é obrigatório' };
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
                fieldType="DATE"
                required
              />
            )}
          </form.AppField>
        )}

        {/* Campo Tabela de Relacionamento */}
        {isRelationship && (
          <form.AppField
            name="configuration.relationship.tableId"
            validators={{
              onBlur: ({ value }) => {
                if (!value || value.trim() === '') {
                  return { message: 'Tabela de relacionamento é obrigatória' };
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
                  form.setFieldValue(
                    'configuration.relationship.tableSlug',
                    slug,
                  );
                  form.setFieldValue('configuration.relationship.fieldId', '');
                  form.setFieldValue(
                    'configuration.relationship.fieldSlug',
                    '',
                  );
                }}
                required
              />
            )}
          </form.AppField>
        )}

        {/* Campo de Relacionamento (coluna) */}
        {isRelationship && relationshipTableSlug && (
          <form.AppField
            name="configuration.relationship.fieldId"
            validators={{
              onBlur: ({ value }) => {
                if (!value || value.trim() === '') {
                  return { message: 'Campo é obrigatório' };
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
                  form.setFieldValue(
                    'configuration.relationship.fieldSlug',
                    slug,
                  );
                }}
                required
              />
            )}
          </form.AppField>
        )}

        {/* Campo Ordem (Relacionamento) */}
        {isRelationship && (
          <form.AppField
            name="configuration.relationship.order"
            validators={{
              onBlur: ({ value }) => {
                if (!value || value.trim() === '') {
                  return { message: 'Ordem é obrigatória' };
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

        {/* Campo Categoria (Tree) */}
        {isCategory && (
          <form.AppField
            name="configuration.category"
            validators={{
              onBlur: ({ value }) => {
                if (!value || value.length === 0) {
                  return { message: 'Estrutura da categoria é obrigatória' };
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
          <form.AppField name="configuration.multiple">
            {(field) => (
              <field.FieldBooleanSwitch
                label="Permitir múltiplos"
                description="Este campo deve permitir múltiplos valores?"
                disabled={isPending}
              />
            )}
          </form.AppField>
        )}

        {/* Campo Filtro */}
        {showFiltering && (
          <form.AppField name="configuration.filtering">
            {(field) => (
              <field.FieldBooleanSwitch
                label="Usar no filtro"
                description="Usar este campo para filtrar os dados?"
                disabled={isPending}
              />
            )}
          </form.AppField>
        )}

        {/* Campo Listagem */}
        <form.AppField name="configuration.listing">
          {(field) => (
            <field.FieldBooleanSwitch
              label="Exibir na listagem"
              description="Exibir este campo na listagem?"
              disabled={isPending}
            />
          )}
        </form.AppField>

        {/* Campo Obrigatoriedade */}
        {showRequired && (
          <form.AppField name="configuration.required">
            {(field) => (
              <field.FieldBooleanSwitch
                label="Obrigatoriedade"
                description="Este campo é obrigatório?"
                disabled={isPending}
              />
            )}
          </form.AppField>
        )}
      </section>
    );
  },
});
