---
name: frontend-filter
description: |
  Generates URL-based filter systems for frontend data listing pages.
  Use when: user asks to create filters, filter sidebar, search filters,
  data filtering, or mentions "filter" for narrowing data in lists/tables.
  Supports: Text, dropdown, date range, category filters with URL state.
  Frameworks: TanStack Start, React (Vite), Next.js, Remix.
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
- No ternary operators

## Filter Types

| Field Type | Filter Component | Behavior |
|------------|-----------------|----------|
| TEXT_SHORT / TEXT_LONG | InputGroup with clear button | Debounced text search |
| DROPDOWN (single) | Select component | Exact match |
| DROPDOWN (multiple) | Combobox with multi-select | Any match |
| DATE | Date range picker | Between start/end |
| CATEGORY | Tree list in Popover | Hierarchical select |

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

export function useFilterState({ routeId, fields }: UseFilterStateOptions) {
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
      {fields.map((field) => (
        <FilterFieldRenderer
          key={field.slug}
          field={field}
          value={search[field.slug] as string | undefined}
          onChange={(value) => onFilterChange(field.slug, value)}
        />
      ))}
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

## Checklist

- [ ] Filter state in URL search params
- [ ] useFilterState hook with set/clear/count
- [ ] FilterSidebar with localStorage persistence
- [ ] Field-type-based filter rendering (switch-case)
- [ ] Active filter count badge
- [ ] Clear all filters button
- [ ] No ternary operators
