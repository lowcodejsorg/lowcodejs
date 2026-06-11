import React from 'react';

import { FieldManagement } from '../field-management/field-management';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGroupFieldManagement } from '@/hooks/use-group-field-management';
import type { ITable } from '@/lib/interfaces';

interface GroupFieldManagementSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: ITable;
  groupSlug: string;
}

export function GroupFieldManagementSheet({
  open,
  onOpenChange,
  table,
  groupSlug,
}: GroupFieldManagementSheetProps): React.JSX.Element {
  const actions = useGroupFieldManagement(table, groupSlug);

  const targetGroup = (table.groups ?? []).find((g) => g.slug === groupSlug);
  const groupName = targetGroup?.name ?? groupSlug;

  const nonNativeFields = actions.fields.filter((f) => !f.native);
  const trashedCount = nonNativeFields.filter((f) => f.trashed).length;

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg flex flex-col gap-0 p-0"
      >
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <SheetTitle>Gerenciar campos - {groupName}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-auto p-4">
          <FieldManagement.Root actions={actions}>
            <Tabs
              defaultValue="display"
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="display">Lista</TabsTrigger>
                <TabsTrigger value="form">Formulários</TabsTrigger>
                <TabsTrigger
                  value="trashed"
                  disabled={trashedCount === 0}
                >
                  Lixeira{trashedCount > 0 && ` (${trashedCount})`}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="display">
                <FieldManagement.List visibilityKey="showInList" />
              </TabsContent>

              <TabsContent value="form">
                <FieldManagement.List
                  visibilityKey="showInForm"
                  excludeNative
                />
              </TabsContent>

              <TabsContent value="trashed">
                <FieldManagement.TrashedList excludeNative />
              </TabsContent>
            </Tabs>
          </FieldManagement.Root>
        </div>
      </SheetContent>
    </Sheet>
  );
}
