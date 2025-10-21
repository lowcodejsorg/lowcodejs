import { CollectionManagementProvider } from "@/contexts/collection-management.context";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_private/collections/$slug")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <CollectionManagementProvider>
      <Outlet />
    </CollectionManagementProvider>
  );
}
