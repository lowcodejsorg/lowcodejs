import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown } from 'lucide-react';
import * as React from 'react';

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
import { API } from '@/lib/api';
import { IGroup } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

interface GroupComboboxProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function GroupCombobox({
  value = '',
  onValueChange,
  placeholder = 'Selecione uma grupo...',
  className,
  disabled = false,
}: GroupComboboxProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);

  const { data: groups, status } = useQuery({
    queryKey: ['/user-group'],
    queryFn: async function () {
      const route = '/user-group';
      const response = await API.get<Array<IGroup>>(route);
      return response.data;
    },
  });

  const selectedGroup = groups?.find((group) => group._id === value);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
          disabled={disabled || status === 'pending'}
        >
          {selectedGroup && `${selectedGroup.name}`}
          {!selectedGroup && placeholder}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Buscar grupo..."
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>Nenhum grupo encontrada.</CommandEmpty>
            <CommandGroup>
              {groups?.map((group) => (
                <CommandItem
                  key={group._id}
                  value={`${group.name}`}
                  onSelect={() => {
                    if (!(group._id === value)) {
                      onValueChange?.(group._id);
                    }

                    if (group._id === value) {
                      onValueChange?.('');
                    }

                    setOpen(false);
                  }}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{group.name}</span>
                  </div>
                  <Check
                    className={cn(
                      'ml-auto',
                      value === group._id && 'opacity-100',
                      !(value === group._id) && 'opacity-0',
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
