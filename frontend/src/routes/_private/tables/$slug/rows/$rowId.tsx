import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import { FIELD_TYPE, type Row, type Table } from "@/lib/entity";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { format } from "date-fns";
import { CopyIcon, ExternalLinkIcon, Share2Icon } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { FieldCategory } from "../-components/_field/field-category";
import { FieldDate } from "../-components/_field/field-date";
import { FieldDropdown } from "../-components/_field/field-dropdown";
import { FieldEvaluation } from "../-components/_field/field-evaluation";
import { FieldFile } from "../-components/_field/field-file";
import { FieldReaction } from "../-components/_field/field-reaction";
import { FieldRelationship } from "../-components/_field/field-relationship";
import { FieldTextLong } from "../-components/_field/field-text-long";
import { FieldTextShort } from "../-components/_field/field-text-short";

export const Route = createFileRoute("/_private/tables/$slug/rows/$rowId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useI18n();

  const { slug, rowId } = useParams({
    from: "/_private/tables/$slug/rows/$rowId",
  });

  const generateRecordLink = React.useCallback(() => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/public/tables/${slug}?record=${rowId}`;
  }, [slug, rowId]);

  const handleCopyLink = React.useCallback(async () => {
    try {
      const link = generateRecordLink();
      await navigator.clipboard.writeText(link);
      toast.success(
        t("TOAST_LINK_COPIED", "Link copiado para a área de transferência!")
      );
    } catch (error) {
      console.error(error);
      toast.error(t("ERROR_COPY_LINK", "Erro ao copiar link"));
    }
  }, [generateRecordLink, t]);

  const handleOpenLink = React.useCallback(() => {
    const link = generateRecordLink();
    window.open(link, "_blank");
  }, [generateRecordLink]);

  const handleShare = React.useCallback(async () => {
    const link = generateRecordLink();
    const shareTitle = t("SHARE_RECORD_TITLE", "Registro da tabela");
    const shareText = t("SHARE_RECORD_TEXT", "Confira este registro");

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle as string,
          text: shareText as string,
          url: link,
        });
      } catch (error) {
        // User cancelled sharing or error occurred
        if ((error as Error).name !== "AbortError") {
          handleCopyLink(); // Fallback to copying link
        }
      }
    } else {
      // Fallback: copy to clipboard
      handleCopyLink();
    }
  }, [generateRecordLink, handleCopyLink, t]);

  const table = useQuery({
    queryKey: ["/tables/".concat(slug), slug],
    queryFn: async () => {
      const route = "/tables/".concat(slug);
      const response = await API.get<Table>(route);
      return response.data;
    },
    enabled: Boolean(slug) && Boolean(rowId),
  });

  const row = useQuery({
    queryKey: [
      "/tables/".concat(slug).concat("/rows/").concat(rowId),
      slug,
      rowId,
    ],
    queryFn: async () => {
      const route = "/tables/".concat(slug).concat("/rows/").concat(rowId);
      const response = await API.get<Row>(route);
      return response.data;
    },
    enabled: Boolean(slug) && Boolean(rowId),
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1 border-b">
        <h1 className="text-2xl font-medium ">
          {t(
            "TABLE_ROUTE_SHEET_INTERNAL_REGISTER_SHOW_TITLE",
            "Detalhes do registro"
          )}
        </h1>

        <div className="inline-flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="gap-2 flex-1 sm:flex-none"
          >
            <CopyIcon className="h-4 w-4" />
            <span className="hidden sm:inline">
              {t("BUTTON_COPY_LINK", "Copiar link")}
            </span>
            <span className="sm:hidden">{t("BUTTON_COPY", "Copiar")}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenLink}
            className="gap-2 flex-1 sm:flex-none"
          >
            <ExternalLinkIcon className="h-4 w-4" />
            <span className="hidden sm:inline">
              {t("BUTTON_OPEN", "Abrir")}
            </span>
            <span className="sm:hidden">{t("BUTTON_OPEN", "Abrir")}</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleShare}
            className="gap-2 flex-1 sm:flex-none"
          >
            <Share2Icon className="h-4 w-4" />
            {t("BUTTON_SHARE", "Compartilhar")}
          </Button>
        </div>
      </div>

      <section className="flex flex-col gap-4 flex-1  min-h-0 overflow-auto relative">
        {table.status === "success" && row.status === "success" && (
          <div className="grid grid-cols-2 p-4">
            {table?.data?.fields.map((field) => {
              if (!(field?.slug in row.data) || !row.data) {
                return (
                  <div key={field?._id?.toString()} className="space-x-1">
                    <h2 className="font-semibold">{field?.name}</h2>
                    <p className="text-muted-foreground text-sm">-</p>
                  </div>
                );
              }

              if (field?.type === FIELD_TYPE.TEXT_SHORT) {
                return (
                  <div className="flex flex-col" key={field._id?.toString()}>
                    <h2 className="font-semibold text-sm">{field?.name}</h2>
                    <FieldTextShort field={field} row={row.data} />
                  </div>
                );
              }

              if (field.type === FIELD_TYPE.TEXT_LONG) {
                return (
                  <div className="flex flex-col" key={field._id?.toString()}>
                    <h2 className="font-semibold text-sm">{field?.name}</h2>
                    <FieldTextLong
                      field={field}
                      row={row.data}
                      // className={cn(!isSheet && "max-w-sm truncate")}
                    />
                  </div>
                );
              }

              if (field?.type === FIELD_TYPE.FILE) {
                return (
                  <div
                    className="flex flex-col gap-4"
                    key={field?._id?.toString()}
                  >
                    <h2 className="font-semibold text-sm">{field?.name}</h2>
                    <FieldFile field={field} row={row.data} isGallery />
                  </div>
                );
              }

              if (field?.type === FIELD_TYPE.DROPDOWN) {
                return (
                  <div
                    className="flex flex-col gap-0.5"
                    key={field._id?.toString()}
                  >
                    <h2 className="font-semibold text-sm">{field?.name}</h2>
                    <FieldDropdown field={field} row={row.data} />
                  </div>
                );
              }

              if (field?.type === FIELD_TYPE.CATEGORY) {
                return (
                  <div
                    className="flex flex-col gap-0.5"
                    key={field._id?.toString()}
                  >
                    <h2 className="font-semibold text-sm">{field?.name}</h2>
                    <FieldCategory field={field} row={row.data} />
                  </div>
                );
              }

              if (field?.type === FIELD_TYPE.DATE) {
                return (
                  <div
                    className="flex flex-col gap-0.5"
                    key={field._id?.toString()}
                  >
                    <h2 className="font-semibold text-sm">{field?.name}</h2>
                    <FieldDate field={field} row={row.data} />
                  </div>
                );
              }

              if (field?.type === FIELD_TYPE.RELATIONSHIP) {
                return (
                  <div
                    className="flex flex-col gap-0.5"
                    key={field._id?.toString()}
                  >
                    <h2 className="font-semibold text-sm">{field?.name}</h2>
                    <FieldRelationship field={field} row={row.data} />
                  </div>
                );
              }

              if (field?.type === FIELD_TYPE.REACTION) {
                return (
                  <div
                    className="flex flex-col gap-0.5"
                    key={field?._id?.toString()}
                  >
                    <h2 className="font-semibold text-sm">{field?.name}</h2>
                    <FieldReaction field={field} row={row.data} />
                  </div>
                );
              }

              if (field?.type === FIELD_TYPE.EVALUATION) {
                return (
                  <div
                    className="flex flex-col gap-0.5"
                    key={field?._id?.toString()}
                  >
                    <h2 className="font-semibold text-sm">{field?.name}</h2>
                    <FieldEvaluation size={16} field={field} row={row.data} />
                  </div>
                );
              }
            })}
          </div>
        )}
      </section>

      <div className="flex flex-col shrink-0 border-t p-2">
        {row.status === "success" && (
          <span className="font-normal text-sm opacity-50 text-right">
            {t("RECORD_CREATED_AT", "Criado em")}{" "}
            {format(row.data?.createdAt, "dd 'de' MMMM 'às' HH:mm")}
            {row?.data?.creator && (
              <span>
                {t("RECORD_CREATED_BY", "por")} {row?.data?.creator?.name}
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
