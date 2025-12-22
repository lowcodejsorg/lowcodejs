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
import React from 'react';
import { toast } from 'sonner';

// import { UpdateTableSheet } from '../../-components/update-table.sheet';

// import { ApiEndpointsModal } from './api-endpoints-modal';
// import { DialogTableMethod } from './dialog-table-method';
// import { FieldManagerSheet } from './field-manager-sheet';
// import { FieldTableCreateSheet } from './field-table-create-sheet';

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
import { useReadTable } from '@/integrations/tanstack-query/implementations/use-table-read';
import { FIELD_TYPE } from '@/lib/constant';
import { cn } from '@/lib/utils';

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

  // const updateTableButtonRef = React.useRef<HTMLButtonElement | null>(null);

  // const managerTableFieldButtonRef = React.useRef<HTMLButtonElement | null>(
  //   null,
  // );

  // const createTableFieldButtonRef = React.useRef<HTMLButtonElement | null>(
  //   null,
  // );

  // const apiEndpointsModalButtonRef = React.useRef<HTMLButtonElement | null>(
  //   null,
  // );

  // const dialogTableMethodButtonRef = React.useRef<HTMLButtonElement | null>(
  //   null,
  // );

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

          {table.status === 'success' && table.data.fields.length > 0 && (
            <DropdownMenuItem
              className="inline-flex space-x-1 w-full"
              // onClick={() => {
              //   managerTableFieldButtonRef?.current?.click();
              // }}
            >
              <SendToBackIcon className="size-4" />
              <span>Gerenciar campos</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        {table.data?.type === 'table' && (
          <React.Fragment>
            <DropdownMenuSeparator />

            <DropdownMenuLabel>Grupo de campos</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="inline-flex space-x-1 w-full"
                // onClick={() => {
                //   createTableFieldButtonRef?.current?.click();

                //   router.navigate({
                //     search: {
                //       // @ts-ignore
                //       'field-type': 'group',
                //       action: 'create',
                //     },
                //     replace: true,
                //   });
                // }}
              >
                <PlusIcon className="size-4" />
                <span>Novo grupo</span>
              </DropdownMenuItem>

              {table.data.fields
                .filter((f) => f.type === FIELD_TYPE.FIELD_GROUP && !f.trashed)
                .map((field) => (
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
                              to: '/group/$groupSlug/field/create',
                              params: { groupSlug: field.slug },
                              search: { from: slug },
                            });
                          }}
                        >
                          <PlusIcon className="size-4" />
                          <span>Novo campo</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="inline-flex space-x-1 w-full"
                          // onClick={() => {
                          //   management.handleSlug(field.slug);
                          //   managerTableFieldButtonRef?.current?.click();
                          // }}
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
            // onClick={() => {
            //   dialogTableMethodButtonRef?.current?.click();
            // }}
          >
            <CodepenIcon className="size-4" />
            <span>Métodos</span>
          </DropdownMenuItem>

          {table.data?.type === 'table' && (
            <DropdownMenuItem
              className="inline-flex space-x-1 w-full"
              // onClick={() => {
              //   apiEndpointsModalButtonRef?.current?.click();
              // }}
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

      {/* <FieldTableCreateSheet ref={createTableFieldButtonRef} /> */}

      {/* <FieldManagerSheet ref={managerTableFieldButtonRef} /> */}

      {/* <UpdateTableSheet
        slug={slug}
        ref={updateTableButtonRef}
      /> */}

      {/* <DialogTableMethod ref={dialogTableMethodButtonRef} /> */}

      {/* <ApiEndpointsModal ref={apiEndpointsModalButtonRef} /> */}
    </DropdownMenu>
  );
}
