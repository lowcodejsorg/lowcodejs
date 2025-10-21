import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Header } from "./-layout/header";
import { Sidebar } from "./-layout/sidebar";

export const Route = createFileRoute("/_private")({
  component: RouteComponent,
  // loader: () => {
  //   const id = localStorage.getItem(APP_ID);
  //   if (!id)
  //     return redirect({
  //       to: "/",
  //     });
  // },
});

function RouteComponent() {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar />
        <SidebarInset className="relative flex flex-col h-screen w-full overflow-hidden">
          <Header />
          <Outlet />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
