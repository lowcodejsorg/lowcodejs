import type { LinkProps } from '@tanstack/react-router';
import { useLocation } from '@tanstack/react-router';
import React from 'react';

import { Profile } from '@/components/common/profile';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface HeaderProps {
  routesWithoutSearchInput: Array<LinkProps['to']>;
}

export function Header({
  routesWithoutSearchInput,
}: HeaderProps): React.JSX.Element {
  const location = useLocation();

  const showSearchInput = !routesWithoutSearchInput.some(
    (route) =>
      location.pathname === route ||
      location.pathname.endsWith(route?.toString() || ''),
  );

  return (
    <header className="w-full py-4 inline-flex gap-2 px-4 justify-center border-b ">
      <nav className="container max-w-full items-center inline-flex justify-between gap-4 h-8">
        <SidebarTrigger
          className="cursor-pointer rounded-sm shadow-none h-full w-8"
          variant="outline"
          size="icon"
        />
        <div className="inline-flex gap-2 w-full items-center">
          {/* {showSearchInput && <InputSearch />} */}
        </div>
        <div className="inline-flex gap-2">
          {/* <ToggleTheme /> */}
          <Profile />
        </div>
      </nav>
    </header>
  );
}
