import { SimpleSelect } from "@/components/common/simple-select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import type { SystemSetting } from "@/lib/entity";
import { QueryClient } from "@/lib/query-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AxiosError } from "axios";
import {
  DatabaseIcon,
  EyeClosedIcon,
  EyeIcon,
  FileTextIcon,
  Languages,
  LoaderCircleIcon,
  MailIcon,
  SettingsIcon,
  UploadIcon,
} from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export const Route = createFileRoute("/_private/settings")({
  component: RouteComponent,
});

function SystemSettingForm({ setting }: { setting: SystemSetting }) {
  const { t } = useI18n();

  const [showPassword, setShowPassword] = React.useState({
    databaseUrl: false,
    emailPassword: false,
  });

  const form = useForm();

  const update = useMutation({
    mutationFn: async function (payload: SystemSetting) {
      const response = await API.put<SystemSetting>("/setting", payload);
      return response.data;
    },
    onSuccess(data) {
      QueryClient.setQueryData<SystemSetting>(["/setting"], data);
      toast.success(
        t("TOAST_SETTINGS_UPDATED", "Settings updated successfully")
      );
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        // 400 - INVALID_PARAMETERS
        if (data?.code === 400 && data?.cause === "INVALID_PARAMETERS") {
          toast.error(
            data?.message ?? t("SETTINGS_ERROR_INVALID_DATA", "Invalid data")
          );
        }

        // 401 - AUTHENTICATION_REQUIRED
        if (data?.code === 401 && data?.cause === "AUTHENTICATION_REQUIRED") {
          toast.error(
            data?.message ??
              t(
                "SETTINGS_ERROR_AUTHENTICATION_REQUIRED",
                "Authentication required"
              )
          );
        }

        // 403 - ACCESS_DENIED
        if (data?.code === 403 && data?.cause === "ACCESS_DENIED") {
          toast.error(data?.message ?? "Acesso negado");
        }

        // 422 - UNPROCESSABLE_ENTITY
        if (data?.code === 422 && data?.cause === "UNPROCESSABLE_ENTITY") {
          toast.error(
            data?.message ?? t("SETTINGS_ERROR_VALIDATION", "Validation error")
          );
        }

        // 500 - SERVER_ERROR
        if (data?.code === 500) {
          toast.error(data?.message ?? "Erro interno do servidor");
        }
      }

      console.error(error);
    },
  });

  const onUpdate = form.handleSubmit(async (data) => {
    if (update.status === "pending") return;
    await update.mutateAsync({
      DATABASE_URL: data.DATABASE_URL,
      EMAIL_PROVIDER_HOST: data.EMAIL_PROVIDER_HOST,
      EMAIL_PROVIDER_PASSWORD: data.EMAIL_PROVIDER_PASSWORD,
      EMAIL_PROVIDER_PORT: data.EMAIL_PROVIDER_PORT,
      EMAIL_PROVIDER_USER: data.EMAIL_PROVIDER_USER,
      FILE_UPLOAD_ACCEPTED: data.FILE_UPLOAD_ACCEPTED,
      FILE_UPLOAD_MAX_FILES_PER_UPLOAD: data.FILE_UPLOAD_MAX_FILES_PER_UPLOAD,
      FILE_UPLOAD_MAX_SIZE: data.FILE_UPLOAD_MAX_SIZE,
      LOCALE: data.LOCALE,
      PAGINATION_PER_PAGE: data.PAGINATION_PER_PAGE,
    });
  });

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (size >= 1048576) {
      return `${(size / 1048576).toFixed(1)} MB`;
    }
    // FILE_UPLOAD_MAX_FILES_PER_UPLOAD e FILE_UPLOAD_MAX_SIZE
    if (size >= 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }
    return `${size} bytes`;
  };

  return (
    <Form {...form}>
      <form onSubmit={onUpdate} className="space-y-6">
        {/* Configurações de Idioma */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="w-5 h-5" />
              {t("SYSTEM_ROUTE_LANGUAGE_SETTINGS_TITLE", "System Language")}
            </CardTitle>
            <CardDescription>
              {t(
                "SYSTEM_ROUTE_LANGUAGE_SETTINGS_DESCRIPTION",
                "Configure the default application language"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              defaultValue={setting.LOCALE}
              control={form.control}
              name="LOCALE"
              rules={{
                validate: (value) => {
                  if (!value) {
                    return "O locale é obrigatório";
                  }

                  return true;
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t(
                      "SYSTEM_ROUTE_SHEET_FIELD_DEFAULT_LANGUAGE_LABEL",
                      t(
                        "SETTINGS_LANGUAGE_DEFAULT_LABEL",
                        "System default language"
                      )
                    )}
                  </FormLabel>
                  <FormDescription>
                    {t(
                      "SYSTEM_ROUTE_SHEET_FIELD_DEFAULT_LANGUAGE_DESCRIPTION",
                      t(
                        "SETTINGS_LANGUAGE_DEFAULT_DESCRIPTION",
                        "Select the default language that will be used throughout the system"
                      )
                    )}
                  </FormDescription>
                  <SimpleSelect
                    options={[
                      {
                        value: "pt-br",
                        label: t(
                          "SYSTEM_ROUTE_SHEET_FIELD_DEFAULT_LANGUAGE_OPTION_PT_BR",
                          t(
                            "SETTINGS_LANGUAGE_PORTUGUESE_BRAZIL",
                            "Portuguese (Brazil)"
                          )
                        ) as string,
                      },
                      {
                        value: "en-us",
                        label: t(
                          "SYSTEM_ROUTE_SHEET_FIELD_DEFAULT_LANGUAGE_OPTION_EN_US",
                          "English (United States)"
                        ) as string,
                      },
                    ]}
                    selectedValues={
                      field.value
                        ? [
                            {
                              value: field.value,
                              label:
                                field.value === "pt-br"
                                  ? (t(
                                      "SYSTEM_ROUTE_SHEET_FIELD_DEFAULT_LANGUAGE_OPTION_PT_BR",
                                      t(
                                        "SETTINGS_LANGUAGE_PORTUGUESE_BRAZIL",
                                        "Portuguese (Brazil)"
                                      )
                                    ) as string)
                                  : (t(
                                      "SYSTEM_ROUTE_SHEET_FIELD_DEFAULT_LANGUAGE_OPTION_EN_US",
                                      "English (United States)"
                                    ) as string),
                            },
                          ]
                        : []
                    }
                    onChange={(selected) => field.onChange(selected[0]?.value)}
                    placeholder={
                      t(
                        "SYSTEM_ROUTE_SHEET_FIELD_DEFAULT_LANGUAGE_PLACEHOLDER",
                        "Selecione um idioma"
                      ) as string
                    }
                    className="w-full max-w-xs"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Configurações de Upload de Arquivos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadIcon className="w-5 h-5" />
              {t("SYSTEM_ROUTE_FILE_UPLOAD_SETTINGS_TITLE", "File Upload")}
            </CardTitle>
            <CardDescription>
              {t(
                "SYSTEM_ROUTE_FILE_UPLOAD_SETTINGS_DESCRIPTION",
                "Configure file upload and storage options"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                defaultValue={setting.FILE_UPLOAD_MAX_SIZE}
                control={form.control}
                name="FILE_UPLOAD_MAX_SIZE"
                rules={{
                  validate: (value) => {
                    if (!value) {
                      return "O tamanho máximo do arquivo é obrigatório";
                    }
                    const size = parseInt(value);
                    if (isNaN(size) || size <= 0) {
                      return "O tamanho deve ser um número positivo";
                    }
                    return true;
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t(
                        "SYSTEM_ROUTE_FILE_UPLOAD_MAX_SIZE_LABEL",
                        t("SETTINGS_FILE_MAX_SIZE_LABEL", "Maximum file size")
                      )}
                    </FormLabel>
                    <FormDescription>
                      {t(
                        "SYSTEM_ROUTE_FILE_UPLOAD_MAX_SIZE_DESCRIPTION",
                        "Tamanho em bytes"
                      )}{" "}
                      {formatFileSize(field.value || "0")}
                    </FormDescription>
                    <FormControl>
                      <Input type="number" placeholder="10485760" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                defaultValue={setting.FILE_UPLOAD_MAX_FILES_PER_UPLOAD}
                name="FILE_UPLOAD_MAX_FILES_PER_UPLOAD"
                rules={{
                  validate: (value) => {
                    if (!value) {
                      return "O número máximo de arquivos é obrigatório";
                    }
                    const files = parseInt(value);
                    if (isNaN(files) || files <= 0) {
                      return "O número deve ser um valor positivo";
                    }
                    return true;
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t(
                        "SYSTEM_ROUTE_FILE_UPLOAD_MAX_FILES_LABEL",
                        t(
                          "SETTINGS_FILE_MAX_UPLOADS_LABEL",
                          "Maximum files per upload"
                        )
                      )}
                    </FormLabel>
                    <FormDescription>
                      {t(
                        "SYSTEM_ROUTE_FILE_UPLOAD_MAX_FILES_DESCRIPTION",
                        t(
                          "SETTINGS_FILE_MAX_UPLOADS_DESCRIPTION",
                          "Maximum number of files that can be uploaded at once"
                        )
                      )}
                    </FormDescription>
                    <FormControl>
                      <Input type="number" placeholder="5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              defaultValue={setting?.FILE_UPLOAD_ACCEPTED?.join(";")}
              control={form.control}
              name="FILE_UPLOAD_ACCEPTED"
              rules={{
                validate: (value) => {
                  if (!value || value.trim() === "") {
                    return "Os tipos de arquivo aceitos são obrigatórios";
                  }
                  return true;
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t(
                      "SYSTEM_ROUTE_FILE_UPLOAD_ACCEPTED_LABEL",
                      "Tipos de arquivo aceitos"
                    )}
                  </FormLabel>
                  <FormDescription>
                    {t(
                      "SYSTEM_ROUTE_FILE_UPLOAD_ACCEPTED_DESCRIPTION",
                      t(
                        "SETTINGS_FILE_EXTENSIONS_DESCRIPTION",
                        "List of extensions separated by comma (ex: pdf, jpg, png)"
                      )
                    )}
                  </FormDescription>
                  <FormControl>
                    <Input
                      placeholder="pdf, csv, png, jpeg, jpg, webp"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Configurações de Paginação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileTextIcon className="w-5 h-5" />
              {t("SYSTEM_ROUTE_PAGINATION_SETTINGS_TITLE", "Pagination")}
            </CardTitle>
            <CardDescription>
              {t(
                "SYSTEM_ROUTE_PAGINATION_SETTINGS_DESCRIPTION",
                "Configure system pagination options"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              defaultValue={setting.PAGINATION_PER_PAGE}
              name="PAGINATION_PER_PAGE"
              rules={{
                validate: (value) => {
                  if (!value) {
                    return "O número de itens por página é obrigatório";
                  }
                  const pages = parseInt(value);
                  if (isNaN(pages) || pages <= 0) {
                    return "O número deve ser um valor positivo";
                  }
                  if (pages > 500) {
                    return "O número máximo de itens por página é 500";
                  }
                  return true;
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t(
                      "SYSTEM_ROUTE_PAGINATION_PER_PAGE_LABEL",
                      t("SETTINGS_PAGINATION_ITEMS_LABEL", "Items per page")
                    )}
                  </FormLabel>
                  <FormDescription>
                    {t(
                      "SYSTEM_ROUTE_PAGINATION_PER_PAGE_DESCRIPTION",
                      t(
                        "SETTINGS_PAGINATION_ITEMS_DESCRIPTION",
                        "Default number of items displayed per page in listings"
                      )
                    )}
                  </FormDescription>
                  <FormControl>
                    <Input
                      disabled
                      type="number"
                      placeholder="50"
                      className="max-w-xs"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Configurações de Banco de Dados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DatabaseIcon className="w-5 h-5" />
              {t("SYSTEM_ROUTE_DATABASE_SETTINGS_TITLE", "Database")}
            </CardTitle>
            <CardDescription>
              {t(
                "SYSTEM_ROUTE_DATABASE_SETTINGS_DESCRIPTION",
                "Configure database connection settings"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              defaultValue={setting.DATABASE_URL}
              control={form.control}
              name="DATABASE_URL"
              rules={{
                validate: (value) => {
                  if (!value) {
                    return "A URL do banco de dados é obrigatória";
                  }
                  if (
                    !value.startsWith("mongodb://") &&
                    !value.startsWith("mongodb+srv://")
                  ) {
                    return "A URL deve começar com mongodb:// ou mongodb+srv://";
                  }
                  return true;
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("SYSTEM_ROUTE_DATABASE_URL_LABEL", "Database URL")}
                  </FormLabel>
                  <FormDescription>
                    {t(
                      "SYSTEM_ROUTE_DATABASE_URL_DESCRIPTION",
                      "MongoDB connection string"
                    )}
                  </FormDescription>
                  <FormControl>
                    <div className="relative inline-flex w-full">
                      <Input
                        type={showPassword.databaseUrl ? "text" : "password"}
                        placeholder="mongodb://localhost:27017/lowcodejs"
                        className="rounded-tr-none rounded-br-none flex-1"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setShowPassword((state) => ({
                            ...state,
                            databaseUrl: !state.databaseUrl,
                          }))
                        }
                        className="rounded-tl-none rounded-bl-none border-l-0"
                      >
                        {showPassword.databaseUrl ? (
                          <EyeClosedIcon className="w-4 h-4" />
                        ) : (
                          <EyeIcon className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Configurações de Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MailIcon className="w-5 h-5" />
              {t("SYSTEM_ROUTE_EMAIL_SETTINGS_TITLE", "Email Server")}
            </CardTitle>
            <CardDescription>
              {t(
                "SYSTEM_ROUTE_EMAIL_SETTINGS_DESCRIPTION",
                "Configure email server settings for notifications"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                defaultValue={setting.EMAIL_PROVIDER_HOST}
                control={form.control}
                name="EMAIL_PROVIDER_HOST"
                rules={{
                  validate: (value) => {
                    if (!value) {
                      return "O host do servidor de email é obrigatório";
                    }
                    return true;
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("SYSTEM_ROUTE_EMAIL_HOST_LABEL", "SMTP Host")}
                    </FormLabel>
                    <FormDescription>
                      {t(
                        "SYSTEM_ROUTE_EMAIL_HOST_DESCRIPTION",
                        "Email server hostname"
                      )}
                    </FormDescription>
                    <FormControl>
                      <Input placeholder="smtp.gmail.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                defaultValue={setting.EMAIL_PROVIDER_PORT}
                control={form.control}
                name="EMAIL_PROVIDER_PORT"
                rules={{
                  validate: (value) => {
                    if (!value) {
                      return "A porta do servidor de email é obrigatória";
                    }
                    const port = parseInt(value);
                    if (isNaN(port) || port <= 0 || port > 65535) {
                      return "A porta deve ser um número entre 1 e 65535";
                    }
                    return true;
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("SYSTEM_ROUTE_EMAIL_PORT_LABEL", "SMTP Port")}
                    </FormLabel>
                    <FormDescription>
                      {t(
                        "SYSTEM_ROUTE_EMAIL_PORT_DESCRIPTION",
                        "Email server port"
                      )}
                    </FormDescription>
                    <FormControl>
                      <Input type="number" placeholder="587" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              defaultValue={setting.EMAIL_PROVIDER_USER}
              control={form.control}
              name="EMAIL_PROVIDER_USER"
              rules={{
                validate: (value) => {
                  if (!value) {
                    return "O usuário de email é obrigatório";
                  }
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!emailRegex.test(value)) {
                    return "Digite um email válido";
                  }
                  return true;
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("SYSTEM_ROUTE_EMAIL_USER_LABEL", "Email Username")}
                  </FormLabel>
                  <FormDescription>
                    {t(
                      "SYSTEM_ROUTE_EMAIL_USER_DESCRIPTION",
                      "Username for email authentication"
                    )}
                  </FormDescription>
                  <FormControl>
                    <Input placeholder="user@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              defaultValue={setting.EMAIL_PROVIDER_PASSWORD}
              control={form.control}
              name="EMAIL_PROVIDER_PASSWORD"
              rules={{
                validate: (value) => {
                  if (!value) {
                    return "A senha do email é obrigatória";
                  }
                  if (value.length < 6) {
                    return "A senha deve ter pelo menos 6 caracteres";
                  }
                  return true;
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("SYSTEM_ROUTE_EMAIL_PASSWORD_LABEL", "Email Password")}
                  </FormLabel>
                  <FormDescription>
                    {t(
                      "SYSTEM_ROUTE_EMAIL_PASSWORD_DESCRIPTION",
                      "Password or API key for email authentication"
                    )}
                  </FormDescription>
                  <FormControl>
                    <div className="relative inline-flex w-full">
                      <Input
                        type={showPassword.emailPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="rounded-tr-none rounded-br-none flex-1"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setShowPassword((state) => ({
                            ...state,
                            emailPassword: !state.emailPassword,
                          }))
                        }
                        className="rounded-tl-none rounded-bl-none border-l-0"
                      >
                        {showPassword.emailPassword ? (
                          <EyeClosedIcon className="w-4 h-4" />
                        ) : (
                          <EyeIcon className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-start pt-4">
          <Button
            type="submit"
            disabled={update.status === "pending"}
            className="max-w-xs w-full"
          >
            {update.status === "pending" && (
              <LoaderCircleIcon className="w-4 h-4 animate-spin mr-2" />
            )}
            <SettingsIcon className="w-4 h-4 mr-2" />
            {t("SYSTEM_ROUTE_BUTTON_UPDATE_LABEL", "Update Settings")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function RouteComponent() {
  const { t } = useI18n();

  // const { settings, status } = useSystemConfig();
  const response = useQuery({
    queryKey: ["/setting"],
    queryFn: async () => {
      const route = "/setting";
      const { data } = await API.get<SystemSetting>(route);
      return data;
    },
  });

  return (
    <div className="flex-1 w-full p-10 flex flex-col gap-6 overflow-y-auto h-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          {t("SYSTEM_ROUTE_TITLE", "System Settings")}
        </h1>
        <p className="text-muted-foreground">
          {t(
            "SYSTEM_ROUTE_DESCRIPTION",
            "Manage general application settings, including language, file uploads, and pagination."
          )}
        </p>
      </div>

      <Separator />

      {response.status === "success" && (
        <SystemSettingForm setting={response.data} />
      )}
    </div>
  );
}
