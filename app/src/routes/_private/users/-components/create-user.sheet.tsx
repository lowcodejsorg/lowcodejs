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
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import type { Paginated, User } from "@/lib/entity";
import { QueryClient } from "@/lib/query-client";
import { MetaDefault } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { AxiosError } from "axios";
import {
  EyeClosedIcon,
  EyeIcon,
  LoaderCircleIcon,
  PlusIcon,
} from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { UserGroupField } from "./user-group.field";

interface FormProps {
  onClose: () => void;
}

function CreateForm({ onClose }: FormProps) {
  const search = useSearch({
    from: "/_private/users/",
  });

  const { t } = useI18n();

  const [show, setShow] = React.useState<{ password: boolean }>({
    password: false,
  });

  const createUser = useMutation({
    mutationFn: async function (
      payload: Pick<User, "name" | "email" | "password" | "group">
    ) {
      const router = "/users";
      const response = await API.post<User>(router, payload);
      return response.data;
    },
    onSuccess(data) {
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
            meta: {
              ...old.meta,
              total: old.meta.total + 1,
            },
            data: [data, ...old.data],
          };
        }
      );
      toast(t("TOAST_USER_CREATED", "User created"), {
        className: "!bg-primary !text-primary-foreground !border-primary",
        description: t(
          "TOAST_USER_CREATED_DESCRIPTION",
          "The user was created successfully"
        ),
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
            data?.message ?? t("USER_ERROR_INVALID_DATA", "Invalid data")
          );
        }

        // 400 - Missing Group
        if (data?.code === 400 && data?.cause === "GROUP_NOT_INFORMED") {
          form.setError("group", {
            message:
              data?.message ??
              t("USER_VALIDATION_GROUP_REQUIRED", "Group is required"),
          });
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

        // 404 - GROUP_NOT_FOUND
        if (data?.code === 404 && data?.cause === "GROUP_NOT_FOUND") {
          toast.error(
            data?.message ?? t("USER_ERROR_GROUP_NOT_FOUND", "Group not found")
          );
        }

        // 409 - USER_ALREADY_EXISTS
        if (data?.code === 409 && data?.cause === "USER_ALREADY_EXISTS") {
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

  const form = useForm();

  const onSubmit = form.handleSubmit(async (data) => {
    if (createUser.status === "pending") return;

    await createUser.mutateAsync({
      name: data.name,
      email: data.email,
      password: data.password,
      group: data.group,
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
                      "johndoe@gmail.com"
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
          rules={{
            validate: (value) => {
              if (!value) {
                return t(
                  "USER_VALIDATION_PASSWORD_REQUIRED",
                  "Password is required"
                );
              }
              return true;
            },
          }}
          render={({ field }) => (
            <FormItem className="flex flex-col w-full">
              <FormLabel className="data-[error=true]:text-destructive">
                {t("USER_ROUTE_SHEET_FIELD_PASSWORD_LABEL", "password")}
                <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <div className="relative inline-flex">
                  <Input
                    type={show.password ? "text" : "password"}
                    placeholder={
                      t(
                        "USER_ROUTE_SHEET_FIELD_PASSWORD_PLACEHOLDER",
                        "Digite sua password"
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
                    className="rounded-tl-none rounded-bl-none rounded-tr-md rounded-br-md"
                  >
                    {!show.password && <EyeIcon className="size-4" />}
                    {show.password && <EyeClosedIcon className="size-4" />}
                  </Button>
                </div>
              </FormControl>

              <FormMessage className="text-right text-destructive" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="groups"
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
            disabled={createUser.status === "pending"}
          >
            {createUser.status === "pending" && (
              <LoaderCircleIcon className="size-4 animate-spin" />
            )}
            {!(createUser.status === "pending") && (
              <span>{t("BUTTON_CREATE_LABEL", "Create")}</span>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function CreateUserSheet() {
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
          <span>{t("USER_ROUTE_CREATE_LABEL", "Novo usuário")}</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col py-4 px-6 gap-5 sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="px-0">
          <SheetTitle className="text-lg font-medium">
            {t("USER_ROUTE_SHEET_CREATE_TITLE", "Novo registro")}
          </SheetTitle>
          <SheetDescription>
            {t(
              "USER_ROUTE_SHEET_CREATE_DESCRIPTION",
              t("USER_FORM_CREATE_DESCRIPTION", "Add a new user to the system")
            )}
          </SheetDescription>
        </SheetHeader>

        <CreateForm onClose={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
