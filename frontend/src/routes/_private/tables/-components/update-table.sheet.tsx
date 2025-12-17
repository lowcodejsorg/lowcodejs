import type { SearchableOption } from "@/components/common/searchable-select";
import {
  SimpleSelect,
  type SelectOption,
} from "@/components/common/simple-select";
import { Uploader } from "@/components/common/uploader";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import type { Paginated, Table } from "@/lib/entity";
import { QueryClient } from "@/lib/query-client";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { LoaderCircleIcon } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AdministratorField } from "./administrator.field";

interface UpdateFormProps {
  onClose: () => void;
  table: Table;
}

function UpdateForm({ table, onClose }: UpdateFormProps) {
  const { t } = useI18n();

  const search = useSearch({
    strict: false,
  });

  const update = useMutation({
    mutationFn: async function (
      payload: Pick<Table, "name" | "description" | "configuration"> & {
        logo: string | null;
      }
    ) {
      const route = "/tables/".concat(table.slug);
      const response = await API.put<Table>(route, payload);
      return response.data;
    },
    onSuccess(data) {
      form.reset({});
      onClose();

      toast(t("TABLE_TOAST_COLLECTION_UPDATED", "Coleção atualizada!"), {
        className: "!bg-green-600 !text-white !border-green-600",
        description: t(
          "TABLE_TOAST_COLLECTION_UPDATED_DESCRIPTION",
          `A coleção "${data.name}" foi atualizada com sucesso`
        ),
        descriptionClassName: "!text-white",
        closeButton: true,
      });

      QueryClient.setQueryData<Table>(
        ["/tables/".concat(data.slug), data.slug],
        data
      );

      QueryClient.setQueryData<Paginated<Table[]>>(
        ["/tables/paginated", search],
        (old) => {
          if (!old) return old;

          return {
            meta: old.meta,
            data: old.data.map((item) => {
              if (item._id === data._id) {
                return data;
              }
              return item;
            }),
          };
        }
      );
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        // 400 - INVALID_PARAMETERS
        if (data?.code === 400 && data?.cause === "INVALID_PARAMETERS") {
          toast.error(
            data?.message ??
              t("GLOBAL_ERROR_INVALID_PARAMETERS", "Dados inválidos")
          );
        }

        // 401 - AUTHENTICATION_REQUIRED
        if (data?.code === 401 && data?.cause === "AUTHENTICATION_REQUIRED") {
          toast.error(
            data?.message ??
              t(
                "GLOBAL_ERROR_AUTHENTICATION_REQUIRED",
                "Autenticação necessária"
              )
          );
        }

        // 403 - ACCESS_DENIED
        if (data?.code === 403 && data?.cause === "ACCESS_DENIED") {
          toast.error(
            data?.message ?? t("GLOBAL_ERROR_ACCESS_DENIED", "Acesso negado")
          );
        }

        // 404 - TABLE_NOT_FOUND
        if (data?.code === 404 && data?.cause === "TABLE_NOT_FOUND") {
          toast.error(
            data?.message ??
              t("TABLE_ERROR_NOT_FOUND", "Coleção não encontrada")
          );
        }

        // 409 - TABLE_ALREADY_EXISTS
        if (data?.code === 409 && data?.cause === "TABLE_ALREADY_EXISTS") {
          form.setError("name", {
            message:
              data?.message ??
              t(
                "TABLE_ERROR_ALREADY_EXISTS",
                "Já existe uma coleção com este nome"
              ),
          });
        }

        // 422 - UNPROCESSABLE_ENTITY
        if (data?.code === 422 && data?.cause === "UNPROCESSABLE_ENTITY") {
          toast.error(
            data?.message ?? t("TABLE_ERROR_VALIDATION", "Erro de validação")
          );
        }

        // 500 - SERVER_ERROR
        if (data?.code === 500) {
          toast.error(
            data?.message ??
              t("GLOBAL_ERROR_SERVER_ERROR", "Erro interno do servidor")
          );
        }
      }

      console.error(error);
    },
  });

  const form = useForm();

  const onSubmit = form.handleSubmit(async (payload) => {
    if (update.status === "pending") return;

    const visibility =
      Array.from<SelectOption>(payload?.configuration?.visibility) ?? [];

    const collaboration =
      Array.from<SelectOption>(payload?.configuration?.collaboration) ?? [];

    const administrators =
      Array.from<SearchableOption>(payload.configuration?.administrators) ?? [];

    await update.mutateAsync({
      name: payload.name ?? table.name,
      description: payload.description ?? null,
      logo: (payload.logo || table.logo?._id) ?? null,
      configuration: {
        ...table.configuration,
        ...payload.configuration,
        administrators: administrators.map((a) => a.value),
        visibility: visibility.flatMap((v) => v.value).join(),
        collaboration: collaboration.flatMap((c) => c.value).join(),
      },
    });
  });

  const administrators = table?.configuration?.administrators
    ?.filter((a) => a?._id !== table?.configuration?.owner?._id)
    ?.map((a) => ({
      label: a?.name,
      value: a?._id,
    }));

  const VISIBILITY_MAPPER = {
    public: t("TABLE_FORM_FIELD_VISIBILITY_PUBLIC_OPTION", "Pública"),
    restricted: t("TABLE_FORM_FIELD_VISIBILITY_RESTRICTED_OPTION", "Restrita"),
    open: t("TABLE_VISIBILITY_OPEN_OPTION", "Aberta"),
    form: t("TABLE_VISIBILITY_FORM_OPTION", "Formulário online"),
  };

  const VISIBILITY_OPTION_LIST = [
    {
      value: "public",
      label: VISIBILITY_MAPPER["public"] as string,
    },
    {
      value: "restricted",
      label: VISIBILITY_MAPPER["restricted"] as string,
    },
    {
      value: "open",
      label: VISIBILITY_MAPPER["open"] as string,
    },
    {
      value: "form",
      label: VISIBILITY_MAPPER["form"] as string,
    },
  ];

  const COLLABORATION_MAPPER = {
    restricted: t("TABLE_COLLABORATION_RESTRICTED_OPTION", "Restrita"),
    open: t("TABLE_COLLABORATION_OPEN_OPTION", "Aberta"),
  };

  const COLLABORATION_OPTION_LIST = [
    {
      value: "restricted",
      label: COLLABORATION_MAPPER["restricted"] as string,
    },
    {
      value: "open",
      label: COLLABORATION_MAPPER["open"] as string,
    },
  ];

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4 w-full">
        <Uploader
          dropzoneOptions={{
            multiple: false,
            maxFiles: 1,
            maxSize: 4 * 1024 * 1024,
            accept: {
              "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
            },
          }}
          fieldName="logo"
          label={t("TABLE_SHEET_FIELD_LOGO_LABEL", "Logo") as string}
          defaultValue={table?.logo ? [table?.logo] : []}
          placeholder={
            t("TABLE_SHEET_FIELD_LOGO_PLACEHOLDER", "Logo da coleção") as string
          }
        />

        <FormField
          control={form.control}
          name="name"
          defaultValue={table?.name ?? ""}
          rules={{
            validate: (value) => {
              if (!value)
                return t("TABLE_VALIDATION_NAME_REQUIRED", "Name is required");
              if (value.length > 40)
                return "Name must be at most 40 characters";
              if (
                !/^[a-zA-ZáàâãéèêíïóôõöúçÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ0-9\s\-_]+$/.test(value)
              )
                return t(
                  "TABLE_VALIDATION_NAME_SPECIAL_CHARS",
                  "O nome não pode conter caracteres especiais"
                );

              return true;
            },
          }}
          render={({ field }) => {
            const hasError = !!form.formState.errors.name;
            return (
              <FormItem className="space-y-1">
                <FormLabel>
                  {t("TABLE_SHEET_FIELD_NAME_LABEL", "Nome")}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={
                      t(
                        "TABLE_SHEET_FIELD_NAME_PLACEHOLDER",
                        "Nome da coleção"
                      ) as string
                    }
                    className={cn(
                      " focus-visible:ring-0",
                      hasError && "border-destructive"
                    )}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-right text-destructive" />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="description"
          defaultValue={table?.description ?? ""}
          render={({ field: { value, ...field } }) => (
            <FormItem>
              <FormLabel>
                {t("TABLE_SHEET_FIELD_DESCRIPTION_LABEL", "Descrição")}
              </FormLabel>
              <FormControl>
                <Textarea
                  defaultValue={(value ?? table?.description) || ""}
                  placeholder={
                    t(
                      "TABLE_SHEET_FIELD_DESCRIPTION_PLACEHOLDER",
                      "Uma descrição aqui"
                    ) as string
                  }
                  // className="resize-none"
                  {...field}
                />
              </FormControl>

              <FormMessage className="text-right text-destructive" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="configuration.style"
          defaultValue={table?.configuration?.style ?? "list"}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>
                  {t("TABLE_SHEET_FIELD_LAYOUT_LABEL", "Layout")}
                </FormLabel>
                <FormDescription>
                  {t(
                    "TABLE_SHEET_FIELD_LAYOUT_DESCRIPTION",
                    t(
                      "TABLE_SELECT_LAYOUT_PLACEHOLDER",
                      "Select the table layout"
                    )
                  )}
                </FormDescription>
              </div>
              <FormControl>
                <div className="inline-flex space-x-2">
                  <span className="text-sm">
                    {t("TABLE_LAYOUT_LIST_LABEL", "Lista")}
                  </span>
                  <Switch
                    defaultChecked={table?.configuration?.style === "gallery"}
                    onCheckedChange={(value) => {
                      field.onChange(value ? "gallery" : "list");
                    }}
                    aria-readonly
                  />
                  <span className="text-sm">
                    {t("TABLE_LAYOUT_GRID_LABEL", "Galeria")}
                  </span>
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="configuration.visibility"
          defaultValue={[
            {
              label:
                VISIBILITY_MAPPER[
                  table?.configuration
                    ?.visibility as keyof typeof VISIBILITY_MAPPER
                ],
              value: table?.configuration?.visibility,
            },
          ]}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("TABLE_SHEET_FIELD_VISIBILITY_LABEL", "Visibilidade")}
              </FormLabel>
              <SimpleSelect
                options={VISIBILITY_OPTION_LIST}
                selectedValues={field.value}
                onChange={field.onChange}
                placeholder={
                  t(
                    "TABLE_SELECT_PLACEHOLDER",
                    t("TABLE_SELECT_GENERIC_PLACEHOLDER", "Select an option")
                  ) as string
                }
                className="focus:ring-0 border w-full"
              />

              <FormMessage className="text-right text-destructive" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="configuration.collaboration"
          defaultValue={[
            {
              label:
                COLLABORATION_MAPPER[
                  table?.configuration
                    ?.collaboration as keyof typeof COLLABORATION_MAPPER
                ],
              value: table?.configuration?.collaboration,
            },
          ]}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("TABLE_SHEET_FIELD_COLLABORATOR_LABEL", "Colaboração")}
              </FormLabel>
              <SimpleSelect
                options={COLLABORATION_OPTION_LIST}
                selectedValues={field.value}
                onChange={field.onChange}
                placeholder={
                  t(
                    "TABLE_SELECT_PLACEHOLDER",
                    t("TABLE_SELECT_GENERIC_PLACEHOLDER", "Select an option")
                  ) as string
                }
                className="focus:ring-0 border w-full"
              />

              <FormMessage className="text-right text-destructive" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={"configuration.administrators"}
          defaultValue={administrators}
          render={({ field }) => (
            <AdministratorField
              field={field}
              owner={table?.configuration?.owner}
            />
          )}
        />

        <div className="inline-flex justify-end w-full gap-4 pt-4">
          <Button
            type="submit"
            disabled={update.status === "pending"}
            className="border  py-2 px-3 rounded-lg max-w-40 w-full"
          >
            {update.status === "pending" && (
              <LoaderCircleIcon className="w-4 h-4 animate-spin" />
            )}
            {!(update.status === "pending") && (
              <span>{t("BUTTON_UPDATE_LABEL", "Atualizar")}</span>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface UpdateTableSheetProps
  extends React.ComponentProps<typeof SheetTrigger> {
  slug: string;
}

export function UpdateTableSheet({ slug, ...props }: UpdateTableSheetProps) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);

  const response = useQuery({
    queryKey: ["/tables/".concat(slug), slug],
    queryFn: async () => {
      const route = "/tables/".concat(slug);
      const response = await API.get<Table>(route);
      return response.data;
    },
    enabled: Boolean(open) && Boolean(slug),
  });

  return (
    <Sheet modal open={open} onOpenChange={setOpen}>
      <SheetTrigger className="hidden" {...props} />
      <SheetContent className="flex flex-col py-4 px-6 gap-5 sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="px-0">
          <SheetTitle className="text-lg font-medium">
            {t("TABLE_ROUTE_SHEET_UPDATE_TITLE", "Atualizar lista")}
          </SheetTitle>
          <SheetDescription>
            {t(
              "TABLE_ROUTE_SHEET_UPDATE_DESCRIPTION",
              "Atualize os detalhes de sua lista"
            )}
          </SheetDescription>
        </SheetHeader>

        {/* {lista.status === "error" && <Error />} */}

        {/* {lista.status === "pending" && <Skeleton />} */}

        {response.status === "success" && (
          <UpdateForm table={response.data} onClose={() => setOpen(false)} />
        )}
      </SheetContent>
    </Sheet>
  );
}
