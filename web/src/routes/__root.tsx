import { createRootRoute, HeadContent, Outlet } from "@tanstack/react-router";
import React from "react";

export const Route = createRootRoute({
  // beforeLoad: ({ location }) => {
  //   const token = localStorage.getItem(APP_ID);
  //   const isRootRoute = location.pathname === "/";

  //   const isTableOrPrivateRoute =
  //     location.pathname.startsWith("/_private") ||
  //     location.pathname === "/tables";

  //   // Se tem token e está na rota raiz, redireciona para dashboard
  //   if (token && isRootRoute) {
  //     // window.location.href = "/dashboard";
  //     window.location.href = "/tables";

  //     return;
  //   }

  //   // Se não tem token e está tentando acessar rota privada, redireciona para raiz
  //   if (!token && isTableOrPrivateRoute) {
  //     window.location.href = "/";
  //     return;
  //   }
  // },
  component: () => (
    <React.Fragment>
      <HeadContent />
      <Outlet />
    </React.Fragment>
  ),
  head: () => ({
    meta: [
      {
        name: "description",
        content: "LowCodeJs - Official Platform",
      },
      {
        title: "LowCodeJs - Official Platform",
      },
    ],
  }),
});
