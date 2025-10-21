import type { SearchableOption } from "@/components/custom/searchable-select";
import { SimpleSelect } from "@/components/custom/simple-select";
import { Uploader } from "@/components/custom/uploader";
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
import type { Collection, Paginated } from "@/lib/entity";
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
  collection: Collection;
}

function UpdateForm({ collection, onClose }: UpdateFormProps) {
  const { t } = useI18n();

  const search = useSearch({
    strict: false,
  });

  const update = useMutation({
    mutationFn: async function (
      payload: Pick<Collection, "name" | "description" | "configuration"> & {
        logo: string | null;
      }
    ) {
      const route = "/collections/".concat(collection.slug);
      const response = await API.put<Collection>(route, payload);
      return response.data;
    },
    onSuccess(data) {
      form.reset({});
      onClose();

      toast("Coleção atualizada!", {
        className: "!bg-green-600 !text-white !border-green-600",
        description: `A coleção "${data.name}" foi atualizada com sucesso`,
        descriptionClassName: "!text-white",
        closeButton: true,
      });

      QueryClient.setQueryData<Collection>(
        ["/collections/".concat(data.slug), data.slug],
        data
      );

      QueryClient.setQueryData<Paginated<Collection[]>>(
        ["/collections/paginated", search],
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
          toast.error(data?.message ?? "Dados inválidos");
        }

        // 401 - AUTHENTICATION_REQUIRED
        if (data?.code === 401 && data?.cause === "AUTHENTICATION_REQUIRED") {
          toast.error(data?.message ?? "Autenticação necessária");
        }

        // 403 - ACCESS_DENIED
        if (data?.code === 403 && data?.cause === "ACCESS_DENIED") {
          toast.error(data?.message ?? "Acesso negado");
        }

        // 404 - COLLECTION_NOT_FOUND
        if (data?.code === 404 && data?.cause === "COLLECTION_NOT_FOUND") {
          toast.error(data?.message ?? "Coleção não encontrada");
        }

        // 409 - COLLECTION_ALREADY_EXISTS
        if (data?.code === 409 && data?.cause === "COLLECTION_ALREADY_EXISTS") {
          form.setError("name", {
            message: data?.message ?? "Já existe uma coleção com este nome",
          });
        }

        // 422 - UNPROCESSABLE_ENTITY
        if (data?.code === 422 && data?.cause === "UNPROCESSABLE_ENTITY") {
          toast.error(data?.message ?? "Erro de validação");
        }

        // 500 - SERVER_ERROR
        if (data?.code === 500) {
          toast.error(data?.message ?? "Erro interno do servidor");
        }
      }

      console.error(error);
    },
  });

  const form = useForm();

  const onSubmit = form.handleSubmit(async (payload) => {
    if (update.status === "pending") return;
    await update.mutateAsync({
      name: payload.name ?? collection.name,
      description: payload.description ?? null,
      logo: (payload.logo || collection.logo?._id) ?? null,
      configuration: {
        ...collection.configuration,
        ...payload.configuration,
        administrators:
          payload.configuration?.administrators?.map(
            (a: SearchableOption) => a.value
          ) ?? [],
      },
    });
  });

  const administrators = collection?.configuration?.administrators
    ?.filter((a) => a?._id !== collection?.configuration?.owner?._id)
    ?.map((a) => ({
      label: a?.name,
      value: a?._id,
    }));

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
          label={t("COLLECTION_SHEET_FIELD_LOGO_LABEL", "Logo") as string}
          defaultValue={collection?.logo ? [collection?.logo] : []}
          placeholder={
            t(
              "COLLECTION_SHEET_FIELD_LOGO_PLACEHOLDER",
              "Logo da coleção"
            ) as string
          }
        />

        <FormField
          control={form.control}
          name="name"
          defaultValue={collection?.name ?? ""}
          render={({ field }) => {
            const hasError = !!form.formState.errors.name;
            return (
              <FormItem className="space-y-1">
                <FormLabel>
                  {t("COLLECTION_SHEET_FIELD_NAME_LABEL", "Nome")}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={
                      t(
                        "COLLECTION_SHEET_FIELD_NAME_PLACEHOLDER",
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
          defaultValue={collection?.description ?? ""}
          render={({ field: { value, ...field } }) => (
            <FormItem>
              <FormLabel>
                {t("COLLECTION_SHEET_FIELD_DESCRIPTION_LABEL", "Descrição")}
              </FormLabel>
              <FormControl>
                <Textarea
                  defaultValue={(value ?? collection?.description) || ""}
                  placeholder={
                    t(
                      "COLLECTION_SHEET_FIELD_DESCRIPTION_PLACEHOLDER",
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
          defaultValue={collection?.configuration?.style ?? "list"}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>
                  {t("COLLECTION_SHEET_FIELD_LAYOUT_LABEL", "Layout")}
                </FormLabel>
                <FormDescription>
                  {t(
                    "COLLECTION_SHEET_FIELD_LAYOUT_DESCRIPTION",
                    t(
                      "COLLECTION_SELECT_LAYOUT_PLACEHOLDER",
                      "Select the collection layout"
                    )
                  )}
                </FormDescription>
              </div>
              <FormControl>
                <div className="inline-flex space-x-2">
                  <span className="text-sm">
                    {t("COLLECTION_LAYOUT_LIST_LABEL", "Lista")}
                  </span>
                  <Switch
                    defaultChecked={
                      collection?.configuration?.style === "gallery"
                    }
                    onCheckedChange={(value) => {
                      field.onChange(value ? "gallery" : "list");
                    }}
                    aria-readonly
                  />
                  <span className="text-sm">
                    {t("COLLECTION_LAYOUT_GRID_LABEL", "Galeria")}
                  </span>
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="configuration.visibility"
          defaultValue={collection?.configuration?.visibility ?? "public"}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("COLLECTION_SHEET_FIELD_VISIBILITY_LABEL", "Visibilidade")}
              </FormLabel>
              <SimpleSelect
                options={[
                  {
                    value: "public",
                    label: t(
                      "COLLECTION_SHEET_FIELD_VISIBILITY_PUBLIC_OPTION",
                      "Publica"
                    ) as string,
                  },
                  {
                    value: "restricted",
                    label: t(
                      "COLLECTION_SHEET_FIELD_VISIBILITY_RESTRICTED_OPTION",
                      "Restrita"
                    ) as string,
                  },
                ]}
                selectedValues={
                  field.value
                    ? [
                        {
                          value: field.value,
                          label:
                            field.value === "public"
                              ? (t(
                                  "COLLECTION_SHEET_FIELD_VISIBILITY_PUBLIC_OPTION",
                                  "Publica"
                                ) as string)
                              : (t(
                                  "COLLECTION_SHEET_FIELD_VISIBILITY_RESTRICTED_OPTION",
                                  "Restrita"
                                ) as string),
                        },
                      ]
                    : []
                }
                onChange={(selected) => field.onChange(selected[0]?.value)}
                placeholder={
                  t(
                    "COLLECTION_SELECT_PLACEHOLDER",
                    t(
                      "COLLECTION_SELECT_GENERIC_PLACEHOLDER",
                      "Select an option"
                    )
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
          defaultValue={collection?.configuration?.collaboration ?? "open"}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("COLLECTION_SHEET_FIELD_COLLABORATOR_LABEL", "Colaboração")}
              </FormLabel>
              <SimpleSelect
                options={[
                  {
                    value: "restricted",
                    label: t(
                      "COLLECTION_SHEET_FIELD_COLLABORATOR_RESTRICTED_OPTION",
                      "Restrita, todas as contribuições devem ser revisadas e precisam de aprovação"
                    ) as string,
                  },
                  {
                    value: "open",
                    label: t(
                      "COLLECTION_SHEET_FIELD_COLLABORATOR_OPEN_OPTION",
                      "Aberta, apenas as contribuições de edição e exclusão precisam de aprovação"
                    ) as string,
                  },
                ]}
                selectedValues={
                  field.value
                    ? [
                        {
                          value: field.value,
                          label:
                            field.value === "restricted"
                              ? (t(
                                  "COLLECTION_SHEET_FIELD_COLLABORATOR_RESTRICTED_OPTION",
                                  "Restrita, todas as contribuições devem ser revisadas e precisam de aprovação"
                                ) as string)
                              : (t(
                                  "COLLECTION_SHEET_FIELD_COLLABORATOR_OPEN_OPTION",
                                  "Aberta, apenas as contribuições de edição e exclusão precisam de aprovação"
                                ) as string),
                        },
                      ]
                    : []
                }
                onChange={(selected) => field.onChange(selected[0]?.value)}
                placeholder={
                  t(
                    "COLLECTION_SELECT_PLACEHOLDER",
                    t(
                      "COLLECTION_SELECT_GENERIC_PLACEHOLDER",
                      "Select an option"
                    )
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
              owner={collection?.configuration?.owner}
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

interface UpdateCollectionSheetProps
  extends React.ComponentProps<typeof SheetTrigger> {
  slug: string;
}

export function UpdateCollectionSheet({
  slug,
  ...props
}: UpdateCollectionSheetProps) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);

  const response = useQuery({
    queryKey: ["/collections/".concat(slug), slug],
    queryFn: async () => {
      const route = "/collections/".concat(slug);
      const response = await API.get<Collection>(route);
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
            {t("COLLECTION_ROUTE_SHEET_UPDATE_TITLE", "Atualizar lista")}
          </SheetTitle>
          <SheetDescription>
            {t(
              "COLLECTION_ROUTE_SHEET_UPDATE_DESCRIPTION",
              "Atualize os detalhes de sua lista"
            )}
          </SheetDescription>
        </SheetHeader>

        {/* {lista.status === "error" && <Error />} */}

        {/* {lista.status === "pending" && <Skeleton />} */}

        {response.status === "success" && (
          <UpdateForm
            collection={response.data}
            onClose={() => setOpen(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
