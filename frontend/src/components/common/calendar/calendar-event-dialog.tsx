import { useStore } from '@tanstack/react-store';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import {
  parseDateTimeLocalInputValue,
  toDateTimeLocalInputValue,
} from '@/lib/calendar-helpers';
import type {
  CalendarEventItem,
  CalendarResolvedFields,
} from '@/lib/calendar-helpers';
import type { IDropdown, IRow } from '@/lib/interfaces';

type CalendarEventFormValues = {
  title: string;
  description: string;
  start: string;
  end: string;
  color: string;
};

interface CalendarEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  fields: CalendarResolvedFields;
  event: CalendarEventItem | null;
  defaultStartDate?: Date | null;
  isPending: boolean;
  onSubmit: (payload: {
    title: string;
    description: string;
    start: Date;
    end: Date;
    colorOptionId: string | null;
  }) => Promise<void> | void;
  onDeleteClick?: () => void;
  onOpenRecord?: (row: IRow) => void;
}

function getColorOptions(fields: CalendarResolvedFields): Array<IDropdown> {
  return Array.isArray(fields.colorField?.dropdown)
    ? fields.colorField.dropdown
    : [];
}

function getInitialValues(args: {
  event: CalendarEventItem | null;
  defaultStartDate?: Date | null;
  fields: CalendarResolvedFields;
}): CalendarEventFormValues {
  const { event, defaultStartDate, fields } = args;
  const colorOptions = getColorOptions(fields);
  const defaultColor = colorOptions[0]?.id ?? '';

  if (event) {
    const selectedColorId =
      colorOptions.find((option) => option.color === event.color)?.id ??
      colorOptions.find((option) => option.label === event.colorLabel)?.id ??
      '';

    return {
      title: event.title,
      description: event.description ?? '',
      start: toDateTimeLocalInputValue(event.start),
      end: toDateTimeLocalInputValue(event.end),
      color: selectedColorId || defaultColor,
    };
  }

  const start = defaultStartDate ?? new Date();
  const end = new Date(start.getTime() + 30 * 60 * 1000);

  return {
    title: '',
    description: '',
    start: toDateTimeLocalInputValue(start),
    end: toDateTimeLocalInputValue(end),
    color: defaultColor,
  };
}

export function CalendarEventDialog({
  open,
  onOpenChange,
  mode,
  fields,
  event,
  defaultStartDate,
  isPending,
  onSubmit,
  onDeleteClick,
  onOpenRecord,
}: CalendarEventDialogProps): React.JSX.Element {
  const form = useAppForm({
    defaultValues: getInitialValues({ event, defaultStartDate, fields }),
    onSubmit: async ({ value }) => {
      const startDate = parseDateTimeLocalInputValue(value.start);
      const endDate = parseDateTimeLocalInputValue(value.end);
      if (!startDate || !endDate) return;
      if (endDate.getTime() <= startDate.getTime()) return;

      await onSubmit({
        title: value.title.trim(),
        description: value.description.trim(),
        start: startDate,
        end: endDate,
        colorOptionId: value.color || null,
      });
    },
  });

  const values = useStore(
    form.store,
    (state: any) => state.values,
  ) as CalendarEventFormValues;
  const colorOptions = getColorOptions(fields);
  const canSubmit =
    values.title.trim().length > 0 &&
    values.start.trim().length > 0 &&
    values.end.trim().length > 0 &&
    ((): boolean => {
      const start = parseDateTimeLocalInputValue(values.start);
      const end = parseDateTimeLocalInputValue(values.end);
      return Boolean(start && end && end.getTime() > start.getTime());
    })();

  React.useEffect(() => {
    if (!open) return;
    form.reset(getInitialValues({ event, defaultStartDate, fields }));
  }, [defaultStartDate, event?.rowId, fields.colorField?._id, open]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      modal={false}
    >
      <DialogContent className="sm:max-w-xl">
        <form
          onSubmit={(submitEvent) => {
            submitEvent.preventDefault();
            form.handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' ? 'Novo agendamento' : 'Editar agendamento'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'create'
                ? 'Crie um registro na agenda.'
                : 'Atualize os dados do registro na agenda selecionado.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <form.AppField name="title">
                  {(field: any) => (
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Título</label>
                      <Input
                        className="w-full"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="Ex: Reunião com equipe"
                        autoFocus
                      />
                    </div>
                  )}
                </form.AppField>
              </div>

              {fields.colorField && colorOptions.length > 0 && (
                <div>
                  <form.AppField name="color">
                    {(field: any) => (
                      <div>
                        <label className="text-sm font-medium">Cor</label>
                        <Select
                          value={
                            typeof field.state.value === 'string'
                              ? field.state.value
                              : ''
                          }
                          onValueChange={(value) => {
                            field.handleChange(value);
                            field.handleBlur();
                          }}
                        >
                          <SelectTrigger className="cursor-pointer">
                            <SelectValue placeholder="Selecione uma cor" />
                          </SelectTrigger>
                          <SelectContent>
                            {colorOptions.map((option) => (
                              <SelectItem
                                key={option.id}
                                value={option.id}
                              >
                                <span className="inline-flex items-center gap-2">
                                  <span
                                    className="size-2.5 rounded-full"
                                    style={{
                                      backgroundColor: option.color ?? '#999',
                                    }}
                                  />
                                  <span>{option.label}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </form.AppField>
                </div>
              )}
            </div>

            <form.AppField name="description">
              {(field: any) => (
                <div className="space-y-1">
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Detalhes do agendamento (opcional)"
                    className="min-h-[96px]"
                  />
                </div>
              )}
            </form.AppField>

            <div className="grid gap-3 sm:grid-cols-2">
              <form.AppField name="start">
                {(field: any) => (
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Início</label>
                    <Input
                      type="datetime-local"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                  </div>
                )}
              </form.AppField>

              <form.AppField name="end">
                {(field: any) => (
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Término</label>
                    <Input
                      type="datetime-local"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                  </div>
                )}
              </form.AppField>
            </div>

            {!canSubmit && (
              <p className="text-xs text-destructive">
                Preencha título, início e término (término deve ser maior que
                início).
              </p>
            )}
          </div>

          <DialogFooter className="mt-4 flex gap-2 sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {mode === 'edit' && event && onOpenRecord && (
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => onOpenRecord(event.row)}
                  disabled={isPending}
                >
                  Abrir registro
                </Button>
              )}
              {mode === 'edit' && onDeleteClick && (
                <Button
                  type="button"
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={onDeleteClick}
                  disabled={isPending}
                >
                  Excluir
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={!canSubmit || isPending}
              >
                {isPending && <Spinner />}
                <span>{mode === 'create' ? 'Criar' : 'Salvar'}</span>
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
