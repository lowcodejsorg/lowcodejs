import { ToggleTheme } from "@/components/common/toggle-theme";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useLocation } from "@tanstack/react-router";
import { InputSearch } from "../input-search";
import { Profile } from "./profile";

export function Header() {
  const location = useLocation();

  const rotasSemPesquisa = [
    "/dashboard",
    "/settings",
    "/profile",
    // "/alterar-senha",
  ];

  const showSearchInput = !rotasSemPesquisa.some(
    (rota) => location.pathname === rota || location.pathname.endsWith(rota)
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
          {showSearchInput && <InputSearch />}
        </div>
        <div className="inline-flex gap-2">
          <ToggleTheme />
          <Profile />
        </div>
      </nav>
    </header>
  );
}
