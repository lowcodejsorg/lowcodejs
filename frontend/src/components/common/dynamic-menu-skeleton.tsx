import React from 'react';

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';

export function DynamicMenuSkeleton(): React.JSX.Element {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        {/* <Skeleton className="h-4 w-16" /> */}
        <span>Menu</span>
      </SidebarGroupLabel>
      <SidebarMenu>
        {[1, 2, 3].map((index) => (
          <SidebarMenuItem key={index}>
            <SidebarMenuButton>
              <Skeleton className="size-8" />
              <Skeleton className="h-4 flex-1" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
