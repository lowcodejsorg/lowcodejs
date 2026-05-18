import { FilterIcon, XIcon } from 'lucide-react';
import React from 'react';

import {
  ACTION_META,
  ACTION_OPTIONS,
  DEFAULT_FILTERS,
  OBJECT_OPTIONS,
} from './-constants';
import type { ActionType, FiltersState, ObjectType } from './-constants';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { LOGGER_ACTION_LABEL, LOGGER_OBJECT_LABEL } from '@/lib/constant';
import { cn } from '@/lib/utils';

interface HistoryFiltersFormProps {
  draft: FiltersState;
  setDraft: React.Dispatch<React.SetStateAction<FiltersState>>;
}

function HistoryFiltersForm({
  draft,
  setDraft,
}: HistoryFiltersFormProps): React.JSX.Element {
  const toggleAction = (action: ActionType): void => {
    setDraft((prev) => ({
      ...prev,
      actions: prev.actions.includes(action)
        ? prev.actions.filter((a) => a !== action)
        : [...prev.actions, action],
    }));
  };

  const toggleObject = (type: ObjectType): void => {
    setDraft((prev) => ({
      ...prev,
      objects: prev.objects.includes(type)
        ? prev.objects.filter((t) => t !== type)
        : [...prev.objects, type],
    }));
  };

  return (
    <section
      data-slot="filter-fields"
      className="flex flex-col gap-4 w-full"
    >
      <Field>
        <FieldLabel>Buscar</FieldLabel>
        <Input
          placeholder="Filtrar por URL, ID do objeto, ação..."
          value={draft.search}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, search: e.target.value }))
          }
        />
      </Field>

      <Field>
        <FieldLabel>Ação</FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          {ACTION_OPTIONS.map((action) => {
            const Icon = ACTION_META[action].icon;
            const checked = draft.actions.includes(action);
            return (
              <label
                key={action}
                className={cn(
                  'flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer text-sm transition-colors',
                  {
                    'border-primary bg-primary/5': checked,
                    'border-border hover:bg-accent': !checked,
                  },
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggleAction(action)}
                />
                <Icon className="size-4" />
                {LOGGER_ACTION_LABEL[action]}
              </label>
            );
          })}
        </div>
      </Field>

      <Field>
        <FieldLabel>Tipo de objeto</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {OBJECT_OPTIONS.map((type) => {
            const checked = draft.objects.includes(type);
            return (
              <button
                type="button"
                key={type}
                onClick={() => toggleObject(type)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs cursor-pointer transition-colors',
                  {
                    'border-primary bg-primary text-primary-foreground':
                      checked,
                    'border-border bg-background hover:bg-accent': !checked,
                  },
                )}
              >
                {LOGGER_OBJECT_LABEL[type]}
              </button>
            );
          })}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel>De</FieldLabel>
          <Input
            type="date"
            value={draft.dateFrom}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, dateFrom: e.target.value }))
            }
          />
        </Field>
        <Field>
          <FieldLabel>Até</FieldLabel>
          <Input
            type="date"
            value={draft.dateTo}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, dateTo: e.target.value }))
            }
          />
        </Field>
      </div>
    </section>
  );
}

interface HistoryFilterSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: FiltersState;
  onApply: (filters: FiltersState) => void;
  onClear: () => void;
}

export function HistoryFilterSidebar({
  open,
  onOpenChange,
  value,
  onApply,
  onClear,
}: HistoryFilterSidebarProps): React.JSX.Element {
  const isMobile = useIsMobile();
  const [draft, setDraft] = React.useState<FiltersState>(value);

  React.useEffect(() => {
    setDraft(value);
  }, [value]);

  const handleSubmit = (): void => {
    onApply(draft);
  };

  const handleClear = (): void => {
    setDraft(DEFAULT_FILTERS);
    onClear();
  };

  if (isMobile) {
    return (
      <Sheet
        data-slot="filter-sidebar"
        data-test-id="filter-sidebar"
        open={open}
        onOpenChange={onOpenChange}
      >
        <SheetContent
          side="left"
          className="flex flex-col py-4 px-6 gap-5 overflow-y-auto"
        >
          <SheetHeader className="px-0">
            <SheetTitle className="text-lg font-medium flex items-center gap-2">
              <FilterIcon className="size-4" />
              Filtros
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4 w-full flex-1">
            <HistoryFiltersForm
              draft={draft}
              setDraft={setDraft}
            />
          </div>

          <SheetFooter className="flex-row w-full justify-end gap-4 px-0">
            <Button
              data-test-id="filter-clear-btn"
              onClick={() => {
                handleClear();
                onOpenChange(false);
              }}
              type="button"
              className="shadow-none border bg-transparent border-destructive text-destructive hover:bg-destructive/20"
            >
              Limpar
            </Button>
            <Button
              data-test-id="filter-submit-btn"
              onClick={() => {
                handleSubmit();
                onOpenChange(false);
              }}
            >
              Pesquisar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      data-slot="filter-sidebar"
      data-test-id="filter-sidebar"
      className={cn(
        'shrink-0 transition-[width] duration-200 ease-linear overflow-hidden border-r',
        {
          'w-70': open,
          'w-0 border-r-0': !open,
        },
      )}
    >
      <div className="w-70 h-full flex flex-col">
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <FilterIcon className="size-4" />
            Filtros
          </h2>
          <Button
            data-test-id="filter-close-btn"
            variant="ghost"
            size="icon-sm"
            onClick={() => onOpenChange(false)}
          >
            <XIcon className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          <HistoryFiltersForm
            draft={draft}
            setDraft={setDraft}
          />
        </div>

        <div className="shrink-0 flex justify-end gap-2 px-4 py-3 border-t">
          <Button
            data-test-id="filter-clear-btn"
            onClick={handleClear}
            type="button"
            size="sm"
            className="shadow-none border bg-transparent border-destructive text-destructive hover:bg-destructive/20"
          >
            Limpar
          </Button>
          <Button
            data-test-id="filter-submit-btn"
            onClick={handleSubmit}
            size="sm"
          >
            Pesquisar
          </Button>
        </div>
      </div>
    </div>
  );
}
