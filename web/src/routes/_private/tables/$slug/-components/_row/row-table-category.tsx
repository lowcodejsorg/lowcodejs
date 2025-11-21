import { TreeList } from "@/components/common/tree-list";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useI18n } from "@/hooks/i18.hook";
import type { Field } from "@/lib/entity";
import { cn } from "@/lib/utils";
import React from "react";
import { useFormContext } from "react-hook-form";

interface Props {
  field: Field;
  isMultiple?: boolean;
  required?: boolean;
  defaultValue?: string[];
  name?: string;
}

export function RowTableCategory({
  field: fieldProp,
  isMultiple = false,
  required,
  name,
  defaultValue = [],
}: Props): React.ReactElement {
  const { t } = useI18n();
  const form = useFormContext();
  const [expandedIds, setExpandedIds] = React.useState<string[]>([
    ...(defaultValue?.flatMap((v) => v) ?? []),
  ]);

  return (
    <FormField
      control={form.control}
      name={name ?? fieldProp.slug}
      defaultValue={defaultValue}
      rules={{
        validate: (value) => {
          if (!value && required)
            return fieldProp.name
              .concat(" ")
              .concat(
                t(
                  "TABLE_ROUTE_SHEET_INTERNAL_REGISTER_FIELD_REQUIRED_ERROR",
                  "é obrigatório"
                ) as string
              );

          if (required && value && Array.isArray(value) && value.length === 0)
            return t(
              "TABLE_ROUTE_SHEET_INTERNAL_REGISTER_AT_LEAST_ONE_OPTION_ERROR",
              "Adicione ao menos uma opção"
            );

          return true;
        },
      }}
      render={({ field: f }) => {
        const hasError = !!form.formState.errors[f.name];

        return (
          <FormItem>
            <FormLabel className="data-[error=true]:text-destructive">
              {fieldProp.name}{" "}
              {required && <span className="text-destructive">*</span>}
            </FormLabel>
            <FormControl>
              <TreeList
                data={fieldProp?.configuration?.category ?? []}
                selectedIds={f.value ?? []}
                onSelectionChange={f.onChange}
                expandedIds={expandedIds}
                onExpandedChange={setExpandedIds}
                multiSelect={isMultiple}
                showCheckboxes
                className={cn(
                  "w-full",
                  hasError && "border-destructive text-destructive"
                )}
              />
            </FormControl>
            <FormMessage className="text-right text-destructive" />
          </FormItem>
        );
      }}
    />
  );
}
