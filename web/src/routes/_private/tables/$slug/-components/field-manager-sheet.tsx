import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Sheet as Root,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useI18n } from "@/hooks/i18.hook";
import { useTableManagement } from "@/hooks/table-management.hook";
import { API } from "@/lib/api";
import type { Field, Paginated, Table } from "@/lib/entity";
import { QueryClient } from "@/lib/query-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { AnimatePresence, Reorder, useDragControls } from "framer-motion";
import { ArrowDownUpIcon, LoaderCircleIcon, PencilIcon } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { FieldTableUpdateSheet } from "./field-table-update-sheet";

function TrashedItem({ item }: { item: Field }) {
  const { t } = useI18n();
  const updateFieldTableButtonRef = React.useRef<HTMLButtonElement | null>(
    null
  );

  return (
    <TooltipProvider>
      <div
        className={
          "shadow-sm inline-flex px-4 py-2 w-full flex-1 justify-between border rounded-xl items-center"
        }
      >
        <span>{item.name}</span>
        <div className="inline-flex gap-2 items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={() => {
                  updateFieldTableButtonRef.current?.click();
                }}
              >
                <PencilIcon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {t(
                  "TABLE_ROUTE_SHEET_INTERNAL_FIELD_MANAGEMENT_EDIT_TOOLTIP",
                  "Editar campo"
                )}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <FieldTableUpdateSheet _id={item._id} ref={updateFieldTableButtonRef} />
      </div>
    </TooltipProvider>
  );
}

function ReorderItem({ item }: { item: Field }) {
  const { t } = useI18n();
  const dragControls = useDragControls();
  const updateFieldTableButtonRef = React.useRef<HTMLButtonElement | null>(
    null
  );

  return (
    <TooltipProvider>
      <Reorder.Item
        value={item}
        id={item._id}
        initial={{ opacity: 0, y: 30 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: { duration: 0.15 },
        }}
        exit={{ opacity: 0, y: 20, transition: { duration: 0.3 } }}
        className={
          "shadow-sm inline-flex px-4 py-2 w-full flex-1 justify-between border rounded-xl items-center"
        }
        dragControls={dragControls}
        as="li"
      >
        <span>{item.name}</span>
        <div className="inline-flex gap-2 items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={() => {
                  updateFieldTableButtonRef.current?.click();
                }}
              >
                <PencilIcon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {t(
                  "TABLE_ROUTE_SHEET_INTERNAL_FIELD_MANAGEMENT_EDIT_TOOLTIP",
                  "Editar campo"
                )}
              </p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                className="cursor-grab"
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  dragControls.start(event);
                }}
              >
                <ArrowDownUpIcon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {t(
                  "TABLE_ROUTE_SHEET_INTERNAL_FIELD_MANAGEMENT_DRAG_TOOLTIP",
                  "Arrastar para reordenar"
                )}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <FieldTableUpdateSheet _id={item._id} ref={updateFieldTableButtonRef} />
      </Reorder.Item>
    </TooltipProvider>
  );
}

function FieldManagerForm({
  table,
  onClose,
  reference,
}: {
  reference: "orderList" | "orderForm";
  table: Table;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const management = useTableManagement();

  const search = useSearch({
    strict: false,
  });

  const order = table.configuration?.fields?.[reference] ?? [];

  const sorted = table.fields?.sort(
    (a, b) => order.indexOf(a._id) - order.indexOf(b._id)
  );

  const [fields, setFields] = React.useState<Field[]>(
    sorted?.filter((f) => !f.trashed) ?? []
  );

  const [isReordering, setIsReordering] = React.useState(false);

  const update = useMutation({
    mutationFn: async function (
      payload: Pick<Table, "name" | "description" | "configuration"> & {
        logo: string | null;
      }
    ) {
      const route = "/tables/".concat(management.slug);
      const response = await API.put<Table>(route, payload);
      return response.data;
    },
    onSuccess(data) {
      onClose();

      QueryClient.setQueryData<Table>(
        ["/tables/".concat(management.slug), management.slug],
        data
      );

      QueryClient.setQueryData<Paginated<Table[]>>(
        ["/tables/paginated", search],
        (old) => {
          if (!old) return old;
          return {
            meta: old.meta,
            data: old.data.map((table) => {
              if (table._id === data._id) {
                return data;
              }
              return table;
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
          toast.error(
            data?.message ??
              "Permissões insuficientes para atualizar esta coleção"
          );
        }

        // 404 - TABLE_NOT_FOUND
        if (data?.code === 404 && data?.cause === "TABLE_NOT_FOUND") {
          toast.error(data?.message ?? "Coleção não encontrada");
        }

        // 409 - TABLE_ALREADY_EXISTS
        if (data?.code === 409 && data?.cause === "TABLE_ALREADY_EXISTS") {
          toast.error(data?.message ?? "Coleção com este nome já existe");
        }

        // 422 - UNPROCESSABLE_ENTITY
        if (data?.code === 422 && data?.cause === "UNPROCESSABLE_ENTITY") {
          toast.error(data?.message ?? "Valores de configuração inválidos");
        }

        // 500 - SERVER_ERROR
        if (data?.code === 500 && data?.cause === "SERVER_ERROR") {
          toast.error(data?.message ?? "Erro interno do servidor");
        }
      }

      console.error(error);
    },
  });

  return (
    <form className="space-y-4">
      <Reorder.Group
        axis="y"
        onReorder={(order) => {
          setFields(order);
          setIsReordering(true);
        }}
        values={fields}
        className="flex flex-col gap-2 select-none"
        as="ul"
      >
        <AnimatePresence initial={false}>
          {fields?.map((field) => (
            <ReorderItem item={field} key={field._id} />
          ))}
        </AnimatePresence>
      </Reorder.Group>

      <Button
        className="w-full"
        type="button"
        disabled={!isReordering || update.status === "pending"}
        onClick={() => {
          update.mutateAsync({
            ...table,
            logo: table?.logo?._id ?? null,
            configuration: {
              ...table?.configuration,
              fields: {
                ...table?.configuration?.fields,
                ...(reference === "orderForm" && {
                  orderForm: fields.map((item) => item._id),
                }),
                ...(reference === "orderList" && {
                  orderList: fields.map((item) => item._id),
                }),
              },
            },
          });
        }}
      >
        {update.status === "pending" && (
          <LoaderCircleIcon className="size-4 animate-spin" />
        )}
        {!(update.status === "pending") && (
          <span>
            {t("TABLE_FIELD_MANAGER_ORDER_UPDATE_BUTTON", "Update order")}
          </span>
        )}
      </Button>
    </form>
  );
}

export function FieldManagerSheet({
  ...props
}: React.ComponentProps<typeof SheetTrigger>) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);

  const management = useTableManagement();

  const table = useQuery({
    queryKey: ["/tables/".concat(management.slug), management.slug],
    queryFn: async () => {
      const route = "/tables/".concat(management.slug);
      const response = await API.get<Table>(route);
      return response.data;
    },
    enabled: Boolean(management.slug) && open,
  });

  return (
    <Root
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          management.reset();
        }

        setOpen(o);
      }}
    >
      <SheetTrigger className="hidden" {...props} />
      <SheetContent className="flex flex-col py-4 px-6 gap-5 sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="px-0">
          <SheetTitle className="text-lg font-medium">
            {t(
              "TABLE_ROUTE_SHEET_INTERNAL_FIELD_MANAGEMENT_TITLE",
              "Gerenciar campos"
            )}
          </SheetTitle>
          <SheetDescription>
            {t(
              "TABLE_ROUTE_SHEET_INTERNAL_FIELD_MANAGEMENT_DESCRIPTION",
              "Arraste para ordenar ou clique em editar"
            )}
          </SheetDescription>
        </SheetHeader>

        {table?.status === "success" && (
          <Accordion
            type="single"
            collapsible
            className="my-4 w-full space-y-2"
            defaultValue="list-gallery"
          >
            <AccordionItem
              value="list-gallery"
              className="border-none rounded-md px-4 bg-secondary"
            >
              <AccordionTrigger>
                {t(
                  "TABLE_FIELD_MANAGER_ORDER_LIST_TITLE",
                  "Order of fields in list/gallery"
                )}
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-4 text-balance">
                <FieldManagerForm
                  table={table.data}
                  reference="orderList"
                  onClose={() => {
                    management.reset();
                    setOpen(false);
                  }}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="form"
              className="border-none rounded-md px-4 bg-secondary"
            >
              <AccordionTrigger>
                {t(
                  "TABLE_FIELD_MANAGER_ORDER_FORM_TITLE",
                  "Order of fields in form"
                )}
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-4 text-balance">
                <FieldManagerForm
                  table={table.data}
                  reference="orderForm"
                  onClose={() => {
                    management.reset();
                    setOpen(false);
                  }}
                />
              </AccordionContent>
            </AccordionItem>

            {table?.data?.fields?.filter((f) => f.trashed)?.length > 0 && (
              <AccordionItem
                value="trashed"
                className="border-none rounded-md px-4 bg-secondary"
              >
                <AccordionTrigger>
                  {t("FIELD_MANAGEMENT_TRASH_LABEL", "Lixeira")}
                </AccordionTrigger>
                <AccordionContent className="flex flex-col gap-4 text-balance">
                  {table?.data?.fields
                    ?.filter((f) => f.trashed)
                    .map((f) => (
                      <TrashedItem item={f} key={f._id} />
                    ))}
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        )}
      </SheetContent>
    </Root>
  );
}
