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
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import type { Optional, Paginated, User } from "@/lib/entity";
import { QueryClient } from "@/lib/query-client";
import { MetaDefault } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { EyeClosedIcon, EyeIcon, LoaderCircleIcon } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { UserGroupField } from "./user-group.field";

interface UpdateFormProps {
  onClose: () => void;
  user: User;
}

export function UpdateForm({ onClose, user }: UpdateFormProps) {
  const { t } = useI18n();

  const search = useSearch({
    from: "/_private/users/",
  });

  const [show, setShow] = React.useState<{ password: boolean }>({
    password: false,
  });

  const form = useForm();

  const updateUser = useMutation({
    mutationFn: async function (
      payload: Optional<
        User,
        "_id" | "password" | "createdAt" | "updatedAt" | "trashed" | "trashedAt"
      >
    ) {
      const route = "/users/".concat(user._id);
      const response = await API.patch<User>(route, payload);
      return response.data;
    },
    onSuccess(data) {
      onClose();

      QueryClient.setQueryData<User>(
        ["/users/".concat(data._id), data._id],
        data
      );

      QueryClient.setQueryData<Paginated<User[]>>(
        ["/users/paginated", search],
        (old) => {
          if (!old) {
            return {
              meta: MetaDefault,
              data: [data],
            };
          }

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

      toast(t("USER_TOAST_UPDATED", "User updated"), {
        className: "!bg-green-600 !text-white !border-green-600",
        description: t(
          "USER_TOAST_UPDATED_DESCRIPTION",
          "User data has been updated successfully"
        ),
        descriptionClassName: "!text-white",
        closeButton: true,
      });
      console.log(data);
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        // 400 - INVALID_PARAMETERS
        if (data?.code === 400 && data?.cause === "INVALID_PARAMETERS") {
          toast.error(
            data?.message ?? t("USER_ERROR_INVALID_DATA", "Invalid data")
          );
        }

        // 401 - AUTHENTICATION_REQUIRED
        if (data?.code === 401 && data?.cause === "AUTHENTICATION_REQUIRED") {
          toast.error(
            data?.message ??
              t("USER_ERROR_AUTHENTICATION_REQUIRED", "Authentication required")
          );
        }

        // 403 - ACCESS_DENIED
        if (data?.code === 403 && data?.cause === "ACCESS_DENIED") {
          toast.error(data?.message ?? "Acesso negado");
        }

        // 404 - USER_NOT_FOUND
        if (data?.code === 404 && data?.cause === "USER_NOT_FOUND") {
          toast.error(
            data?.message ?? t("USER_ERROR_NOT_FOUND", "User not found")
          );
        }

        // 404 - GROUP_NOT_FOUND
        if (data?.code === 404 && data?.cause === "GROUP_NOT_FOUND") {
          toast.error(
            data?.message ?? t("USER_ERROR_GROUP_NOT_FOUND", "Group not found")
          );
        }

        // 409 - EMAIL_ALREADY_EXISTS
        if (data?.code === 409 && data?.cause === "EMAIL_ALREADY_EXISTS") {
          form.setError("email", {
            message:
              data?.message ??
              t(
                "USER_ERROR_EMAIL_ALREADY_EXISTS",
                "This email is already in use"
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

  const onSubmit = form.handleSubmit(async (data) => {
    if (updateUser.status === "pending") return;

    await updateUser.mutateAsync({
      email: data.email,
      group: data.group ? data.group : user?.group?._id, //verificar melhor depois
      name: data.name,
      status: data.status ? data.status : user?.status,
      ...(data.password && { password: data.password }),
    });
  });

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={onSubmit}>
        <FormField
          control={form.control}
          name="name"
          rules={{
            validate: (value) => {
              if (!value) {
                return t("USER_VALIDATION_NAME_REQUIRED", "Name is required");
              }
              return true;
            },
          }}
          defaultValue={user?.name}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="data-[error=true]:text-destructive">
                {t("USER_ROUTE_SHEET_FIELD_NAME_LABEL", "Nome")}
                <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={
                    t(
                      "USER_ROUTE_SHEET_FIELD_NAME_PLACEHOLDER",
                      "John Doe"
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
          name="email"
          rules={{
            validate: (value) => {
              if (!value) {
                return t("USER_VALIDATION_EMAIL_REQUIRED", "Email is required");
              }
              return true;
            },
          }}
          defaultValue={user?.email}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="data-[error=true]:text-destructive">
                {t("USER_ROUTE_SHEET_FIELD_EMAIL_LABEL", "E-mail")}
                <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={
                    t(
                      "USER_ROUTE_SHEET_FIELD_EMAIL_PLACEHOLDER",
                      "exemplo@email.com"
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
          name="password"
          render={({ field }) => (
            <FormItem className="flex flex-col w-full">
              <FormLabel>
                {t("USER_ROUTE_SHEET_FIELD_PASSWORD_LABEL", "Senha")}
              </FormLabel>
              <FormControl>
                <div className="relative inline-flex">
                  <Input
                    type={show.password ? "text" : "password"}
                    placeholder={
                      t(
                        "USER_ROUTE_SHEET_FIELD_PASSWORD_PLACEHOLDER",
                        "Digite sua senha"
                      ) as string
                    }
                    className="text-lg w-full flex-1 rounded-tl-md rounded-bl-md rounded-tr-none rounded-br-none"
                    {...field}
                  />
                  <Button
                    type="button"
                    onClick={() =>
                      setShow((state) => ({
                        ...state,
                        password: !state.password,
                      }))
                    }
                    className="rounded-tl-none rounded-bl-none rounded-tr-md rounded-br-md cursor-pointer"
                  >
                    {!show.password && <EyeIcon className="size-4" />}
                    {show.password && <EyeClosedIcon className="size-4" />}
                  </Button>
                </div>
              </FormControl>

              <FormMessage className="text-right" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status_option"
          defaultValue={user?.status === "active"}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>
                  {t("USER_ROUTE_SHEET_FIELD_STATUS_LABEL", "Status")}
                </FormLabel>
                <FormDescription>
                  {t(
                    "USER_ROUTE_SHEET_FIELD_STATUS_DESCRIPTION",
                    t("USER_FORM_STATUS_DESCRIPTION", "Set the user status")
                  )}
                </FormDescription>
              </div>
              <FormControl>
                <div className="inline-flex space-x-2">
                  <span className="text-sm">
                    {t(
                      "USER_ROUTE_SHEET_FIELD_STATUS_INACTIVE_OPTION",
                      "Inativo"
                    )}
                  </span>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      form.setValue("status", checked ? "active" : "inactive");
                      field.onChange(checked);
                    }}
                    aria-readonly
                  />
                  <span className="text-sm">
                    {t("USER_ROUTE_SHEET_FIELD_STATUS_ACTIVE_OPTION", "Ativo")}
                  </span>
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="groups"
          defaultValue={[
            {
              label: user?.group?.name,
              value: user?.group?._id,
            },
          ]}
          rules={{
            validate: (value) => {
              if (!value || value.length === 0) {
                return t("USER_VALIDATION_GROUP_REQUIRED", "Group is required");
              }
              return true;
            },
          }}
          render={({ field }) => <UserGroupField field={field} />}
        />

        <div className="inline-flex flex-1 justify-end w-full">
          <Button
            className=""
            type="submit"
            disabled={updateUser.status === "pending"}
          >
            {updateUser.status === "pending" && (
              <LoaderCircleIcon className="size-4 animate-spin" />
            )}
            {!(updateUser.status === "pending") && (
              <span>{t("BUTTON_UPDATE_LABEL", "Atualizar")}</span>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface UpdateUserSheetProps
  extends React.ComponentProps<typeof SheetTrigger> {
  _id: string;
}

export function UpdateUserSheet({ _id, ...props }: UpdateUserSheetProps) {
  const { t } = useI18n();

  const [open, setOpen] = React.useState(false);

  const response = useQuery({
    queryKey: ["/users/".concat(_id), _id],
    queryFn: async function () {
      const route = "/users/".concat(_id);
      const response = await API.get<User>(route);
      return response.data;
    },
    enabled: Boolean(open) && Boolean(_id),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="hidden" {...props} />
      <SheetContent className="flex flex-col py-4 px-6 gap-5 sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="px-0">
          <SheetTitle className="text-lg font-medium">
            {t("USER_ROUTE_SHEET_UPDATE_TITLE", "Atualizar registro")}
          </SheetTitle>

          <SheetDescription>
            {t(
              "USER_ROUTE_SHEET_UPDATE_DESCRIPTION",
              t("USER_FORM_UPDATE_DESCRIPTION", "Update user details")
            )}
          </SheetDescription>
        </SheetHeader>

        {/* {(usuario?.status === "error" || grupos?.status === "error") && (
          <Error />
        )}

        {(usuario?.status === "pending" || grupos?.status === "pending") && (
          <Skeleton />
        )} */}

        {response?.status === "success" && (
          <UpdateForm onClose={() => setOpen(false)} user={response.data} />
        )}
      </SheetContent>
    </Sheet>
  );
}
