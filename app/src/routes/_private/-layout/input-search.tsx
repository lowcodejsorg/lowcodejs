/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/hooks/i18.hook";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { SearchIcon, XIcon } from "lucide-react";
import { useState } from "react";

export function InputSearch() {
  const { t } = useI18n();
  const search = useLocation().search as Record<string, string>;
  const navigate = useNavigate();

  const [inputValue, setInputValue] = useState(
    (search?.search as string) ?? ""
  );
  const hasSearchValue = search?.search && (search.search as string).length > 0;

  const performSearch = () => {
    if ((inputValue as string).trim().length > 0) {
      navigate({
        // @ts-ignore
        search: (state) => ({
          ...state,
          search: (inputValue as string).trim(),
        }),
      });
    }
  };

  const clearSearch = () => {
    setInputValue("");
    navigate({
      // @ts-ignore
      search: (state) => ({
        ...state,
        search: undefined,
      }),
    });
  };

  return (
    <div className="flex-1 inline-flex items-center relative h-8 w-full gap-4">
      <Input
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            performSearch();
          }
        }}
        placeholder={t("INPUT_SEARCH_PLACEHOLDER", "Pesquisar...") as string}
        className="h-full shadow-none rounded-sm w-full"
      />

      {hasSearchValue && (
        <Button
          onClick={clearSearch}
          variant="outline"
          className="absolute right-0 h-8 rounded-l-none max-w-[100px] w-full cursor-pointer"
        >
          <XIcon
            className="size-4 cursor-pointer hover:text-foreground"
            strokeWidth={1.5}
          />
        </Button>
      )}

      {!hasSearchValue && (
        <Button
          variant="outline"
          onClick={performSearch}
          className="absolute right-0 h-8 rounded-l-none max-w-[100px] w-full cursor-pointer"
        >
          <SearchIcon
            className="size-4 cursor-pointer hover:text-foreground"
            strokeWidth={1.5}
          />
        </Button>
      )}
    </div>
  );
}
