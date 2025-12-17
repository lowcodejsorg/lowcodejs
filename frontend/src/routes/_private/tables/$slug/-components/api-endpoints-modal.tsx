import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useI18n } from "@/hooks/i18.hook";
import { useParams } from "@tanstack/react-router";
import { CopyIcon, InfoIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  params?: string;
}

export function ApiEndpointsModal({
  ...props
}: React.ComponentProps<typeof DialogTrigger>) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const { slug: tableSlug } = useParams({
    from: "/_private/tables/$slug/",
  });

  const baseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;

  const endpoints: ApiEndpoint[] = [
    {
      method: "GET",
      path: `/tables/${tableSlug}`,
      description: t(
        "API_ENDPOINT_GET_TABLE_INFO",
        "Obter informações da table"
      ) as string,
    },
    {
      method: "GET",
      path: `/tables/${tableSlug}/rows/paginated`,
      description: t(
        "API_ENDPOINT_LIST_ROWS_PAGINATED",
        "Listar rows com paginação"
      ) as string,
      params: "?page=1&perPage=50&search=termo",
    },
    {
      method: "GET",
      path: `/tables/${tableSlug}/rows/:id`,
      description: t(
        "API_ENDPOINT_GET_ROW_BY_ID",
        "Obter row específico por ID"
      ) as string,
    },
    {
      method: "POST",
      path: `/tables/${tableSlug}/rows`,
      description: t("API_ENDPOINT_CREATE_ROW", "Criar novo row") as string,
    },
    {
      method: "PUT",
      path: `/tables/${tableSlug}/rows/:id`,
      description: t(
        "API_ENDPOINT_UPDATE_ROW",
        "Atualizar row existente"
      ) as string,
    },
    {
      method: "DELETE",
      path: `/tables/${tableSlug}/rows/:id`,
      description: t(
        "API_ENDPOINT_DELETE_ROW",
        "Deletar row permanentemente"
      ) as string,
    },
    {
      method: "PATCH",
      path: `/tables/${tableSlug}/rows/:id/trash`,
      description: t(
        "API_ENDPOINT_SEND_ROW_TO_TRASH",
        "Enviar row para lixeira"
      ) as string,
    },
    {
      method: "PATCH",
      path: `/tables/${tableSlug}/rows/:id/restore`,
      description: t(
        "API_ENDPOINT_RESTORE_ROW_FROM_TRASH",
        "Restaurar row da lixeira"
      ) as string,
    },
    {
      method: "PATCH",
      path: `/tables/${tableSlug}/rows/:id/reaction`,
      description: t(
        "API_ENDPOINT_ADD_REACTION",
        "Adicionar reação (like/unlike)"
      ) as string,
    },
    {
      method: "PATCH",
      path: `/tables/${tableSlug}/rows/:id/evaluation`,
      description: t(
        "API_ENDPOINT_ADD_EVALUATION",
        "Adicionar avaliação numérica"
      ) as string,
    },
  ];

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "POST":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "PUT":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "PATCH":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "DELETE":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const copyEndpoint = (endpoint: ApiEndpoint) => {
    const fullUrl = `${baseUrl}${endpoint.path}${endpoint.params || ""}`;
    navigator.clipboard.writeText(fullUrl);

    toast(t("TOAST_ENDPOINT_COPIED", "Endpoint copiado"), {
      className: "!bg-primary !text-primary-foreground !border-primary",
      description: t(
        "TOAST_ENDPOINT_COPIED_DESCRIPTION",
        "URL do endpoint foi copiada para a área de transferência"
      ),
      descriptionClassName: "!text-primary-foreground",
      closeButton: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="hidden" {...props} />
      <DialogContent className="w-full sm:max-w-2xl  max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <InfoIcon className="size-5" />
            {t("API_ENDPOINTS_MODAL_TITLE", "API Endpoints")} - {tableSlug}
          </DialogTitle>
          <DialogDescription>
            {t(
              "API_ENDPOINTS_MODAL_DESCRIPTION",
              `Endpoints disponíveis para integração com a table "${tableSlug}". Todos os endpoints requerem autenticação via cookie ou JWT.`
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <strong>{t("API_BASE_URL_LABEL", "Base URL")}:</strong> {baseUrl}
          </div>

          <div className="space-y-3">
            {endpoints.map((endpoint, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Badge className={getMethodColor(endpoint.method)}>
                      {endpoint.method}
                    </Badge>
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {endpoint.path}
                    </code>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-4"
                    onClick={() => copyEndpoint(endpoint)}
                    title={
                      t(
                        "BUTTON_COPY_FULL_URL_TITLE",
                        "Copiar URL completa"
                      ) as string
                    }
                  >
                    <CopyIcon className="size-4" />
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground">
                  {endpoint.description}
                </p>

                {endpoint.params && (
                  <div className="mt-2">
                    <span className="text-xs text-muted-foreground">
                      {t(
                        "API_EXAMPLE_PARAMETERS_LABEL",
                        "Parâmetros de exemplo"
                      )}
                      :
                    </span>
                    <code className="block text-xs font-mono bg-muted px-2 py-1 rounded mt-1">
                      {endpoint.params}
                    </code>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">
              {t("API_AUTHENTICATION_SECTION_TITLE", "Autenticação")}
            </h4>
            <p className="text-sm text-muted-foreground">
              {t(
                "API_AUTHENTICATION_DESCRIPTION",
                "Todos os endpoints requerem autenticação. Inclua o cookie accessToken nas requisições."
              )}
            </p>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">
              {t("API_COMPLETE_DOCUMENTATION_TITLE", "Documentação Completa")}
            </h4>
            <p className="text-sm text-muted-foreground">
              {t(
                "API_COMPLETE_DOCUMENTATION_DESCRIPTION",
                "Para documentação interativa completa, acesse:"
              )}
              <a
                href={`${baseUrl}/documentation`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline ml-1"
              >
                {baseUrl}/documentation
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
