import { TableManagementProvider } from "@/contexts/table-management.context";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_private/tables/$slug")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <TableManagementProvider>
      <Outlet />
    </TableManagementProvider>
  );
}
