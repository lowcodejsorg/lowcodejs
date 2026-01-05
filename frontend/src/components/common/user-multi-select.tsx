import { Check, ChevronsUpDown } from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useUserReadPaginated } from '@/hooks/tanstack-query/use-user-read-paginated';
import { cn } from '@/lib/utils';

interface UserMultiSelectProps {
  value?: Array<string>;
  onValueChange?: (value: Array<string>) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  excludeUserId?: string;
}

export function UserMultiSelect({
  value = [],
  onValueChange,
  placeholder = 'Selecione administradores...',
  className,
  disabled = false,
  excludeUserId,
}: UserMultiSelectProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const { data: usersData, status } = useUserReadPaginated({
    page: 1,
    perPage: 50,
    search: search || undefined,
  });

  // Filtrar apenas usuários ativos e excluir o owner
  const users = React.useMemo(() => {
    if (!usersData?.data) return [];
    return usersData.data.filter(
      (user) => user.status === 'active' && user._id !== excludeUserId,
    );
  }, [usersData?.data, excludeUserId]);

  const selectedUsers = users.filter((user) => value.includes(user._id));

  const handleSelect = (userId: string) => {
    const newValue = value.includes(userId)
      ? value.filter((id) => id !== userId)
      : [...value, userId];

    onValueChange?.(newValue);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between min-h-10 h-auto', className)}
          disabled={disabled || status === 'pending'}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedUsers.length > 0 ? (
              selectedUsers.map((user) => (
                <Badge key={user._id} variant="secondary">
                  {user.name}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="opacity-50 ml-2 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar usuário..."
            className="h-9"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
            <CommandGroup>
              {users.map((user) => (
                <CommandItem
                  key={user._id}
                  value={`${user.name} ${user.email}`}
                  onSelect={() => handleSelect(user._id)}
                >
                  <div className="flex flex-col flex-1">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                  <Check
                    className={cn(
                      'ml-auto',
                      value.includes(user._id) ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
