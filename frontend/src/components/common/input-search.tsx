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

  const handleChange = (value: string): void => {
    setInputValue(value);
    if (value.trim().length === 0 && search.search) {
      navigate({
        // @ts-ignore
        search: (state) => ({
          ...state,
          search: undefined,
          page: 1,
        }),
      });
    }
  };

  const hasSearchValue = inputValue.length > 0;

  const performSearch = (): void => {
    if (inputValue.trim().length > 0) {
      navigate({
        // @ts-ignore
        search: (state) => ({
          ...state,
          search: inputValue.trim(),
          page: 1,
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
        page: 1,
      }),
    });
  };

  return (
    <div
      data-slot="input-search"
      className="flex-1 w-full"
    >
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
          data-test-id="search-input"
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
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
              data-test-id="search-clear-btn"
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
              data-test-id="search-submit-btn"
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
