import { useStore } from '@tanstack/react-form';
import { FileTextIcon } from 'lucide-react';
import z from 'zod';

import type { Option } from '@/components/common/-multi-selector';
import type { TreeNode } from '@/components/common/-tree-list';
import { withForm } from '@/integrations/tanstack-form/form-hook';
import { FIELD_TYPE } from '@/lib/constant';

export const FieldUpdateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(40),
  type: z.string().min(1, 'Tipo é obrigatório'),
  configuration: z.object({
    format: z.string().default(''),
    defaultValue: z.string().default(''),
    dropdown: z.array(z.custom<Option>()).default([]),
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
  trashed: z.boolean().default(false),
});

export type FieldUpdateFormValues = z.infer<typeof FieldUpdateSchema>;

export const fieldUpdateFormDefaultValues: FieldUpdateFormValues = {
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
  trashed: false,
};

export const UpdateFieldFormFields = withForm({
  defaultValues: fieldUpdateFormDefaultValues,
  props: {
    isPending: false,
    mode: 'show' as 'show' | 'edit',
    tableSlug: '' as string,
  },
  render: function Render({ form, isPending, mode, tableSlug }) {
    // useStore para valores reativos do form
    const fieldType = useStore(form.store, (state) => state.values.type);
    const isTextShort = fieldType === FIELD_TYPE.TEXT_SHORT;
    const isTextLong = fieldType === FIELD_TYPE.TEXT_LONG;
    const isDropdown = fieldType === FIELD_TYPE.DROPDOWN;
    const isDate = fieldType === FIELD_TYPE.DATE;
    const isRelationship = fieldType === FIELD_TYPE.RELATIONSHIP;
    const isCategory = fieldType === FIELD_TYPE.CATEGORY;
    const isFile = fieldType === FIELD_TYPE.FILE;
    const isFieldGroup = fieldType === FIELD_TYPE.FIELD_GROUP;
    const isReaction = fieldType === FIELD_TYPE.REACTION;
    const isEvaluation = fieldType === FIELD_TYPE.EVALUATION;

    // useStore para reatividade - re-renderiza quando tableSlug muda
    const relationshipTableSlug = useStore(
      form.store,
      (state) => state.values.configuration.relationship.tableSlug,
    );

    const showMultiple =
      isDropdown || isFile || isRelationship || isFieldGroup || isCategory;
    const showFiltering = !isReaction && !isFile;
    const showRequired = !isReaction && !isEvaluation;

    const isDisabled = mode === 'show' || isPending;

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
            <field.TextField
              label="Nome"
              placeholder="Nome do campo"
              disabled={isDisabled}
              icon={<FileTextIcon />}
              required
            />
          )}
        </form.AppField>

        {/* Campo Tipo (sempre disabled no update) */}
        <form.AppField name="type">
          {(field) => (
            <field.FieldTypeSelectField
              label="Tipo"
              placeholder="Tipo do campo"
              disabled={true}
              blockedTypes={[]}
            />
          )}
        </form.AppField>

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
              <field.FieldFormatSelectField
                label="Formato"
                placeholder="Selecione um formato para o campo"
                disabled={isDisabled}
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
              <field.TextField
                label="Valor padrão"
                placeholder="Valor padrão (deixe em branco se não houver)"
                disabled={isDisabled}
              />
            )}
          </form.AppField>
        )}

        {/* Campo Valor Padrão (TEXT_LONG) */}
        {isTextLong && (
          <form.AppField name="configuration.defaultValue">
            {(field) => (
              <field.TextareaField
                label="Valor padrão"
                placeholder="Valor padrão (Se deixar em branco, o campo ficará vazio)"
                disabled={isDisabled}
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
              <field.DropdownOptionsField
                label="Opções"
                placeholder="Escreva e adicione"
                disabled={isDisabled}
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
              <field.FieldFormatSelectField
                label="Formato da data"
                placeholder="Selecione o formato da data"
                disabled={isDisabled}
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
              <field.RelationshipTableSelectField
                label="Tabela de relacionamento"
                placeholder="Selecione uma tabela"
                disabled={isDisabled}
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
              <field.RelationshipFieldSelectField
                label="Campo de relacionamento"
                placeholder="Selecione um campo"
                disabled={isDisabled}
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
              <field.RelationshipOrderSelectField
                label="Ordem"
                placeholder="Selecione uma ordem"
                disabled={isDisabled}
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
              <field.CategoryTreeField
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
              <field.BooleanSwitchField
                label="Permitir múltiplos"
                description="Este campo deve permitir múltiplos valores?"
                disabled={isDisabled}
              />
            )}
          </form.AppField>
        )}

        {/* Campo Filtro */}
        {showFiltering && (
          <form.AppField name="configuration.filtering">
            {(field) => (
              <field.BooleanSwitchField
                label="Usar no filtro"
                description="Usar este campo para filtrar os dados?"
                disabled={isDisabled}
              />
            )}
          </form.AppField>
        )}

        {/* Campo Listagem */}
        <form.AppField name="configuration.listing">
          {(field) => (
            <field.BooleanSwitchField
              label="Exibir na listagem"
              description="Exibir este campo na listagem?"
              disabled={isDisabled}
            />
          )}
        </form.AppField>

        {/* Campo Obrigatoriedade */}
        {showRequired && (
          <form.AppField name="configuration.required">
            {(field) => (
              <field.BooleanSwitchField
                label="Obrigatoriedade"
                description="Este campo é obrigatório?"
                disabled={isDisabled}
              />
            )}
          </form.AppField>
        )}

        {/* Campo Lixeira */}
        <form.AppField name="trashed">
          {(field) => (
            <field.BooleanSwitchField
              label="Enviar para lixeira"
              description="Enviar este campo para a lixeira?"
              disabled={isDisabled}
              className="border-destructive/50"
            />
          )}
        </form.AppField>
      </section>
    );
  },
});
