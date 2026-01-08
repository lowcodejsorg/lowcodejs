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
import { useMenuReadList } from '@/hooks/tanstack-query/use-menu-read-list';
import { E_MENU_ITEM_TYPE } from '@/lib/constant';
import { cn } from '@/lib/utils';

interface MenuComboboxProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  excludeId?: string;
}

export function MenuCombobox({
  value = '',
  onValueChange,
  placeholder = 'Selecione um menu pai...',
  className,
  disabled = false,
  excludeId,
}: MenuComboboxProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);

  const { data: menus, status } = useMenuReadList();

  // Filter menus: only separators and root items (excluding self)
  const availableMenus = React.useMemo(() => {
    if (!menus) return [];

    return menus.filter((menu) => {
      // Exclude self
      if (excludeId && menu._id === excludeId) return false;

      // Include separators
      if (menu.type === E_MENU_ITEM_TYPE.SEPARATOR) return true;

      // Include root items (no parent)
      if (!menu.parent) return true;

      return false;
    });
  }, [menus, excludeId]);

  const selectedMenu = availableMenus.find((menu) => menu._id === value);

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
          {selectedMenu && `${selectedMenu.name}`}
          {!selectedMenu && placeholder}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Buscar menu..."
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>Nenhum menu encontrado.</CommandEmpty>
            <CommandGroup>
              {availableMenus.map((menu) => (
                <CommandItem
                  key={menu._id}
                  value={`${menu.name}`}
                  onSelect={() => {
                    if (!(menu._id === value)) {
                      onValueChange?.(menu._id);
                    }

                    if (menu._id === value) {
                      onValueChange?.('');
                    }

                    setOpen(false);
                  }}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{menu.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {menu.slug} • {menu.type}
                    </span>
                  </div>
                  <Check
                    className={cn(
                      'ml-auto',
                      value === menu._id && 'opacity-100',
                      !(value === menu._id) && 'opacity-0',
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
