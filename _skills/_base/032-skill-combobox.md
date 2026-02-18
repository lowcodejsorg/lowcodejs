# Skill: Combobox (Async Search/Select)

O Combobox e o padrao para campos de selecao com busca assincrona. Combina `cmdk` (Command) + Radix `Popover` + `useInfiniteQuery` (ou `useQuery`) + debounce para criar um seletor pesquisavel e paginado. Existem 4 instancias no codebase (artisan, curator, village, category), cada uma com sua propria query e formato de exibicao. O padrao usa `shouldFilter={false}` no Command para delegar a filtragem ao backend, e um botao "Carregar mais" para paginacao incremental.

---

## Estrutura do Arquivo

```
frontend/
  src/
    components/
      common/
        artisan-combobox.tsx                     <-- Combobox com useInfiniteQuery + debounce
        curator-combobox.tsx                     <-- Combobox com useInfiniteQuery + debounce
        village-combobox.tsx                     <-- Combobox com useQuery (dados finitos)
        category-combobox.tsx                    <-- Combobox com useQuery (dados finitos)
      ui/
        command.tsx                              <-- Command Palette (cmdk)
        popover.tsx                              <-- Popover (Radix)
    hooks/
      use-debounced-value.ts                     <-- Hook de debounce
```

- Comboboxes com busca server-side usam `useInfiniteQuery` + debounce (artisan, curator).
- Comboboxes com dados finitos usam `useQuery` simples (village, category).

---

## Template: Combobox com useInfiniteQuery

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { API } from '@/lib/api';
import type { I{{Entity}}, Paginated } from '@/lib/entities';
import { cn } from '@/lib/utils';

interface {{Entity}}ComboboxProps {
  value?: string;
  onValueChange?: (value: string, label?: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  allowAll?: boolean;
}

const PER_PAGE = 10;

export function {{Entity}}Combobox({
  value = '',
  onValueChange,
  placeholder = 'Selecione um {{entity}}...',
  className,
  disabled = false,
  allowAll = false,
}: {{Entity}}ComboboxProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: ['/{{entities}}', { search: debouncedSearch }],
      queryFn: async ({ pageParam }): Promise<Paginated<I{{Entity}}>> => {
        const params: Record<string, string | number> = {
          page: pageParam,
          per_page: PER_PAGE,
        };
        if (debouncedSearch) params.search = debouncedSearch;
        const response = await API.get<Paginated<I{{Entity}}>>('/{{entities}}', { params });
        return response.data;
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage) => {
        if (lastPage.meta.page < lastPage.meta.last_page) return lastPage.meta.page + 1;
        return undefined;
      },
    });

  const items = data?.pages.flatMap((page) => page.data) ?? [];
  const selectedItem = items.find((item) => item.id === value);
  const selectedLabel = selectedItem?.name;

  const handleSelect = (itemId: string, itemName?: string): void => {
    if (itemId === value) {
      onValueChange?.('', undefined);
    } else {
      onValueChange?.(itemId, itemName);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
          disabled={disabled || status === 'pending'}
        >
          {value === 'ALL' && allowAll && 'Todos'}
          {value !== 'ALL' && selectedLabel && selectedLabel}
          {!value && placeholder}
          {value && value !== 'ALL' && !selectedLabel && placeholder}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Buscar..." className="h-9" value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            <CommandGroup>
              {allowAll && (
                <CommandItem value="ALL" onSelect={() => handleSelect('ALL', 'Todos')}>
                  <div className="flex flex-col"><span className="font-medium">Todos</span></div>
                  <Check className={cn('ml-auto', value === 'ALL' ? 'opacity-100' : 'opacity-0')} />
                </CommandItem>
              )}
              {items.map((item) => (
                <CommandItem key={item.id} value={item.id} onSelect={() => handleSelect(item.id, item.name)}>
                  <div className="flex flex-col">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-sm text-muted-foreground">{item.subtitle}</span>
                  </div>
                  <Check className={cn('ml-auto', value === item.id ? 'opacity-100' : 'opacity-0')} />
                </CommandItem>
              ))}
            </CommandGroup>
            {hasNextPage && (
              <div className="p-2 border-t">
                <Button variant="ghost" size="sm" className="w-full" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                  {isFetchingNextPage && <Spinner className="mr-2" />}
                  Carregar mais
                </Button>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

## Template: Combobox com useQuery (dados finitos)

```typescript
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { API } from '@/lib/api';
import type { I{{Entity}} } from '@/lib/entities';
import { cn } from '@/lib/utils';

export function {{Entity}}Combobox({ value = '', onValueChange, placeholder, className, disabled = false }: Props): React.JSX.Element {
  const [open, setOpen] = React.useState(false);

  const { data: items, status } = useQuery({
    queryKey: ['/{{entities}}'],
    queryFn: async () => {
      const response = await API.get<Array<I{{Entity}}>>('/{{entities}}');
      return response.data;
    },
  });

  const selectedItem = items?.find((item) => item.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open}
          className={cn('w-full justify-between', className)}
          disabled={disabled || status === 'pending'}>
          {selectedItem ? selectedItem.name : placeholder}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar..." className="h-9" />
          <CommandList>
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            <CommandGroup>
              {items?.map((item) => (
                <CommandItem key={item.id} value={item.name}
                  onSelect={() => {
                    if (item.id === value) onValueChange?.('');
                    else onValueChange?.(item.id);
                    setOpen(false);
                  }}>
                  <span className="font-medium">{item.name}</span>
                  <Check className={cn('ml-auto', value === item.id ? 'opacity-100' : 'opacity-0')} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

---

## Exemplo Real

```typescript
// components/common/artisan-combobox.tsx (trecho)
export function ArtisanCombobox({
  value = '', onValueChange, placeholder = 'Selecione um artesao...', className, disabled = false, allowAll = false,
}: ArtisanComboboxProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: ['/artisans', { search: debouncedSearch }],
      queryFn: async ({ pageParam }): Promise<Paginated<IArtisan>> => {
        const params: Record<string, string | number> = { page: pageParam, per_page: 10, approved: 'true' };
        if (debouncedSearch) params.search = debouncedSearch;
        const response = await API.get<Paginated<IArtisan>>('/artisans', { params });
        return response.data;
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage) => {
        if (lastPage.meta.page < lastPage.meta.last_page) return lastPage.meta.page + 1;
        return undefined;
      },
    });

  const artisans = data?.pages.flatMap((page) => page.data) ?? [];
  const selectedArtisan = artisans.find((a) => a.id === value);
  const selectedLabel = selectedArtisan?.user?.name;
  // ... resto do componente
}
```

**Leitura do exemplo:**

1. `useDebouncedValue(search, 300)` atrasa a busca em 300ms apos o usuario parar de digitar. Isso evita uma requisicao a cada tecla.
2. `shouldFilter={false}` (no Command) desativa a filtragem local do cmdk, delegando totalmente ao backend.
3. A `queryKey` inclui `debouncedSearch`, garantindo que cada termo de busca tenha seu proprio cache.
4. `handleSelect` implementa toggle: clicar no item selecionado deseleciona (`onValueChange?.('', undefined)`).
5. `modal={true}` no Popover garante que o combobox funcione corretamente dentro de Sheets e Dialogs.
6. A prop `allowAll` adiciona uma opcao "Todos" no topo da lista para filtros que aceitam "sem filtro".

---

## Hook de Debounce

```typescript
// hooks/use-debounced-value.ts
import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return (): void => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

---

## Regras e Convencoes

1. **`shouldFilter={false}` para busca server-side** -- quando o combobox usa `useInfiniteQuery`, desabilite a filtragem local do cmdk com `shouldFilter={false}`.

2. **Debounce de 300ms** -- toda busca com `useInfiniteQuery` deve usar `useDebouncedValue(search, 300)` para evitar requisicoes excessivas.

3. **`modal={true}` no Popover** -- sempre usar `modal={true}` quando o combobox pode ser renderizado dentro de um Sheet ou Dialog, para evitar problemas de foco.

4. **Toggle de selecao** -- clicar no item ja selecionado deve desselecionar. Implementar via `if (id === value) onValueChange?.('')`.

5. **Interface padrao de props** -- todos os comboboxes devem aceitar: `value`, `onValueChange`, `placeholder`, `className`, `disabled`. Comboboxes com busca paginada aceitam tambem `allowAll`.

6. **`CommandItem value` para dados finitos** -- em comboboxes com `useQuery` (sem `shouldFilter={false}`), o `CommandItem value` deve ser o texto pesquisavel (nome), nao o ID.

7. **Botao "Carregar mais"** -- comboboxes com `useInfiniteQuery` devem ter um botao no final da lista quando `hasNextPage` e true.

8. **Dados no `CommandItem`** -- cada item deve mostrar nome principal (`font-medium`) e subtitulo opcional (`text-muted-foreground`) em `flex flex-col`.

9. **Check icon para item selecionado** -- usar `<Check>` com `opacity-100/opacity-0` baseado na comparacao `value === item.id`.

10. **Um combobox por entidade** -- cada entidade (artisan, curator, village, category) tem seu proprio componente em `components/common/`.

---

## Checklist

- [ ] O componente esta em `components/common/[entity]-combobox.tsx`.
- [ ] Usa `Popover` + `Command` (cmdk) como base.
- [ ] Combobox com busca server-side usa `shouldFilter={false}` e `useInfiniteQuery`.
- [ ] Combobox com dados finitos usa `useQuery` sem `shouldFilter={false}`.
- [ ] Busca server-side usa `useDebouncedValue` com 300ms.
- [ ] Interface aceita `value`, `onValueChange`, `placeholder`, `className`, `disabled`.
- [ ] Toggle de selecao implementado (click em selecionado deseleciona).
- [ ] `modal={true}` no Popover para compatibilidade com Sheet/Dialog.
- [ ] `<Check>` com `opacity-100/opacity-0` indica item selecionado.
- [ ] Botao "Carregar mais" presente quando `hasNextPage` (infinite query).
- [ ] Botao trigger mostra `ChevronsUpDown` e fica disabled durante loading.

---

## Erros Comuns

| Erro | Causa | Correcao |
|------|-------|----------|
| Busca nao funciona (filtro local) | `shouldFilter` nao esta `false` | Adicionar `shouldFilter={false}` no `Command` |
| Requisicao a cada tecla | Faltou debounce | Usar `useDebouncedValue(search, 300)` |
| Combobox nao abre dentro de Sheet | Faltou `modal={true}` no Popover | Adicionar `modal={true}` |
| Item selecionado nao aparece no trigger | `selectedLabel` nao encontrado no array | O item pode nao estar na pagina carregada; carregar mais paginas ou buscar por ID |
| Filtragem client-side em dados server-side | Esqueceu de desabilitar `shouldFilter` | Verificar `shouldFilter={false}` quando usa `useInfiniteQuery` |
| Opcao "Todos" nao aparece | Faltou `allowAll={true}` na prop | Passar `allowAll={true}` no uso do componente |

---

**Cross-references:** ver [020-skill-formulario.md](./020-skill-formulario.md), [021-skill-form-field.md](./021-skill-form-field.md), [017-skill-hook-query.md](./017-skill-hook-query.md).
