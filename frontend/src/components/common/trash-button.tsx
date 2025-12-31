/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useRouter, useSearch } from '@tanstack/react-router';
import { LogOutIcon } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function TrashButton(): React.JSX.Element {
  const search = useSearch({
    strict: false,
  }) as Record<string, any>;

  const router = useRouter();

  return (
    <Button
      onClick={() => {
        if (!search.trashed) {
          router.navigate({
            // @ts-ignore
            search: (state) => ({
              ...state,
              trashed: true,
              page: 1,
              perPage: 50,
            }),
          });
          return;
        }

        router.navigate({
          // @ts-ignore
          search: (state) => ({
            ...state,
            trashed: false,
            page: 1,
            perPage: 50,
          }),
        });
      }}
      className={cn(
        'py-1 px-2 h-auto inline-flex gap-1',
        search.trashed && 'border border-muted-foreground',
      )}
      variant="outline"
    >
      {!search.trashed && (
        <React.Fragment>
          <LogOutIcon className="size-4" />
          <span>Ver lixeira</span>
        </React.Fragment>
      )}
      {search.trashed && (
        <React.Fragment>
          <LogOutIcon className="size-4 rotate-180" />
          <span>Sair da lixeira</span>
        </React.Fragment>
      )}
    </Button>
  );
}
