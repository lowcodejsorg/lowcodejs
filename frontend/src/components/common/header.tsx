import { useLocation } from '@tanstack/react-router';
import React from 'react';

import { InputSearch } from './input-search';

import { Profile } from '@/components/common/profile';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface HeaderProps {
  routesWithoutSearchInput: Array<string | RegExp>;
}

export function Header({
  routesWithoutSearchInput,
}: HeaderProps): React.JSX.Element {
  const location = useLocation();

  const showSearchInput = !routesWithoutSearchInput.some((route) => {
    if (route instanceof RegExp) {
      return route.test(location.pathname);
    }
    return location.pathname === route;
  });

  return (
    <header className="w-full py-4 inline-flex gap-2 px-4 justify-center border-b ">
      <nav className="container max-w-full items-center inline-flex justify-between gap-4 h-8">
        <SidebarTrigger
          className="cursor-pointer rounded-sm shadow-none h-full w-8"
          variant="outline"
          size="icon"
        />
        <div className="inline-flex gap-2 w-full items-center">
          {showSearchInput && <InputSearch />}
        </div>
        <div className="inline-flex gap-2">
          {/* <ToggleTheme /> */}
          <Profile />
        </div>
      </nav>
    </header>
  );
}
