import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { useParams, useRouter } from '@tanstack/react-router';
import {
  CodeIcon,
  CodepenIcon,
  InfoIcon,
  PencilIcon,
  PlusIcon,
  SendToBackIcon,
  Settings2Icon,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

import { ApiEndpointsModal } from './-api-endpoints-modal';

import { Button } from '@/components/ui/button';
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
} from '@/components/ui/dropdown-menu';
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { FIELD_TYPE } from '@/lib/constant';
import type { IField } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

interface FieldGroupSubMenuProps {
  field: IField;
  originSlug: string;
}

function FieldGroupSubMenu({
  field,
  originSlug,
}: FieldGroupSubMenuProps): React.JSX.Element {
  const router = useRouter();
  const groupTable = useReadTable({ slug: field.slug });

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <span>Gerenciar {field.name}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <DropdownMenuItem
            className="inline-flex space-x-1 w-full"
            onClick={() => {
              router.navigate({
                to: '/tables/$slug/field/create',
                params: { slug: field.slug },
                search: { from: originSlug },
              });
            }}
          >
            <PlusIcon className="size-4" />
            <span>Novo campo</span>
          </DropdownMenuItem>

          {groupTable.status === 'success' &&
            groupTable.data.fields.filter((f) => !f.trashed).length > 0 && (
              <DropdownMenuSeparator />
            )}

          {groupTable.status === 'success' &&
            groupTable.data.fields
              .filter((f) => !f.trashed)
              .map((groupField) => (
                <DropdownMenuItem
                  key={groupField._id}
                  className="inline-flex space-x-1 w-full"
                  onClick={() => {
                    router.navigate({
                      to: '/tables/$slug/field/$fieldId',
                      params: { slug: field.slug, fieldId: groupField._id },
                      search: { from: originSlug },
                    });
                  }}
                >
                  <PencilIcon className="size-4" />
                  <span>Editar {groupField.name}</span>
                </DropdownMenuItem>
              ))}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}

interface TableConfigurationProps {
  tableSlug: string;
}

export function TableConfigurationDropdown({
  tableSlug,
}: TableConfigurationProps): React.JSX.Element {
  const { slug } = useParams({
    from: '/_private/tables/$slug/',
  });

  const router = useRouter();

  const table = useReadTable({ slug: tableSlug });

  const [apiModalOpen, setApiModalOpen] = useState(false);

  return (
    <DropdownMenu
      dir="ltr"
      modal={false}
    >
      <DropdownMenuTrigger asChild>
        <Button
          disabled={table.status === 'pending'}
          className={cn(
            'shadow-none p-1 h-auto',
            // !verify({
            //   resource: 'update-table',
            //   owner: table?.data?.configuration?.owner?._id,
            //   administrators:
            //     table?.data?.configuration?.administrators?.flatMap((a) =>
            //       a._id?.toString(),
            //     ) || [],
            // }) && 'hidden',
          )}
          variant="outline"
        >
          <Settings2Icon className="size-4" />
          <span>Configuração</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="mr-12 max-w-xs w-full">
        <DropdownMenuLabel>Campos</DropdownMenuLabel>

        <DropdownMenuGroup>
          <DropdownMenuItem
            className="inline-flex space-x-1 w-full"
            onClick={() => {
              router.navigate({
                to: '/tables/$slug/field/create',
                params: { slug },
              });
            }}
          >
            <PlusIcon className="size-4" />
            <span>Novo campo</span>
          </DropdownMenuItem>

          {table.status === 'success' &&
            table.data.fields.filter((f) => !f.trashed).length > 0 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="inline-flex space-x-1 w-full">
                  <SendToBackIcon className="size-4" />
                  <span>Gerenciar campos</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    {table.data.fields
                      .filter((f) => !f.trashed)
                      .map((field) => (
                        <DropdownMenuItem
                          key={field._id}
                          // className="inline-flex space-x-1 w-full"
                          onClick={() => {
                            router.navigate({
                              to: '/tables/$slug/field/$fieldId',
                              params: { slug, fieldId: field._id },
                            });
                          }}
                        >
                          <PencilIcon className="size-4" />
                          <span>Editar {field.name}</span>
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            )}
        </DropdownMenuGroup>

        {table.data?.type === 'table' && (
          <React.Fragment>
            <DropdownMenuSeparator />

            <DropdownMenuLabel>Grupo de campos</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="inline-flex space-x-1 w-full"
                onClick={() => {
                  router.navigate({
                    to: '/tables/$slug/field/create',
                    params: { slug },
                    search: { 'field-type': FIELD_TYPE.FIELD_GROUP },
                  });
                }}
              >
                <PlusIcon className="size-4" />
                <span>Novo grupo</span>
              </DropdownMenuItem>

              {table.data.fields
                .filter((f) => f.type === FIELD_TYPE.FIELD_GROUP && !f.trashed)
                .map((field) => (
                  <FieldGroupSubMenu
                    key={field._id}
                    field={field}
                    originSlug={slug}
                  />
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
              router.navigate({
                to: '/tables/$slug/detail',
                params: { slug },
              });
            }}
          >
            <PencilIcon className="size-4" />
            {table.data?.type === 'table' && <span>Editar tabela</span>}

            {table.data?.type === 'field-group' && <span>Editar grupo</span>}
          </DropdownMenuItem>

          <DropdownMenuItem
            className="inline-flex space-x-1 w-full"
            onClick={() => {
              router.navigate({
                to: '/tables/$slug/methods',
                params: { slug },
              });
            }}
          >
            <CodepenIcon className="size-4" />
            <span>Métodos</span>
          </DropdownMenuItem>

          {table.data?.type === 'table' && (
            <DropdownMenuItem
              className="inline-flex space-x-1 w-full"
              onClick={() => setApiModalOpen(true)}
            >
              <InfoIcon className="size-4" />
              <span>Informações da API</span>
            </DropdownMenuItem>
          )}

          {table.data?.type === 'table' && (
            <DropdownMenuItem
              className="inline-flex space-x-1 w-full"
              onClick={() => {
                const embedUrl = window.location.href;
                const iframeCode = `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0"></iframe>`;

                navigator.clipboard.writeText(iframeCode);

                toast('Código embed copiado', {
                  className:
                    '!bg-primary !text-primary-foreground !border-primary',
                  description:
                    'O código iframe foi copiado para a área de transferência',
                  descriptionClassName: '!text-primary-foreground',
                  closeButton: true,
                });
              }}
            >
              <CodeIcon className="size-4" />
              <span>Gerar código embed</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>

      <ApiEndpointsModal
        tableSlug={tableSlug}
        open={apiModalOpen}
        onOpenChange={setApiModalOpen}
      />
    </DropdownMenu>
  );
}
