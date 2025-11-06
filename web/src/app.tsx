import { TooltipProvider } from "@radix-ui/react-tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { AuthenticationProvider } from "./contexts/authentication.context";
import { I18nProvider } from "./contexts/i18n.context";
import { SystemProvider } from "./contexts/system-config.context";
import { ThemeProvider } from "./contexts/theme.context";
import { QueryClient } from "./lib/query-client";
import { routeTree } from "./lib/route-tree.gen";

const router = createRouter({
  routeTree,
  context: {
    QueryClient,
  },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="lowcodejs-theme">
      <TooltipProvider>
        <QueryClientProvider client={QueryClient}>
          <SystemProvider>
            <I18nProvider>
              <AuthenticationProvider>
                <RouterProvider router={router} />
              </AuthenticationProvider>
            </I18nProvider>
          </SystemProvider>
        </QueryClientProvider>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
