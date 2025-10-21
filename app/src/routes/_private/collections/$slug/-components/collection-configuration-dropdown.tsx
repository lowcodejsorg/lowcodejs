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
import { useCollectionManagement } from "@/hooks/collection-management.hook";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import { FIELD_TYPE, type Collection } from "@/lib/entity";
import { cn } from "@/lib/utils";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "@tanstack/react-router";
import {
  PencilIcon,
  PlusIcon,
  SendToBackIcon,
  Settings2Icon,
} from "lucide-react";
import React from "react";
import { UpdateCollectionSheet } from "../../-components/update-collection.sheet";
import { FieldCollectionCreateSheet } from "./field-collection-create-sheet";
import { FieldManagerSheet } from "./field-manager-sheet";

export function CollectionConfigurationDropdown() {
  const management = useCollectionManagement();

  const { t } = useI18n();
  const { verify } = useAuthentication();

  const { slug } = useParams({
    from: "/_private/collections/$slug/",
  });

  const router = useRouter();

  const collection = useQuery({
    queryKey: ["/collections/".concat(slug), slug],
    queryFn: async () => {
      const route = "/collections/".concat(slug);
      const response = await API.get<Collection>(route);
      return response.data;
    },
    enabled: Boolean(slug),
  });

  const updateCollectionButtonRef = React.useRef<HTMLButtonElement | null>(
    null
  );

  const managerCollectionFieldButtonRef =
    React.useRef<HTMLButtonElement | null>(null);

  const createCollectionFieldButtonRef = React.useRef<HTMLButtonElement | null>(
    null
  );

  return (
    <DropdownMenu dir="ltr" modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={collection.status === "pending"}
          className={cn(
            "shadow-none p-1 h-auto",
            !verify({
              resource: "update-collection",
              owner: collection?.data?.configuration?.owner?._id,
              administrators:
                collection?.data?.configuration?.administrators?.flatMap((a) =>
                  a._id?.toString()
                ) || [],
            }) && "hidden"
          )}
          variant="outline"
        >
          <Settings2Icon className="size-4" />
          <span>
            {t(
              "COLLECTION_INTERNAL_CONFIGURATION_DROPDOWN_LABEL",
              "Configuração"
            )}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="mr-12 max-w-xs w-full">
        <DropdownMenuLabel>Campos</DropdownMenuLabel>

        <DropdownMenuGroup>
          <DropdownMenuItem
            className="inline-flex space-x-1 w-full"
            onClick={() => {
              createCollectionFieldButtonRef?.current?.click();
            }}
          >
            <PlusIcon className="size-4" />
            <span>Novo campo</span>
          </DropdownMenuItem>

          {collection?.status === "success" &&
            collection?.data?.fields?.length > 0 && (
              <DropdownMenuItem
                className="inline-flex space-x-1 w-full"
                onClick={() => {
                  managerCollectionFieldButtonRef?.current?.click();
                }}
              >
                <SendToBackIcon className="size-4" />
                <span>Gerenciar campos</span>
              </DropdownMenuItem>
            )}
        </DropdownMenuGroup>

        {collection?.data?.type === "collection" && (
          <React.Fragment>
            <DropdownMenuSeparator />

            <DropdownMenuLabel>Grupo de campos</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="inline-flex space-x-1 w-full"
                onClick={() => {
                  createCollectionFieldButtonRef?.current?.click();

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
                <span>Novo grupo</span>
              </DropdownMenuItem>

              {collection?.data?.fields
                .filter((f) => f.type === FIELD_TYPE.FIELD_GROUP && !f.trashed)
                ?.map((field) => (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <span> Gerenciar {field.name}</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem
                          className="inline-flex space-x-1 w-full"
                          onClick={() => {
                            management.handleSlug(field.slug);
                            createCollectionFieldButtonRef?.current?.click();
                          }}
                        >
                          <PlusIcon className="size-4" />
                          <span>Novo campo</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="inline-flex space-x-1 w-full"
                          onClick={() => {
                            management.handleSlug(field.slug);
                            managerCollectionFieldButtonRef?.current?.click();
                          }}
                        >
                          <SendToBackIcon className="size-4" />
                          <span>Gerenciar campos</span>
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                ))}
            </DropdownMenuGroup>
          </React.Fragment>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Geral</DropdownMenuLabel>

        <DropdownMenuGroup>
          <DropdownMenuItem
            className="inline-flex space-x-1 w-full"
            onClick={() => {
              updateCollectionButtonRef?.current?.click();
            }}
          >
            <PencilIcon className="size-4" />
            {collection?.data?.type === "collection" && (
              <span>Editar lista</span>
            )}

            {collection?.data?.type === "field-group" && (
              <span>Editar grupo de campos</span>
            )}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>

      <FieldCollectionCreateSheet ref={createCollectionFieldButtonRef} />

      <FieldManagerSheet ref={managerCollectionFieldButtonRef} />

      <UpdateCollectionSheet slug={slug} ref={updateCollectionButtonRef} />
    </DropdownMenu>
  );
}
