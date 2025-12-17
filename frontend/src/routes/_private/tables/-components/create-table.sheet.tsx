import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import { useAuthentication } from "@/hooks/authentication.hook";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import type { Paginated, Table } from "@/lib/entity";
import { QueryClient } from "@/lib/query-client";
import { cn, MetaDefault } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { LoaderCircleIcon, PlusIcon } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface CreateFormProps {
  onClose: () => void;
}

function CreateForm({ onClose }: CreateFormProps) {
  const { t } = useI18n();

  const search = useSearch({
    strict: false,
  });

  const create = useMutation({
    mutationFn: async function (payload: Pick<Table, "name">) {
      const route = "/tables";
      const response = await API.post<Table>(route, payload);
      return response.data;
    },
    onSuccess(data) {
      form.reset({});
      onClose();

      toast(t("TOAST_TABLE_CREATED", "Table created!"), {
        className: "!bg-green-600 !text-white !border-green-600",
        description: t(
          "TOAST_TABLE_CREATED_DESCRIPTION",
          `The table "${data.name}" was created successfully`
        ),
        descriptionClassName: "!text-white",
        closeButton: true,
      });

      QueryClient.setQueryData<Paginated<Table[]>>(
        ["/tables/paginated", search],
        (old) => {
          if (!old) {
            return {
              meta: MetaDefault,
              data: [data],
            };
          }

          return {
            meta: {
              ...old.meta,
              total: old.meta.total + 1,
            },
            data: [data, ...old.data],
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
            data?.message ?? t("TABLE_ERROR_INVALID_DATA", "Invalid data")
          );
        }

        // 400 - OWNER_REQUIRED
        if (data?.code === 400 && data?.cause === "OWNER_REQUIRED") {
          toast.error(
            data?.message ?? t("TABLE_ERROR_OWNER_REQUIRED", "Owner required")
          );
        }

        // 401 - AUTHENTICATION_REQUIRED
        if (data?.code === 401 && data?.cause === "AUTHENTICATION_REQUIRED") {
          toast.error(
            data?.message ??
              t(
                "TABLE_ERROR_AUTHENTICATION_REQUIRED",
                "Authentication required"
              )
          );
        }

        // 403 - ACCESS_DENIED
        if (data?.code === 403 && data?.cause === "ACCESS_DENIED") {
          toast.error(
            data?.message ?? t("TABLE_ERROR_ACCESS_DENIED", "Access denied")
          );
        }

        // 409 - TABLE_ALREADY_EXISTS
        if (data?.code === 409 && data?.cause === "TABLE_ALREADY_EXISTS") {
          form.setError("name", {
            message:
              data?.message ??
              t("TABLE_ERROR_ALREADY_EXISTS", "This table already exists"),
          });
        }

        // 422 - UNPROCESSABLE_ENTITY
        if (data?.code === 422 && data?.cause === "UNPROCESSABLE_ENTITY") {
          toast.error(
            data?.message ?? t("TABLE_ERROR_VALIDATION", "Validation error")
          );
        }

        // 500 - SERVER_ERROR
        if (data?.code === 500) {
          toast.error(
            data?.message ??
              t("TABLE_ERROR_INTERNAL_SERVER", "Internal server error")
          );
        }
      }

      console.error(error);
    },
  });

  const form = useForm();

  const onSubmit = form.handleSubmit(async (payload) => {
    if (create.status === "pending") return;
    await create.mutateAsync({
      name: payload.name,
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4 w-full">
        <FormField
          control={form.control}
          name="name"
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
                  {t("TABLE_SHEET_FIELD_NAME_LABEL", "Name")}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={
                      t(
                        "TABLE_SHEET_FIELD_NAME_PLACEHOLDER",
                        "Enter table name"
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

        <div className="inline-flex justify-end w-full gap-4 pt-4">
          <Button
            type="submit"
            disabled={create.status === "pending"}
            className="border  py-2 px-3 rounded-lg max-w-40 w-full"
          >
            {create.status === "pending" && (
              <LoaderCircleIcon className="w-4 h-4 animate-spin" />
            )}
            {!(create.status === "pending") && (
              <span>{t("BUTTON_CREATE_LABEL", "Create")}</span>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function CreateTableSheet() {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const { verify } = useAuthentication();

  return (
    <Sheet modal open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          className={cn(
            "py-1 px-2  h-auto inline-flex gap-1 cursor-pointer",
            !verify({
              resource: "create-table",
            }) && "hidden"
          )}
        >
          <PlusIcon className="size-4" />
          <span>{t("TABLE_ROUTE_CREATE_LABEL", "New table")}</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col py-4 px-6 gap-5 sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="px-0">
          <SheetTitle className="text-lg font-medium">
            {t("TABLE_ROUTE_SHEET_CREATE_TITLE", "New Table")}
          </SheetTitle>
          <SheetDescription>
            {t(
              "TABLE_ROUTE_SHEET_CREATE_DESCRIPTION",
              "Create a new table with its details"
            )}
          </SheetDescription>
        </SheetHeader>

        <CreateForm onClose={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
