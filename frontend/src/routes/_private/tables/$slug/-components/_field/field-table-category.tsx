import { TreeEditor } from "@/components/common/tree-editor";
import type { TreeNode } from "@/components/common/tree-list";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useI18n } from "@/hooks/i18.hook";
import { cn } from "@/lib/utils";
import { useFormContext } from "react-hook-form";

interface Props {
  required?: boolean;
  defaultValue?: TreeNode[];
}

export function FieldTableCategory({ required, defaultValue = [] }: Props) {
  const { t } = useI18n();
  const form = useFormContext();

  return (
    <FormField
      control={form.control}
      name="configuration.category"
      defaultValue={defaultValue}
      rules={{
        validate: (value) => {
          if (!value && required)
            return t(
              "TABLE_ROUTE_SHEET_INTERNAL_FIELD_TREE_REQUIRED_ERROR",
              "Campo é obrigatório"
            );

          if (value && Array.isArray(value) && value.length === 0)
            return t(
              "TABLE_ROUTE_SHEET_INTERNAL_FIELD_TREE_EMPTY_ERROR",
              "Adicione ao menos uma opção"
            );

          return true;
        },
      }}
      render={({ field }) => {
        const hasError = !!form.formState.errors[field.name];
        return (
          <FormItem className="space-y-1">
            <FormLabel className="data-[error=true]:text-destructive">
              {t(
                "TABLE_ROUTE_SHEET_INTERNAL_FIELD_TREE_LABEL",
                "Estrutura da árvore"
              )}{" "}
              {required && <span className="text-destructive">*</span>}
            </FormLabel>
            <FormControl>
              <TreeEditor
                initialData={field.value ?? []}
                onChange={field.onChange}
                className={cn(hasError && "border-destructive")}
              />
            </FormControl>
            <FormMessage className="text-right text-destructive" />
          </FormItem>
        );
      }}
    />
  );
}
