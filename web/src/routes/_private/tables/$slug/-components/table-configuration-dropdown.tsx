/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthentication } from "@/hooks/authentication.hook";
import { useI18n } from "@/hooks/i18.hook";
import { useTableManagement } from "@/hooks/table-management.hook";
import { API } from "@/lib/api";
import { FIELD_TYPE, type Table } from "@/lib/entity";
import { cn } from "@/lib/utils";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "@tanstack/react-router";
import {
  CodeIcon,
  InfoIcon,
  PencilIcon,
  PlusIcon,
  SendToBackIcon,
  Settings2Icon,
} from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { UpdateTableSheet } from "../../-components/update-table.sheet";
import { ApiEndpointsModal } from "./api-endpoints-modal";
import { FieldManagerSheet } from "./field-manager-sheet";
import { FieldTableCreateSheet } from "./field-table-create-sheet";

export function TableConfigurationDropdown() {
  const management = useTableManagement();

  const { t } = useI18n();
  const { verify } = useAuthentication();

  const { slug } = useParams({
    from: "/_private/tables/$slug/",
  });

  const router = useRouter();

  const table = useQuery({
    queryKey: ["/tables/".concat(slug), slug],
    queryFn: async () => {
      const route = "/tables/".concat(slug);
      const response = await API.get<Table>(route);
      return response.data;
    },
    enabled: Boolean(slug),
  });

  const updateTableButtonRef = React.useRef<HTMLButtonElement | null>(null);

  const managerTableFieldButtonRef = React.useRef<HTMLButtonElement | null>(
    null
  );

  const createTableFieldButtonRef = React.useRef<HTMLButtonElement | null>(
    null
  );

  const apiEndpointsModalButtonRef = React.useRef<HTMLButtonElement | null>(
    null
  );

  return (
    <DropdownMenu dir="ltr" modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={table.status === "pending"}
          className={cn(
            "shadow-none p-1 h-auto",
            !verify({
              resource: "update-table",
              owner: table?.data?.configuration?.owner?._id,
              administrators:
                table?.data?.configuration?.administrators?.flatMap((a) =>
                  a._id?.toString()
                ) || [],
            }) && "hidden"
          )}
          variant="outline"
        >
          <Settings2Icon className="size-4" />
          <span>
            {t("TABLE_INTERNAL_CONFIGURATION_DROPDOWN_LABEL", "Configuração")}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="mr-12 max-w-xs w-full">
        <DropdownMenuLabel>
          {t("DROPDOWN_LABEL_FIELDS", "Campos")}
        </DropdownMenuLabel>

        <DropdownMenuGroup>
          <DropdownMenuItem
            className="inline-flex space-x-1 w-full"
            onClick={() => {
              createTableFieldButtonRef?.current?.click();
            }}
          >
            <PlusIcon className="size-4" />
            <span>{t("SHEET_TITLE_NEW_FIELD", "Novo campo")}</span>
          </DropdownMenuItem>

          {table?.status === "success" && table?.data?.fields?.length > 0 && (
            <DropdownMenuItem
              className="inline-flex space-x-1 w-full"
              onClick={() => {
                managerTableFieldButtonRef?.current?.click();
              }}
            >
              <SendToBackIcon className="size-4" />
              <span>{t("FIELD_MANAGER_TITLE", "Gerenciar campos")}</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        {table?.data?.type === "table" && (
          <React.Fragment>
            <DropdownMenuSeparator />

            <DropdownMenuLabel>
              {t("DROPDOWN_LABEL_FIELD_GROUP", "Grupo de campos")}
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="inline-flex space-x-1 w-full"
                onClick={() => {
                  createTableFieldButtonRef?.current?.click();

                  router.navigate({
                    search: {
                      // @ts-ignore
                      "field-type": "group",
                      action: "create",
                    },
                    replace: true,
                  });
                }}
              >
                <PlusIcon className="size-4" />
                <span>{t("SHEET_TITLE_NEW_GROUP", "Novo grupo")}</span>
              </DropdownMenuItem>

              {table?.data?.fields
                .filter((f) => f.type === FIELD_TYPE.FIELD_GROUP && !f.trashed)
                ?.map((field) => (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <span>
                        {" "}
                        {t("MANAGE_FIELD", "Gerenciar")} {field.name}
                      </span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem
                          className="inline-flex space-x-1 w-full"
                          onClick={() => {
                            management.handleSlug(field.slug);
                            createTableFieldButtonRef?.current?.click();
                          }}
                        >
                          <PlusIcon className="size-4" />
                          <span>
                            {t("SHEET_TITLE_NEW_FIELD", "Novo campo")}
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="inline-flex space-x-1 w-full"
                          onClick={() => {
                            management.handleSlug(field.slug);
                            managerTableFieldButtonRef?.current?.click();
                          }}
                        >
                          <SendToBackIcon className="size-4" />
                          <span>
                            {t("FIELD_MANAGER_TITLE", "Gerenciar campos")}
                          </span>
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                ))}
            </DropdownMenuGroup>
          </React.Fragment>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuLabel>
          {t("DROPDOWN_LABEL_GENERAL", "Geral")}
        </DropdownMenuLabel>

        <DropdownMenuGroup>
          <DropdownMenuItem
            className="inline-flex space-x-1 w-full"
            onClick={() => {
              updateTableButtonRef?.current?.click();
            }}
          >
            <PencilIcon className="size-4" />
            {table?.data?.type === "table" && (
              <span>{t("SHEET_TITLE_EDIT_TABLE", "Editar lista")}</span>
            )}

            {table?.data?.type === "field-group" && (
              <span>
                {t("SHEET_TITLE_EDIT_FIELD_GROUP", "Editar grupo de campos")}
              </span>
            )}
          </DropdownMenuItem>

          {table?.data?.type === "table" && (
            <DropdownMenuItem
              className="inline-flex space-x-1 w-full"
              onClick={() => {
                apiEndpointsModalButtonRef?.current?.click();
              }}
            >
              <InfoIcon className="size-4" />
              <span>{t("API_INFORMATION", "Informações da API")}</span>
            </DropdownMenuItem>
          )}

          {table?.data?.type === "table" && (
            <DropdownMenuItem
              className="inline-flex space-x-1 w-full"
              onClick={() => {
                const embedUrl = window.location.href;
                const iframeCode = `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0"></iframe>`;

                navigator.clipboard.writeText(iframeCode);

                toast(t("TOAST_EMBED_CODE_COPIED", "Código embed copiado"), {
                  className:
                    "!bg-primary !text-primary-foreground !border-primary",
                  description: t(
                    "TOAST_EMBED_CODE_COPIED_DESCRIPTION",
                    "O código iframe foi copiado para a área de transferência"
                  ),
                  descriptionClassName: "!text-primary-foreground",
                  closeButton: true,
                });
              }}
            >
              <CodeIcon className="size-4" />
              <span>{t("GENERATE_EMBED_CODE", "Gerar código embed")}</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>

      <FieldTableCreateSheet ref={createTableFieldButtonRef} />

      <FieldManagerSheet ref={managerTableFieldButtonRef} />

      <UpdateTableSheet slug={slug} ref={updateTableButtonRef} />

      <ApiEndpointsModal ref={apiEndpointsModalButtonRef} />
    </DropdownMenu>
  );
}
