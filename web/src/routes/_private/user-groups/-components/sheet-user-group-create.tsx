import {
  SimpleSelect,
  type SelectOption,
} from "@/components/common/simple-select";
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import type { Paginated, Permission, UserGroup } from "@/lib/entity";
import { QueryClient } from "@/lib/query-client";
import { cn, MetaDefault } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { LoaderCircleIcon, PlusIcon } from "lucide-react";
import React from "react";
import {
  useForm,
  useFormContext,
  type ControllerRenderProps,
  type FieldValues,
} from "react-hook-form";
import { toast } from "sonner";

type PermissionFieldType = {
  field: ControllerRenderProps<FieldValues, "permissions">;
};

export function PermissionField({ field }: PermissionFieldType) {
  const { t } = useI18n();

  const response = useQuery({
    queryKey: ["/permissions"],
    queryFn: async function () {
      const route = "/permissions";
      const response = await API.get<Permission[]>(route);
      return response.data;
    },
  });

  const form = useFormContext();

  const hasError = Boolean(form.formState.errors[field.name]);

  return (
    <FormItem>
      <FormLabel className="data-[error=true]:text-destructive">
        {t("USER_ROUTE_SHEET_FIELD_ROLE_LABEL", "Cargo")}
        <span className="text-destructive">*</span>
      </FormLabel>
      <FormControl>
        <SimpleSelect
          placeholder={
            t(
              "USER_GROUP_SELECT_PERMISSIONS_PLACEHOLDER",
              "Permissions"
            ) as string
          }
          selectedValues={field.value}
          onChange={field.onChange}
          options={
            response?.data?.map((g) => ({
              value: g._id,
              label: g.name.concat(" - ").concat(g.description ?? ""),
            })) ?? []
          }
          className={cn("w-full", hasError && "border-destructive")}
          disabled={response.status === "pending"}
          isMultiple
        />
      </FormControl>

      <FormMessage className="text-right text-destructive" />
    </FormItem>
  );
}

interface Props {
  onClose: () => void;
}

export function CreateUserGroupForm({ onClose }: Props) {
  const { t } = useI18n();

  const search = useSearch({
    from: "/_private/user-groups/",
  });

  const create = useMutation({
    mutationFn: async function (payload: {
      name: string;
      description: string;
      permissions: string[];
    }) {
      const route = "/user-group";
      const response = await API.post<UserGroup>(route, payload);
      return response.data;
    },
    onSuccess(data) {
      QueryClient.setQueryData<Paginated<UserGroup[]>>(
        ["/user-group/paginated", search],
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
      toast(t("USER_GROUP_TOAST_CREATED", "User Group added"), {
        className: "!bg-primary !text-primary-foreground !border-primary",
        description: "O grupo foi adicionado com sucesso",
        descriptionClassName: "!text-primary-foreground",
        closeButton: true,
      });
      onClose();
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        // 400 - INVALID_PARAMETERS
        if (data?.code === 400 && data?.cause === "INVALID_PARAMETERS") {
          toast.error(
            data?.message ?? t("USER_GROUP_ERROR_INVALID_DATA", "Invalid data")
          );
        }

        // 401 - AUTHENTICATION_REQUIRED
        if (data?.code === 401 && data?.cause === "AUTHENTICATION_REQUIRED") {
          toast.error(
            data?.message ??
              t(
                "USER_GROUP_ERROR_AUTHENTICATION_REQUIRED",
                "Authentication required"
              )
          );
        }

        // 403 - ACCESS_DENIED
        if (data?.code === 403 && data?.cause === "ACCESS_DENIED") {
          toast.error(data?.message ?? "Acesso negado");
        }

        // 404 - PERMISSION_NOT_FOUND
        if (data?.code === 404 && data?.cause === "PERMISSION_NOT_FOUND") {
          toast.error(
            data?.message ??
              t(
                "USER_GROUP_ERROR_PERMISSIONS_NOT_FOUND",
                "One or more permissions were not found"
              )
          );
        }

        // 409 - GROUP_ALREADY_EXISTS
        if (data?.code === 409 && data?.cause === "GROUP_ALREADY_EXISTS") {
          form.setError("name", {
            message:
              data?.message ??
              t(
                "USER_GROUP_ERROR_NAME_ALREADY_EXISTS",
                "A group with this name already exists"
              ),
          });
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

  const onSubmit = form.handleSubmit(async (data) => {
    if (create.status === "pending") return;
    await create.mutateAsync({
      name: data.name,
      description: data.description,
      permissions: data.permissions?.flatMap((p: SelectOption) => p.value),
    });
  });

  return (
    <Form {...form}>
      <form className="space-y-4 h-full " onSubmit={onSubmit}>
        <FormField
          control={form.control}
          name="name"
          rules={{
            validate: (value) => {
              if (!value)
                return t(
                  "USER_GROUP_VALIDATION_NAME_REQUIRED",
                  "Name field is required"
                );
              return true;
            },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="data-[error=true]:text-destructive">
                {t("USER_GROUP_ROUTE_SHEET_FIELD_NAME_LABEL", "Nome")}{" "}
                <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={
                    t(
                      "USER_GROUP_ROUTE_SHEET_FIELD_NAME_PLACEHOLDER",
                      "Nome do papel do grupo"
                    ) as string
                  }
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-right text-destructive" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field: { value, ...field } }) => (
            <FormItem>
              <FormLabel className="data-[error=true]:text-destructive">
                {t(
                  "USER_GROUP_ROUTE_SHEET_FIELD_DESCRIPTION_LABEL",
                  t("USER_GROUP_FORM_DESCRIPTION_LABEL", "Description")
                )}
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={
                    t(
                      "USER_GROUP_ROUTE_SHEET_FIELD_DESCRIPTION_PLACEHOLDER",
                      t(
                        "USER_GROUP_FORM_DESCRIPTION_PLACEHOLDER",
                        "A description for the group role"
                      )
                    ) as string
                  }
                  value={value ?? ""}
                  {...field}
                />
              </FormControl>

              <FormMessage className="text-right text-destructive" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="permissions"
          defaultValue={[]}
          rules={{
            validate: (value) => {
              if (value && Array.isArray(value) && value.length === 0)
                return t(
                  "USER_GROUP_VALIDATION_PERMISSIONS_REQUIRED",
                  "Select at least one permission"
                );
              return true;
            },
          }}
          render={({ field }) => <PermissionField field={field} />}
        />

        <SheetFooter className="inline-flex flex-1 justify-end w-full">
          <Button
            className=""
            type="submit"
            disabled={create.status === "pending"}
          >
            {create.status === "pending" && (
              <LoaderCircleIcon className="size-4 animate-spin" />
            )}
            {!(create.status === "pending") && (
              <span>{t("BUTTON_CREATE_LABEL", "Adicionar")}</span>
            )}
          </Button>
        </SheetFooter>
      </form>
    </Form>
  );
}

export function SheetCreateUserGroup() {
  const { t } = useI18n();

  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          className="py-1 px-2  h-auto inline-flex gap-1 cursor-pointer"
        >
          <PlusIcon className="size-4" />
          <span>{t("USER_GROUP_ROUTE_CREATE_LABEL", "Novo grupo")}</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col py-4 px-6 gap-5 sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="px-0">
          <SheetTitle className="text-lg font-medium">
            {t("USER_GROUP_ROUTE_SHEET_CREATE_TITLE", "Novo registro")}
          </SheetTitle>
          <SheetDescription>
            {t(
              "USER_GROUP_ROUTE_SHEET_CREATE_DESCRIPTION",
              t(
                "USER_GROUP_FORM_CREATE_DESCRIPTION",
                "Add a new user group to the system"
              )
            )}
          </SheetDescription>
        </SheetHeader>

        <CreateUserGroupForm onClose={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
