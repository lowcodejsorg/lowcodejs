import { useRouter, useSearch } from '@tanstack/react-router';
import type { Column } from '@tanstack/react-table';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsLeftRightIcon,
  PinIcon,
  PinOffIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface DataTableColumnHeaderProps {
  title: string;
  orderKey?: string;
  routeId: string;
  canNavigate?: boolean;
  onTitleClick?: () => void;
  column?: Column<any, unknown>;
}

export function DataTableColumnHeader({
  title,
  orderKey,
  routeId,
  canNavigate,
  onTitleClick,
  column,
}: DataTableColumnHeaderProps): React.JSX.Element {
  const search = useSearch({ from: routeId as any });
  const router = useRouter();

  const isPinned = column?.getIsPinned();
  const canPin = column && !column.columnDef.enableHiding === false;

  if (!orderKey && !column) {
    return <span>{title}</span>;
  }

  let currentOrder: 'asc' | 'desc' | undefined = undefined;
  if (orderKey) {
    currentOrder = (search as Record<string, unknown>)[orderKey] as
      | 'asc'
      | 'desc'
      | undefined;
  }

  return (
    <div
      data-slot="data-table-column-header"
      className="inline-flex items-center"
    >
      {onTitleClick && (
        <Button
          className={cn(
            'h-auto px-2 py-1 border-none shadow-none bg-transparent hover:bg-transparent dark:bg-transparent',
            canNavigate && 'cursor-pointer',
            !canNavigate && 'cursor-default',
          )}
          variant="link"
          onClick={() => {
            if (canNavigate) onTitleClick();
          }}
        >
          {title}
        </Button>
      )}
      {!onTitleClick && <span>{title}</span>}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="h-auto px-1 py-1 border-none shadow-none bg-transparent hover:bg-transparent dark:bg-transparent"
            variant="outline"
            size="sm"
          >
            {currentOrder === 'asc' && <ArrowUpIcon className="size-4" />}
            {currentOrder === 'desc' && <ArrowDownIcon className="size-4" />}
            {!currentOrder && (
              <ChevronsLeftRightIcon className="size-4 rotate-90" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {orderKey && (
            <>
              <DropdownMenuItem
                onClick={() => {
                  router.navigate({
                    // @ts-ignore Tanstack Router Navigate
                    search: (state) => ({
                      ...state,
                      [orderKey]: 'asc',
                    }),
                  });
                }}
              >
                <ArrowUpIcon />
                <span>Crescente</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  router.navigate({
                    // @ts-ignore Tanstack Router Navigate
                    search: (state) => ({
                      ...state,
                      [orderKey]: 'desc',
                    }),
                  });
                }}
              >
                <ArrowDownIcon />
                <span>Decrescente</span>
              </DropdownMenuItem>
            </>
          )}

          {canPin && column && (
            <>
              {orderKey && <DropdownMenuSeparator />}
              {isPinned !== 'left' && (
                <DropdownMenuItem onClick={() => column.pin('left')}>
                  <PinIcon className="size-4" />
                  <span>Fixar a esquerda</span>
                </DropdownMenuItem>
              )}
              {isPinned !== 'right' && (
                <DropdownMenuItem onClick={() => column.pin('right')}>
                  <PinIcon className="size-4 rotate-90" />
                  <span>Fixar a direita</span>
                </DropdownMenuItem>
              )}
              {isPinned && (
                <DropdownMenuItem onClick={() => column.pin(false)}>
                  <PinOffIcon className="size-4" />
                  <span>Desafixar</span>
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
