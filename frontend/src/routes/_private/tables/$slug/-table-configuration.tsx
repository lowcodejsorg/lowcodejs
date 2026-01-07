import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { useParams, useRouter } from '@tanstack/react-router';
import {
  ArrowUpDownIcon,
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
import { useTablePermission } from '@/hooks/use-table-permission';
import { E_FIELD_TYPE } from '@/lib/constant';
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
  const permission = useTablePermission(groupTable.data);

  const activeFields = groupTable.data?.fields.filter((f) => !f.trashed) ?? [];

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <span>Gerenciar {field.name}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          {permission.can('CREATE_FIELD') && (
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
          )}

          {permission.can('UPDATE_FIELD') && activeFields.length > 1 && (
            <DropdownMenuItem
              className="inline-flex space-x-1 w-full"
              onClick={() => {
                router.navigate({
                  to: '/tables/$slug/field/order',
                  params: { slug: field.slug },
                  search: { from: originSlug },
                });
              }}
            >
              <ArrowUpDownIcon className="size-4" />
              <span>Gerenciar ordem</span>
            </DropdownMenuItem>
          )}

          {permission.can('UPDATE_FIELD') &&
            activeFields.length > 0 && <DropdownMenuSeparator />}

          {permission.can('UPDATE_FIELD') &&
            activeFields.map((groupField) => (
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
  const permission = useTablePermission(table.data);

  const [apiModalOpen, setApiModalOpen] = useState(false);

  const activeFields =
    table.data?.fields.filter(
      (f) => f.type !== E_FIELD_TYPE.FIELD_GROUP && !f.trashed,
    ) ?? [];

  const fieldGroups =
    table.data?.fields.filter(
      (f) => f.type === E_FIELD_TYPE.FIELD_GROUP && !f.trashed,
    ) ?? [];

  // Ocultar dropdown se não tiver permissão de gerenciar
  const canManage =
    permission.can('CREATE_FIELD') ||
    permission.can('UPDATE_FIELD') ||
    permission.can('UPDATE_TABLE');

  if (!canManage) {
    return <></>;
  }

  return (
    <DropdownMenu
      dir="ltr"
      modal={false}
    >
      <DropdownMenuTrigger asChild>
        <Button
          disabled={table.status === 'pending'}
          className={cn('shadow-none p-1 h-auto')}
          variant="outline"
        >
          <Settings2Icon className="size-4" />
          <span>Configuração</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="mr-12 max-w-xs w-full">
        {(permission.can('CREATE_FIELD') || permission.can('UPDATE_FIELD')) && (
          <DropdownMenuLabel>Campos</DropdownMenuLabel>
        )}

        <DropdownMenuGroup>
          {permission.can('CREATE_FIELD') && (
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
          )}

          {permission.can('UPDATE_FIELD') && activeFields.length > 0 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="inline-flex space-x-1 w-full">
                <SendToBackIcon className="size-4" />
                <span>Gerenciar campos</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {activeFields.length > 1 && (
                    <>
                      <DropdownMenuItem
                        className="inline-flex space-x-1 w-full"
                        onClick={() => {
                          router.navigate({
                            to: '/tables/$slug/field/order',
                            params: { slug },
                            search: { from: slug },
                          });
                        }}
                      >
                        <ArrowUpDownIcon className="size-4" />
                        <span>Gerenciar ordem</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  {activeFields.map((field) => (
                    <DropdownMenuItem
                      key={field._id}
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

        {table.data?.type === 'table' &&
          (permission.can('CREATE_FIELD') || permission.can('UPDATE_FIELD')) && (
            <React.Fragment>
              <DropdownMenuSeparator />

              <DropdownMenuLabel>Grupo de campos</DropdownMenuLabel>
              <DropdownMenuGroup>
                {permission.can('CREATE_FIELD') && (
                  <DropdownMenuItem
                    className="inline-flex space-x-1 w-full"
                    onClick={() => {
                      router.navigate({
                        to: '/tables/$slug/field/create',
                        params: { slug },
                        search: { 'field-type': E_FIELD_TYPE.FIELD_GROUP },
                      });
                    }}
                  >
                    <PlusIcon className="size-4" />
                    <span>Novo grupo</span>
                  </DropdownMenuItem>
                )}

                {permission.can('UPDATE_FIELD') &&
                  fieldGroups.map((field) => (
                    <FieldGroupSubMenu
                      key={field._id}
                      field={field}
                      originSlug={slug}
                    />
                  ))}
              </DropdownMenuGroup>
            </React.Fragment>
          )}

        {permission.can('UPDATE_TABLE') && (
          <React.Fragment>
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
          </React.Fragment>
        )}
      </DropdownMenuContent>

      <ApiEndpointsModal
        tableSlug={tableSlug}
        open={apiModalOpen}
        onOpenChange={setApiModalOpen}
      />
    </DropdownMenu>
  );
}
