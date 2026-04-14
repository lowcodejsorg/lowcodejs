---
name: maiyu:frontend-filter
description: |
  Generates URL-based filter systems for frontend data listing pages.
  Use when: user asks to create filters, filter sidebar, search filters,
  data filtering, or mentions "filter" for narrowing data in lists/tables.
  Supports: Text, dropdown, date range, category filters with URL state.
  Frameworks: TanStack Start, React (Vite), Next.js, Next.js App Router, Remix.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **Router**: `@tanstack/react-router` | `next` | `@remix-run/react`
   - **UI**: `@radix-ui/*` (for Sheet, Popover, Select)
3. Scan existing filter components to detect:
   - Filter location (`components/common/filter-*.tsx`)
   - URL-based state management pattern
   - Filter field type definitions
4. If no filter system exists, generate from scratch

## Conventions

### Naming
- Filter sidebar: `filter-sidebar.tsx`
- Filter form: `filter-fields.tsx`
- Mobile sheet: `sheet-filter.tsx`
- Filter trigger: `filter-trigger.tsx`
- Hook: `useFilterState()` inside filter component

### Rules
- Filter state lives in URL search params (not local state)
- Removing a filter clears the search param
- Active filter count shown on trigger button
- Sidebar toggle persisted in localStorage
- Filter types determined by field type
- No ternary operators — use `{condition && <el>}`, if/else, early return, or const mapper
- No `any` type — use concrete types, `unknown`, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- Explicit return types on all functions and components
- Multiple conditions use const mapper (`Record` lookup) instead of switch/if-else chains

## Filter Types

| Field Type | Filter Component | Behavior |
|------------|-----------------|----------|
| TEXT_SHORT / TEXT_LONG | InputGroup with clear button | Debounced text search |
| DROPDOWN (single) | Select component | Exact match |
| DROPDOWN (multiple) | Combobox with multi-select | Any match |
| DATE | Date range picker (start + end) | Between start/end |
| CATEGORY | Tree list in Popover | Hierarchical select |
| RELATIONSHIP | Async combobox (search related entity) | Match by related ID |
| USER | User selector combobox | Match by user ID |
| BOOLEAN | Toggle/switch | true/false/all |

## Templates

### useFilterState Hook (Reference Implementation)

```typescript
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useCallback, useMemo } from 'react';

interface FilterField {
  slug: string;
  name: string;
  type: string;
  multiple?: boolean;
  options?: Array<{ label: string; value: string }>;
}

interface UseFilterStateOptions {
  routeId: string;
  fields: Array<FilterField>;
}

interface UseFilterStateReturn {
  search: Record<string, unknown>;
  setFilter: (key: string, value: string | undefined) => void;
  clearFilter: (key: string) => void;
  clearAll: () => void;
  activeCount: number;
}

export function useFilterState({ routeId, fields }: UseFilterStateOptions): UseFilterStateReturn {
  const search = useSearch({ from: routeId });
  const navigate = useNavigate();

  const setFilter = useCallback(
    (key: string, value: string | undefined) => {
      navigate({
        search: (prev: Record<string, unknown>) => {
          const next = { ...prev, page: 1 };
          if (value === undefined || value === '') {
            delete next[key];
          } else {
            next[key] = value;
          }
          return next;
        },
      });
    },
    [navigate],
  );

  const clearFilter = useCallback(
    (key: string) => {
      setFilter(key, undefined);
    },
    [setFilter],
  );

  const clearAll = useCallback(() => {
    navigate({
      search: (prev: Record<string, unknown>) => ({
        page: 1,
        perPage: prev.perPage,
      }),
    });
  }, [navigate]);

  const activeCount = useMemo(() => {
    let count = 0;
    for (const field of fields) {
      const value = search[field.slug as keyof typeof search];
      if (value !== undefined && value !== '') {
        count += 1;
      }
    }
    return count;
  }, [search, fields]);

  return { search, setFilter, clearFilter, clearAll, activeCount };
}
```

### Filter Sidebar Component

```tsx
import { useState } from 'react';
import { FilterIcon, XIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FilterSidebarProps {
  children: React.ReactNode;
  activeCount: number;
  storageKey?: string;
}

export function FilterSidebar({
  children,
  activeCount,
  storageKey = 'filter-sidebar-open',
}: FilterSidebarProps): React.JSX.Element {
  const [open, setOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(storageKey) === 'true';
  });

  function toggleOpen(): void {
    const next = !open;
    setOpen(next);
    localStorage.setItem(storageKey, String(next));
  }

  return (
    <div className="flex h-full">
      {open && (
        <aside className="w-64 shrink-0 border-r overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FilterIcon className="size-4" />
              <span className="text-sm font-medium">Filters</span>
              {activeCount > 0 && (
                <Badge variant="secondary">{activeCount}</Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleOpen}
            >
              <XIcon className="size-4" />
            </Button>
          </div>
          {children}
        </aside>
      )}
      {!open && (
        <Button
          variant="ghost"
          size="sm"
          className="m-2"
          onClick={toggleOpen}
        >
          <FilterIcon className="size-4 mr-1" />
          Filters
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeCount}
            </Badge>
          )}
        </Button>
      )}
    </div>
  );
}
```

### Filter Fields Form

```tsx
import { E_FIELD_TYPE } from '@/lib/constant';
import { Field, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { Select } from '@/components/ui/select';

interface FilterFieldsFormProps {
  fields: Array<FilterField>;
  search: Record<string, unknown>;
  onFilterChange: (key: string, value: string | undefined) => void;
}

export function FilterFieldsForm({
  fields,
  search,
  onFilterChange,
}: FilterFieldsFormProps): React.JSX.Element {
  return (
    <div className="space-y-4">
      {fields.map((field) => {
        const rawValue = search[field.slug];
        let fieldValue: string | undefined;
        if (typeof rawValue === 'string') {
          fieldValue = rawValue;
        }
        return (
          <FilterFieldRenderer
            key={field.slug}
            field={field}
            value={fieldValue}
            onChange={(value) => onFilterChange(field.slug, value)}
          />
        );
      })}
    </div>
  );
}

function FilterFieldRenderer({
  field,
  value,
  onChange,
}: {
  field: FilterField;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}): React.JSX.Element {
  switch (field.type) {
    case E_FIELD_TYPE.TEXT_SHORT:
    case E_FIELD_TYPE.TEXT_LONG:
      return (
        <Field>
          <FieldLabel>{field.name}</FieldLabel>
          <InputGroup>
            <InputGroupInput
              value={value ?? ''}
              onChange={(e) => onChange(e.target.value || undefined)}
              placeholder={`Filter by ${field.name}`}
            />
          </InputGroup>
        </Field>
      );

    case E_FIELD_TYPE.DROPDOWN:
      return (
        <Field>
          <FieldLabel>{field.name}</FieldLabel>
          <Select
            value={value ?? ''}
            onValueChange={(v) => onChange(v || undefined)}
          >
            <option value="">All</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </Field>
      );

    case E_FIELD_TYPE.DATE:
      return (
        <Field>
          <FieldLabel>{field.name}</FieldLabel>
          <InputGroup>
            <InputGroupInput
              type="date"
              value={value ?? ''}
              onChange={(e) => onChange(e.target.value || undefined)}
            />
          </InputGroup>
        </Field>
      );

    default:
      return (
        <Field>
          <FieldLabel>{field.name}</FieldLabel>
          <InputGroup>
            <InputGroupInput
              value={value ?? ''}
              onChange={(e) => onChange(e.target.value || undefined)}
            />
          </InputGroup>
        </Field>
      );
  }
}
```

### Filter Trigger Button

```tsx
import { FilterIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FilterTriggerProps {
  activeCount: number;
  onClick: () => void;
}

export function FilterTrigger({
  activeCount,
  onClick,
}: FilterTriggerProps): React.JSX.Element {
  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      <FilterIcon className="size-4 mr-1" />
      Filters
      {activeCount > 0 && (
        <Badge variant="secondary" className="ml-1">
          {activeCount}
        </Badge>
      )}
    </Button>
  );
}
```

### Usage in List Page

```tsx
function EntityListPage(): React.JSX.Element {
  const filterFields: Array<FilterField> = [
    { slug: 'name', name: 'Name', type: E_FIELD_TYPE.TEXT_SHORT },
    { slug: 'status', name: 'Status', type: E_FIELD_TYPE.DROPDOWN, options: statusOptions },
    { slug: 'created-at', name: 'Created', type: E_FIELD_TYPE.DATE },
  ];

  const { search, setFilter, clearAll, activeCount } = useFilterState({
    routeId: ROUTE_ID,
    fields: filterFields,
  });

  return (
    <div className="flex h-full">
      <FilterSidebar activeCount={activeCount}>
        <FilterFieldsForm
          fields={filterFields}
          search={search}
          onFilterChange={setFilter}
        />
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Clear all
          </Button>
        )}
      </FilterSidebar>
      <main className="flex-1 overflow-auto">
        {/* Table content */}
      </main>
    </div>
  );
}
```

### Date Range Filter

```tsx
import { Field, FieldLabel } from '@/components/ui/field';
import { Button } from '@/components/ui/button';

interface DateRangeFilterProps {
  label: string;
  startValue: string | undefined;
  endValue: string | undefined;
  onStartChange: (value: string | undefined) => void;
  onEndChange: (value: string | undefined) => void;
}

const DATE_PRESETS = [
  { label: 'Today', getDates: () => { const d = new Date().toISOString().split('T')[0]; return { start: d, end: d }; } },
  { label: 'This week', getDates: () => {
    const now = new Date();
    const start = new Date(now); start.setDate(now.getDate() - now.getDay());
    return { start: start.toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
  }},
  { label: 'This month', getDates: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: start.toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
  }},
  { label: 'Last 30 days', getDates: () => {
    const now = new Date();
    const start = new Date(now); start.setDate(now.getDate() - 30);
    return { start: start.toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
  }},
];

export function DateRangeFilter({
  label,
  startValue,
  endValue,
  onStartChange,
  onEndChange,
}: DateRangeFilterProps): React.JSX.Element {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="date"
            value={startValue ?? ''}
            onChange={(e) => onStartChange(e.target.value || undefined)}
            className="flex h-9 w-full rounded-md border bg-transparent px-2 text-sm"
            placeholder="Start"
          />
          <input
            type="date"
            value={endValue ?? ''}
            onChange={(e) => onEndChange(e.target.value || undefined)}
            className="flex h-9 w-full rounded-md border bg-transparent px-2 text-sm"
            placeholder="End"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {DATE_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              className="h-6 text-xs"
              onClick={() => {
                const { start, end } = preset.getDates();
                onStartChange(start);
                onEndChange(end);
              }}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>
    </Field>
  );
}
```

### Relationship/Reference Filter

```tsx
import { useState, useEffect } from 'react';
import { Field, FieldLabel } from '@/components/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReferenceFilterProps {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  searchFn: (query: string) => Promise<Array<{ id: string; label: string }>>;
}

export function ReferenceFilter({
  label,
  value,
  onChange,
  searchFn,
}: ReferenceFilterProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedLabel, setSelectedLabel] = useState('');

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const data = await searchFn(query);
      setResults(data);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, searchFn]);

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between text-sm font-normal"
          >
            {value && (selectedLabel || value)}
            {!value && `Select ${label}...`}
            <div className="flex items-center gap-1">
              {value && (
                <X
                  className="h-3 w-3 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(undefined);
                    setSelectedLabel('');
                  }}
                />
              )}
              <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-2" align="start">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="mb-2"
          />
          <div className="max-h-48 overflow-y-auto">
            {results.length === 0 && query && (
              <p className="text-center text-sm text-muted-foreground py-2">
                No results
              </p>
            )}
            {results.map((item) => (
              <button
                key={item.id}
                className={cn(
                  'flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted',
                  value === item.id && 'bg-muted',
                )}
                onClick={() => {
                  onChange(item.id);
                  setSelectedLabel(item.label);
                  setOpen(false);
                }}
              >
                {value === item.id && <Check className="h-3 w-3" />}
                {value !== item.id && <span className="w-3" />}
                {item.label}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </Field>
  );
}
```

### Boolean/Toggle Filter

```tsx
import { Field, FieldLabel } from '@/components/ui/field';

interface BooleanFilterProps {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

export function BooleanFilter({
  label,
  value,
  onChange,
}: BooleanFilterProps): React.JSX.Element {
  const options = [
    { label: 'All', value: undefined },
    { label: 'Yes', value: 'true' },
    { label: 'No', value: 'false' },
  ];

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex rounded-md border">
        {options.map((opt) => (
          <button
            key={opt.label}
            className={cn(
              'flex-1 px-3 py-1.5 text-xs font-medium transition-colors',
              'first:rounded-l-md last:rounded-r-md',
              value === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted',
            )}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </Field>
  );
}
```

### Global Search (Server-Side)

```tsx
import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface GlobalSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function GlobalSearch({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 400,
}: GlobalSearchProps): React.JSX.Element {
  const [draft, setDraft] = useState(value);

  // Sync external value → draft
  useEffect(() => {
    setDraft(value);
  }, [value]);

  // Debounce draft → onChange
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (draft !== value) {
        onChange(draft);
      }
    }, debounceMs);
    return () => clearTimeout(timeout);
  }, [draft, debounceMs, onChange, value]);

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        className="pl-8 pr-8"
      />
      {draft && (
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => {
            setDraft('');
            onChange('');
          }}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
```

### Active Filters Bar

```tsx
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActiveFilter {
  key: string;
  label: string;
  value: string;
}

interface ActiveFiltersBarProps {
  filters: Array<ActiveFilter>;
  onRemove: (key: string) => void;
  onClearAll: () => void;
}

export function ActiveFiltersBar({
  filters,
  onRemove,
  onClearAll,
}: ActiveFiltersBarProps): React.JSX.Element | null {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b">
      <span className="text-xs text-muted-foreground">Filters:</span>
      {filters.map((filter) => (
        <span
          key={filter.key}
          className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs"
        >
          <span className="font-medium">{filter.label}:</span>
          <span>{filter.value}</span>
          <button
            className="ml-0.5 hover:text-destructive"
            onClick={() => onRemove(filter.key)}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 text-xs"
        onClick={onClearAll}
      >
        Clear all
      </Button>
    </div>
  );
}
```

### Next.js App Router Filters (useSearchParams)

```tsx
'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

export function useFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === null) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      params.set('page', '1')
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams],
  )

  const clearFilters = useCallback(() => {
    router.push(pathname)
  }, [router, pathname])

  return {
    filters: Object.fromEntries(searchParams.entries()),
    setFilter,
    clearFilters,
  }
}
```

## Checklist

- [ ] Filter state in URL search params
- [ ] useFilterState hook with set/clear/count
- [ ] FilterSidebar with localStorage persistence
- [ ] Field-type-based filter rendering (switch-case)
- [ ] Active filter count badge
- [ ] Clear all filters button
- [ ] Date range filter with start/end pickers + preset ranges
- [ ] Relationship/reference filter with async combobox search
- [ ] Boolean/toggle filter with 3-state (All/Yes/No)
- [ ] Global search with debounced server-side query
- [ ] Active filters bar with removable chips
- [ ] No ternary operators
