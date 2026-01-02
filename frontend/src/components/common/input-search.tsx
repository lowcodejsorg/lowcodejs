/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useLocation, useNavigate } from '@tanstack/react-router';
import { HelpCircle, SearchIcon, XIcon } from 'lucide-react';
import React from 'react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function InputSearch(): React.JSX.Element {
  const search = useLocation().search as Record<string, string>;
  const navigate = useNavigate();

  const [inputValue, setInputValue] = React.useState(search.search || '');
  const hasSearchValue = search.search && search.search.length > 0;

  const performSearch = (): void => {
    if (inputValue.trim().length > 0) {
      navigate({
        // @ts-ignore
        search: (state) => ({
          ...state,
          search: inputValue.trim(),
        }),
      });
    }
  };

  const clearSearch = (): void => {
    setInputValue('');
    navigate({
      // @ts-ignore
      search: (state) => ({
        ...state,
        search: undefined,
      }),
    });
  };

  return (
    <div className="flex-1 w-full">
      <InputGroup>
        <InputGroupAddon>
          <Tooltip>
            <TooltipTrigger asChild>
              <InputGroupButton
                variant="ghost"
                aria-label="Ajuda"
                size="icon-xs"
              >
                <HelpCircle className="size-4" />
              </InputGroupButton>
            </TooltipTrigger>
            <TooltipContent>
              <p>Digite e clique na lupa para buscar</p>
            </TooltipContent>
          </Tooltip>
        </InputGroupAddon>

        <InputGroupInput
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              performSearch();
            }
          }}
          placeholder="Pesquise aqui..."
          className="shadow-none"
        />

        <InputGroupAddon align="inline-end">
          {hasSearchValue && (
            <InputGroupButton
              onClick={clearSearch}
              variant="ghost"
              size="icon-xs"
              aria-label="Limpar busca"
            >
              <XIcon className="size-4" />
            </InputGroupButton>
          )}

          {!hasSearchValue && (
            <InputGroupButton
              onClick={performSearch}
              variant="ghost"
              size="icon-xs"
              aria-label="Buscar"
            >
              <SearchIcon className="size-4" />
            </InputGroupButton>
          )}
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
