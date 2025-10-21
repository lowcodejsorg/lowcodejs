import { SimpleSelect } from "@/components/custom/simple-select";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AxiosError } from "axios";
import {
  FileTextIcon,
  Languages,
  LoaderCircleIcon,
  SettingsIcon,
  UploadIcon,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

export const Route = createFileRoute("/_private/settings")({
  component: RouteComponent,
});

const SystemSettingSchema = z.object({
  locale: z.enum(["pt-br", "en-us"]),
  fileUploadMaxSize: z
    .string()
    .min(1, "SYSTEM_ROUTE_FORM_VALIDATION_REQUIRED_FILE_MAX_SIZE"),
  fileUploadMaxFilesPerUpload: z
    .string()
    .min(1, "SYSTEM_ROUTE_FORM_VALIDATION_REQUIRED_FILE_MAX_FILES"),
  fileUploadAccepted: z
    .string()
    .min(1, "SYSTEM_ROUTE_FORM_VALIDATION_REQUIRED_FILE_ACCEPTED"),
  fileUploadPath: z
    .string()
    .min(1, "SYSTEM_ROUTE_FORM_VALIDATION_REQUIRED_FILE_PATH"),
  paginationPerPage: z
    .string()
    .min(1, "SYSTEM_ROUTE_FORM_VALIDATION_REQUIRED_PAGINATION"),
});

function SystemSettingForm({ setting }: { setting: SystemSetting }) {
  const { t } = useI18n();

  const form = useForm<z.infer<typeof SystemSettingSchema>>({
    resolver: zodResolver(SystemSettingSchema),
  });

  const update = useMutation({
    mutationFn: async function (payload: z.infer<typeof SystemSettingSchema>) {
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
    await update.mutateAsync(data);
  });

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (size >= 1048576) {
      return `${(size / 1048576).toFixed(1)} MB`;
    }
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
              name="locale"
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
                name="fileUploadMaxSize"
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
                name="fileUploadMaxFilesPerUpload"
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
              defaultValue={setting?.FILE_UPLOAD_ACCEPTED?.join(", ")}
              control={form.control}
              name="fileUploadAccepted"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                defaultValue={setting.FILE_UPLOAD_PATH}
                name="fileUploadPath"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t(
                        "SYSTEM_ROUTE_FILE_UPLOAD_PATH_LABEL",
                        t(
                          "SETTINGS_STORAGE_DIRECTORY_LABEL",
                          "Storage directory"
                        )
                      )}
                    </FormLabel>
                    <FormDescription>
                      {t(
                        "SYSTEM_ROUTE_FILE_UPLOAD_PATH_DESCRIPTION",
                        t(
                          "SETTINGS_STORAGE_DIRECTORY_DESCRIPTION",
                          "Path where files will be stored"
                        )
                      )}
                    </FormDescription>
                    <FormControl>
                      <Input disabled placeholder="./_storage" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
              name="paginationPerPage"
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
