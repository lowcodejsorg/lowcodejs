import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  CircleCheckIcon,
  CircleIcon,
  Loader,
  LoaderIcon,
  Search,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

export type SearchableOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SearchableResponse = {
  items: SearchableOption[];
  nextPage: number | null;
  totalItems: number;
};

interface Props {
  placeholder?: string;
  selectedValues: SearchableOption[];
  onChange: (values: SearchableOption[]) => void;
  isMultiple?: boolean;
  maxDisplayItems?: number;
  fetchOptions: (query: string, page: number) => Promise<SearchableResponse>;
  className?: string;
  disabled?: boolean;
  identifier: string;
  prioritizeSelected?: boolean;
}

export function SearchableSelect({
  placeholder = "Selecionar opções",
  selectedValues = [],
  onChange,
  isMultiple = true,
  maxDisplayItems = 2,
  fetchOptions,
  className,
  disabled = false,
  identifier = "searchable-select",
  prioritizeSelected = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: [identifier, debouncedQuery],
    queryFn: ({ pageParam = 1 }) => fetchOptions(debouncedQuery, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const threshold = 50;

    if (
      scrollHeight - (scrollTop + clientHeight) < threshold &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  };

  const allOptions = data?.pages.flatMap((page) => page.items) || [];

  const getSelectedLabels = () => {
    const selected = selectedValues.map((value) => {
      const option = allOptions.find((opt) => opt.value === value.value);
      return option?.label || value?.label;
    });

    return selected;
  };

  const renderSelectedValues = () => {
    if (!selectedValues || selectedValues.length === 0) {
      return <span className="text-muted-foreground">{placeholder}</span>;
    }

    const selectedLabels = getSelectedLabels();
    const visibleValues = selectedLabels?.slice(0, maxDisplayItems) ?? [];
    const remainingCount = selectedLabels.length - maxDisplayItems;

    return (
      <div className="flex flex-wrap gap-1 max-w-full">
        {visibleValues?.map((label, index) => (
          <Badge key={index} variant="secondary" className="text-xs">
            {label}
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

  const handleSelection = (option: SearchableOption) => {
    if (isMultiple) {
      let updatedValues = [];
      const isSelected = selectedValues.some((o) => o.value === option.value);
      if (isSelected) {
        updatedValues = selectedValues.filter((o) => o.value !== option.value);
      } else {
        updatedValues = [...selectedValues, option];
      }

      onChange(updatedValues);
    } else {
      onChange([option]);
      setOpen(false);
    }
  };

  // Split options into selected and unselected when prioritizeSelected is true
  const renderOptions = () => {
    if (!prioritizeSelected) {
      // Regular rendering without prioritizing selected items
      return data?.pages.map((page, pageIndex) => (
        <React.Fragment key={pageIndex}>
          {page.items.map((option) => {
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
                  <CircleCheckIcon className="h-4 w-4 text-primary" />
                )}
                {!isSelected && (
                  <CircleIcon className="h-4 w-4 text-muted-foreground" />
                )}
                {option.label}
              </DropdownMenuItem>
            );
          })}
        </React.Fragment>
      ));
    }

    // When prioritizing selected items
    const selectedOptions: SearchableOption[] = [];
    const unselectedOptions: SearchableOption[] = [];

    // Extract and classify options from all pages
    data?.pages.forEach((page) => {
      page.items.forEach((option) => {
        const isSelected = selectedValues.some(
          (selected) => selected.value === option.value
        );
        if (isSelected) {
          selectedOptions.push(option);
        } else {
          unselectedOptions.push(option);
        }
      });
    });

    // Render selected options first
    return (
      <>
        {selectedOptions.length > 0 && (
          <>
            {selectedOptions.map((option) => {
              if (isMultiple) {
                return (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={true}
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
                  <CircleCheckIcon className="h-4 w-4 text-primary" />
                  {option.label}
                </DropdownMenuItem>
              );
            })}

            {unselectedOptions.length > 0 && <DropdownMenuSeparator />}
          </>
        )}

        {unselectedOptions.map((option) => {
          if (isMultiple) {
            return (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={false}
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
              <CircleIcon className="h-4 w-4 text-muted-foreground" />
              {option.label}
            </DropdownMenuItem>
          );
        })}
      </>
    );
  };

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
              "h-auto min-h-9 w-full justify-between py-2",
              !selectedValues?.length && "text-muted-foreground",
              className
            )}
            onClick={(e) => {
              e.preventDefault();
              setOpen(!open);
            }}
          >
            {renderSelectedValues()}
            <ChevronDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-full min-w-[240px] p-0"
          align="start"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="p-2">
            <div className="flex items-center border rounded-md px-3 py-1">
              <Search className="h-4 w-4 mr-2 opacity-50" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 p-0 h-8 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder={placeholder}
              />
            </div>
          </div>

          <div
            className="max-h-[300px] overflow-y-auto overflow-x-hidden scroll-smooth"
            onScroll={handleScroll}
          >
            {isLoading && !isFetchingNextPage && (
              <div className="flex justify-center p-4">
                <Loader className="h-6 w-6 animate-spin opacity-50" />
              </div>
            )}

            {isError && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Erro ao carregar dados. Tente novamente.
              </div>
            )}

            {!isLoading && data?.pages[0]?.items.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Nenhum resultado encontrado
              </div>
            )}

            {renderOptions()}

            {isFetchingNextPage && (
              <div className="flex justify-center p-2">
                <LoaderIcon className="h-4 w-4 animate-spin opacity-50" />
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
