import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useI18n } from "@/hooks/i18.hook";
import type { Field } from "@/lib/entity";
import { cn } from "@/lib/utils";
import { format, isValid, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, XIcon } from "lucide-react";
import React from "react";
import { useFormContext } from "react-hook-form";

interface Props {
  field: Field;
  defaultValue?: Date;
  required?: boolean;
  name?: string;
}

export function RowTableDate({
  field: fieldProp,
  required,
  defaultValue,
  name,
}: Props) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const form = useFormContext();
  const [inputValue, setInputValue] = React.useState(() => {
    // Inicializa com o defaultValue formatado se existir
    return defaultValue
      ? format(defaultValue, fieldProp.configuration.format!, { locale: ptBR })
      : "";
  });

  // Initialize form field with defaultValue if not already set
  React.useEffect(() => {
    const fieldName = name ?? fieldProp.slug;
    const currentValue = form.getValues(fieldName);

    if (defaultValue) {
      // Se tem defaultValue mas não tem valor atual, define o valor
      if (!currentValue) {
        form.setValue(fieldName, defaultValue);
      }
      // Sempre atualiza o inputValue se temos defaultValue e o input está vazio
      if (!inputValue) {
        const formattedValue = format(
          defaultValue,
          fieldProp.configuration.format!,
          { locale: ptBR }
        );
        setInputValue(formattedValue);
      }
    }
  }, [
    defaultValue,
    form,
    name,
    fieldProp.slug,
    fieldProp.configuration.format,
    inputValue,
  ]);

  function formatDate(date: Date | undefined) {
    if (!date) return "";
    return format(date, fieldProp.configuration.format!, { locale: ptBR });
  }

  function createMask(format: string) {
    return format.replace(/[YyMmDd]/g, "9").replace(/[A-Za-z]/g, "9");
  }

  function applyMask(value: string, mask: string) {
    let result = "";
    let valueIndex = 0;

    for (let i = 0; i < mask.length && valueIndex < value.length; i++) {
      if (mask[i] === "9") {
        if (/\d/.test(value[valueIndex])) {
          result += value[valueIndex];
          valueIndex++;
        } else {
          break;
        }
      } else {
        result += mask[i];
      }
    }

    return result;
  }

  function isValidDateFormat(value: string, format: string) {
    if (!value) return false;
    try {
      const parsedDate = parse(value, format, new Date());
      return isValid(parsedDate) && format.length === value.length;
    } catch {
      return false;
    }
  }

  function clear(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const fieldName = name ?? fieldProp.slug;
    form.setValue(fieldName, null);
    setInputValue("");
    // Trigger validation após limpar
    form.trigger(fieldName);
  }

  return (
    <FormField
      control={form.control}
      name={name ?? fieldProp.slug}
      defaultValue={defaultValue}
      rules={{
        validate: (value) => {
          // Se não tem valor
          if (!value) {
            if (required) {
              return fieldProp.name.concat(" ").concat("é obrigatório");
            }
            return true;
          }

          // Converte string ISO para Date se necessário
          let dateValue = value;
          if (typeof value === "string") {
            dateValue = new Date(value);
          }

          // Verifica se é uma data válida
          if (!isValid(dateValue)) {
            return fieldProp.name
              .concat(" ")
              .concat("deve seguir o formato ")
              .concat(String(fieldProp.configuration.format).toUpperCase());
          }

          return true;
        },
      }}
      render={({ field: f }) => {
        const hasError = !!form.formState.errors[f.name];
        return (
          <FormItem className="flex flex-col w-full">
            <FormLabel className="data-[error=true]:text-destructive">
              {fieldProp.name}{" "}
              {required && <span className="text-destructive">*</span>}
            </FormLabel>
            <div className="relative flex gap-2 w-full">
              <FormControl>
                <Input
                  value={inputValue}
                  placeholder={
                    t(
                      "TABLE_ROUTE_SHEET_INTERNAL_REGISTER_SELECT_DATE_PLACEHOLDER",
                      t("TABLE_SELECT_DATE_PLACEHOLDER", "Select a date")
                    ) as string
                  }
                  className={cn(
                    "bg-background pr-10 w-full",
                    hasError && "dark:border-destructive border-destructive"
                  )}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/\D/g, "");
                    const mask = createMask(fieldProp.configuration.format!);
                    const maskedValue = applyMask(rawValue, mask);
                    setInputValue(maskedValue);

                    // Se o valor está vazio, define como null e valida
                    if (!maskedValue || maskedValue.length === 0) {
                      f.onChange(null);
                      // Valida imediatamente para mostrar erro se campo obrigatório
                      if (required) {
                        form.trigger(f.name);
                      }
                      return;
                    }

                    // Só tenta criar a data se o formato estiver completo
                    if (
                      isValidDateFormat(
                        maskedValue,
                        fieldProp.configuration.format!
                      )
                    ) {
                      const date = parse(
                        maskedValue,
                        fieldProp.configuration.format!,
                        new Date()
                      );
                      if (isValid(date)) {
                        f.onChange(date);
                        // Limpa erro se data válida
                        form.clearErrors(f.name);
                      } else {
                        f.onChange(null);
                      }
                    } else {
                      f.onChange(null);
                    }

                    // Trigger validation em tempo real se o campo foi preenchido completamente
                    if (
                      maskedValue.length ===
                      fieldProp.configuration.format!.length
                    ) {
                      form.trigger(f.name);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setOpen(true);
                    }
                  }}
                />
              </FormControl>
              {f.value && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clear}
                  className="absolute top-1/2 right-8 size-6 -translate-y-1/2 hover:bg-transparent"
                >
                  <XIcon className="h-4 w-4 opacity-50 hover:opacity-100" />
                </Button>
              )}
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                  >
                    <CalendarIcon className="size-3.5" />
                    <span className="sr-only">Select or insert date</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto overflow-hidden p-0"
                  align="end"
                  alignOffset={-8}
                  sideOffset={10}
                >
                  <Calendar
                    mode="single"
                    selected={f.value}
                    onSelect={(date) => {
                      f.onChange(date);
                      setInputValue(formatDate(date));
                      if (date) {
                        setOpen(false);
                        // Limpa erro quando seleciona data válida do calendário
                        form.clearErrors(f.name);
                      } else if (required) {
                        // Valida se campo obrigatório e limpou a data
                        form.trigger(f.name);
                      }
                    }}
                    disabled={(date) => date < new Date("1800-01-01")}
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <FormMessage className="text-right text-destructive" />
          </FormItem>
        );
      }}
    />
  );
}
