import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { APP_ID } from "@/lib/entity";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Header } from "./-layout/header";
import { Sidebar } from "./-layout/sidebar";

export const Route = createFileRoute("/_private")({
  component: RouteComponent,
  beforeLoad: ({ params, location }) => {
    console.log(location);
    const token = localStorage.getItem(APP_ID);

    const slug = (params as { slug: string }).slug;

    if (!token) {
      window.location.href = "/public/tables/".concat(slug);
      return;
    }
  },
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
