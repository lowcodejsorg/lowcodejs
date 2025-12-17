import { CodeEditor } from "@/components/common/code-editor";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import { FIELD_TYPE, type Paginated, type Table } from "@/lib/entity";
import { QueryClient } from "@/lib/query-client";
import {
  generateAfterSaveCode,
  generateBeforeSaveCode,
  generateOnLoadCode,
} from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { SaveIcon } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface FormTableMethodData {
  methods: {
    onLoad: { code: string };
    beforeSave: { code: string };
    afterSave: { code: string };
  };
}

interface FormTableMethodProps {
  onClose: () => void;
  table: Table;
}
export function FormTableMethod({ onClose, table }: FormTableMethodProps) {
  const { t } = useI18n();

  const search = useSearch({
    strict: false,
  });

  // Função para gerar placeholders dinâmicos baseados nos campos da tabela
  const getFieldPlaceholders = React.useCallback(() => {
    if (!table?.fields) return {};

    const placeholders: Record<string, unknown> = {};
    const tableName =
      table.name?.toLowerCase().replace(/\s+/g, "_") || "tabela";

    for (const field of table.fields) {
      const fieldName =
        field.name?.toLowerCase().replace(/\s+/g, "_") || "campo";
      const placeholderName = `$${tableName}_${fieldName}`;

      // Valor mock baseado no tipo do campo
      let mockValue;
      switch (field.type) {
        case FIELD_TYPE.DATE:
          mockValue = new Date().toISOString();
          break;
        case FIELD_TYPE.TEXT_SHORT:
        case FIELD_TYPE.TEXT_LONG:
          mockValue = `Valor de ${field.name}`;
          break;
        case FIELD_TYPE.DROPDOWN:
          mockValue = field.configuration?.dropdown?.[0] || "Opção 1";
          break;
        case FIELD_TYPE.FILE:
          mockValue = "arquivo.pdf";
          break;
        default:
          mockValue = `Valor de ${field.name}`;
      }

      placeholders[placeholderName] = mockValue;
    }

    return placeholders;
  }, [table]);

  const execute = useMutation({
    mutationFn: async function (payload: object) {
      const route = "/tables/".concat(table.slug);
      const response = await API.put<Table>(route, payload);
      return response.data;
    },
    onSuccess(response) {
      onClose();

      toast(t("TABLE_TOAST_COLLECTION_UPDATED", "Coleção atualizada!"), {
        className: "!bg-green-600 !text-white !border-green-600",
        description: t(
          "TABLE_TOAST_COLLECTION_UPDATED_DESCRIPTION",
          `A coleção "${response.name}" foi atualizada com sucesso`
        ),
        descriptionClassName: "!text-white",
        closeButton: true,
      });

      QueryClient.setQueryData<Table>(
        ["/tables/".concat(response.slug), response.slug],
        response
      );

      QueryClient.setQueryData<Paginated<Table[]>>(
        ["/tables/paginated", search],
        (old) => {
          if (!old) return old;

          return {
            meta: old.meta,
            data: old.data.map((item) => {
              if (item._id === response._id) {
                return response;
              }
              return item;
            }),
          };
        }
      );
    },
    onError(error) {
      console.error(error);
    },
  });

  const form = useForm<FormTableMethodData>({
    defaultValues: {
      methods: {
        onLoad: { code: "" },
        beforeSave: { code: "" },
        afterSave: { code: "" },
      },
    },
  });

  // Resetar form quando table carrega com valores salvos ou templates
  React.useEffect(() => {
    if (table?.methods) {
      const placeholders = getFieldPlaceholders();

      form.reset({
        methods: {
          onLoad: {
            code:
              table.methods.onLoad?.code || generateOnLoadCode(placeholders),
          },
          beforeSave: {
            code:
              table.methods.beforeSave?.code ||
              generateBeforeSaveCode(placeholders),
          },
          afterSave: {
            code:
              table.methods.afterSave?.code ||
              generateAfterSaveCode(placeholders),
          },
        },
      });
    }
  }, [table?.methods, getFieldPlaceholders, form]);

  const onSubmit = form.handleSubmit(async (payload) => {
    if (execute.status === "pending") return;

    await execute.mutateAsync({
      ...table,
      description: table?.description ?? null,
      logo: table?.logo?._id ?? null,
      fields: table?.fields?.flatMap((f) => f._id),
      configuration: {
        ...table?.configuration,
        administrators: table?.configuration?.administrators?.flatMap(
          (u) => u._id
        ),
      },
      methods: {
        ...table?.methods,
        onLoad: {
          ...table?.methods?.onLoad,
          code: payload?.methods?.onLoad?.code ?? null,
        },
        beforeSave: {
          ...table?.methods?.beforeSave,
          code: payload?.methods?.beforeSave?.code ?? null,
        },
        afterSave: {
          ...table?.methods?.afterSave,
          code: payload?.methods?.afterSave?.code ?? null,
        },
      },
    });
  });

  const handleRefreshBeforeSave = () => {
    const placeholders = getFieldPlaceholders();
    form.setValue(
      "methods.beforeSave.code",
      generateBeforeSaveCode(placeholders)
    );
  };

  const handleRefreshOnLoad = () => {
    const placeholders = getFieldPlaceholders();
    form.setValue("methods.onLoad.code", generateOnLoadCode(placeholders));
  };

  const handleRefreshAfterSave = () => {
    const placeholders = getFieldPlaceholders();
    form.setValue(
      "methods.afterSave.code",
      generateAfterSaveCode(placeholders)
    );
  };

  // Aguarda table estar carregada antes de renderizar
  if (!table?.methods) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
        <span className="ml-2">Carregando métodos...</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4 w-full">
        <Tabs defaultValue="on-load" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="on-load">Ao Carregar</TabsTrigger>
            <TabsTrigger value="before-save">Antes de Salvar</TabsTrigger>
            <TabsTrigger value="after-save">Após salvar</TabsTrigger>
          </TabsList>

          <TabsContent value="on-load" className="space-y-4">
            <FormField
              control={form.control}
              name="methods.onLoad.code"
              rules={{
                validate: (value) => {
                  if (!value || value.trim() === "")
                    return "Código é obrigatório";
                  return true;
                },
              }}
              render={() => (
                <FormItem>
                  <FormControl>
                    <CodeEditor
                      control={form.control}
                      name="methods.onLoad.code"
                      table={table}
                      label="On Load Script"
                      fileName="on-load.js"
                      onRefresh={handleRefreshOnLoad}
                    />
                  </FormControl>
                  <FormMessage className="text-right text-destructive" />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="before-save" className="space-y-4">
            <FormField
              control={form.control}
              name="methods.beforeSave.code"
              rules={{
                validate: (value) => {
                  if (!value || value.trim() === "")
                    return "Código é obrigatório";
                  return true;
                },
              }}
              render={() => (
                <FormItem>
                  <FormControl>
                    <CodeEditor
                      control={form.control}
                      name="methods.beforeSave.code"
                      table={table}
                      label="Before Save Script"
                      fileName="before-save.js"
                      onRefresh={handleRefreshBeforeSave}
                    />
                  </FormControl>
                  <FormMessage className="text-right text-destructive" />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="after-save" className="space-y-4">
            <FormField
              control={form.control}
              name="methods.afterSave.code"
              rules={{
                validate: (value) => {
                  if (!value || value.trim() === "")
                    return "Código é obrigatório";
                  return true;
                },
              }}
              render={() => (
                <FormItem>
                  <FormControl>
                    <CodeEditor
                      control={form.control}
                      name="methods.afterSave.code"
                      table={table}
                      label="After Save Script"
                      fileName="after-save.js"
                      onRefresh={handleRefreshAfterSave}
                    />
                  </FormControl>
                  <FormMessage className="text-right text-destructive" />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        {/* Footer com ações */}
        <div className="flex items-center justify-end pt-4 border-t">
          <Button
            type="submit"
            size="sm"
            disabled={execute.status === "pending"}
          >
            {execute.status === "pending" && <Spinner />}
            <SaveIcon className="w-4 h-4 mr-2" />
            <span>Salvar Métodos</span>
          </Button>
        </div>
      </form>
    </Form>
  );
}
