import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PublicHeader } from "../-components/header";

export const Route = createFileRoute("/public/tables")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <section className="relative flex flex-col h-screen w-full overflow-hidden">
      <PublicHeader />
      <div className="flex-1 overflow-hidden px-4">
        <Outlet />
      </div>
    </section>
  );
}
