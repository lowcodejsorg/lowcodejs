import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronDown, CircleCheckIcon, CircleIcon } from "lucide-react";
import { useRef, useState } from "react";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
};

interface SimpleSelectProps {
  placeholder?: string;
  selectedValues: SelectOption[];
  onChange: (values: SelectOption[]) => void;
  options: SelectOption[];
  isMultiple?: boolean;
  maxDisplayItems?: number;
  className?: string;
  disabled?: boolean;
}

export function SimpleSelect({
  placeholder = "Selecionar opções",
  selectedValues = [],
  onChange,
  options = [],
  isMultiple = false,
  maxDisplayItems = 2,
  className,
  disabled = false,
}: SimpleSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const renderSelectedValues = () => {
    if (!selectedValues || selectedValues.length === 0) {
      return <span className="text-muted-foreground">{placeholder}</span>;
    }

    const visibleValues = (selectedValues ?? []).slice(0, maxDisplayItems);
    const remainingCount = selectedValues.length - maxDisplayItems;

    return (
      <div className="flex flex-wrap gap-1 max-w-full">
        {visibleValues?.map((option, index) => (
          <Badge key={index} variant="secondary" className="text-xs">
            {option.label}
          </Badge>
        ))}
        {remainingCount > 0 && (
          <Badge variant="outline" className="text-xs">
            +{remainingCount}
          </Badge>
        )}
      </div>
    );
  };

  const handleSelection = (option: SelectOption) => {
    if (isMultiple) {
      let updatedValues = [];
      const isSelected = selectedValues.some((o) => o.value === option.value);
      if (isSelected) {
        updatedValues = selectedValues?.filter((o) => o.value !== option.value);
      } else {
        updatedValues = [...selectedValues, option];
      }

      onChange(updatedValues);
    } else {
      onChange([option]);
      setOpen(false);
    }
  };

  // Agrupa as opções por chave de grupo
  const groupedOptions = options.reduce<Record<string, SelectOption[]>>(
    (groups, option) => {
      const group = option.group || ""; // Usa string vazia para opções sem grupo
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(option);
      return groups;
    },
    {}
  );

  // Obtém os grupos ordenados (opções sem grupo primeiro)
  const groupKeys = Object.keys(groupedOptions).sort((a, b) => {
    if (a === "") return -1;
    if (b === "") return 1;
    return a.localeCompare(b);
  });

  return (
    <div
      ref={containerRef}
      // className={className}
    >
      <DropdownMenu onOpenChange={setOpen} open={open}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            disabled={disabled}
            className={cn(
              "h-auto min-h-9 w-full justify-between py-2 transition-all duration-200",
              !selectedValues?.length && "text-muted-foreground",
              className
            )}
            onClick={(e) => {
              e.preventDefault();
              setOpen(!open);
            }}
          >
            {renderSelectedValues()}
            <ChevronDown
              className={cn(
                "ml-2 size-4 opacity-50 shrink-0 transition-transform duration-200",
                open && "rotate-180"
              )}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-full min-w-[240px] p-0"
          align="start"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="max-h-[300px] overflow-y-auto overflow-x-hidden scroll-smooth">
            {options.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Nenhuma opção disponível
              </div>
            )}

            {/* Renderização agrupada das opções */}
            {groupKeys.map((groupKey, groupIndex) => (
              <div key={groupKey || `group-${groupIndex}`}>
                {/* Exibe o cabeçalho do grupo apenas se houver um nome de grupo */}
                {groupKey !== "" && (
                  <>
                    <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      {groupKey}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* Renderiza as opções do grupo atual */}
                {groupedOptions[groupKey].map((option) => {
                  const isSelected = selectedValues.some(
                    (selected) => selected.value === option.value
                  );

                  if (isMultiple) {
                    return (
                      <DropdownMenuCheckboxItem
                        key={option.value}
                        checked={isSelected}
                        disabled={option.disabled}
                        onCheckedChange={() => handleSelection(option)}
                      >
                        {option.label}
                      </DropdownMenuCheckboxItem>
                    );
                  }

                  return (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => handleSelection(option)}
                      className="flex items-center gap-2"
                      disabled={option.disabled}
                    >
                      {isSelected && (
                        <CircleCheckIcon className="size-4 text-primary" />
                      )}
                      {!isSelected && (
                        <CircleIcon className="size-4 text-muted-foreground" />
                      )}
                      {option.label}
                    </DropdownMenuItem>
                  );
                })}

                {/* Adiciona um separador após cada grupo (exceto o último) */}
                {groupIndex < groupKeys.length - 1 && <DropdownMenuSeparator />}
              </div>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
