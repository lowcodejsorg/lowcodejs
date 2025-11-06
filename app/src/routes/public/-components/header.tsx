import { Logo } from "@/components/custom/logo";
import { ToggleTheme } from "@/components/custom/toggle-theme";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { LogInIcon, UserPlusIcon } from "lucide-react";

export function PublicHeader() {
  return (
    <header className="w-full py-4 inline-flex gap-2 px-4 justify-center border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <nav className="container max-w-full items-center inline-flex justify-between gap-4 h-8">
        <Logo />

        <div className="inline-flex gap-2 items-center">
          <ToggleTheme />
          <Button variant="ghost" asChild>
            <Link to="/">
              <LogInIcon className="mr-2 h-4 w-4" />
              Login
            </Link>
          </Button>
          <Button asChild>
            <Link to="/sign-up">
              <UserPlusIcon className="mr-2 h-4 w-4" />
              Cadastrar
            </Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
