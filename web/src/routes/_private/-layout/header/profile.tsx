import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthentication } from "@/hooks/authentication.hook";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { toast } from "sonner";

export function Profile() {
  const { t } = useI18n();
  const router = useRouter();

  const { user, signOut: _signOut } = useAuthentication();

  const signOut = useMutation({
    mutationFn: async function () {
      const route = "/authentication/sign-out";
      const response = await API.post(route);
      return response.data;
    },
    onSuccess() {
      _signOut();
      router.navigate({
        to: "/",
        replace: true,
      });
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        // 401 - AUTHENTICATION_REQUIRED
        if (data?.code === 401 && data?.cause === "AUTHENTICATION_REQUIRED") {
          toast.error(data?.message ?? t("LAYOUT_PROFILE_AUTH_REQUIRED_ERROR", "Authentication required"));
        }

        // 500 - SERVER_ERROR
        if (data?.code === 500) {
          toast.error(data?.message ?? "Erro interno do servidor");
        }
      }

      console.error(error);
    },
  });

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="rounded-sm px-2 py-0  border h-auto">
          <Avatar className="h-6 w-6">
            <AvatarImage
              src="/avatars/01.png"
              alt={
                t(
                  "PROFILE_DROPDOWN_USER_AVATAR_ALT",
                  "User profile"
                ) as string
              }
            />
            <AvatarFallback className="text-xs">
              {user?.name?.split(" ")[0][0] ?? "EB"}
            </AvatarFallback>
          </Avatar>
          <div className="hidden lg:flex flex-col gap-1 justify-center items-start">
            <p className="text-xs leading-none font-medium">
              {user?.name?.split(" ")[0] ?? ""}
            </p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to="/profile">
              {t("PROFILE_DROPDOWN_PROFILE_MENU_ITEM", "Profile")}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut.mutateAsync()}>
          {t("PROFILE_DROPDOWN_LOGOUT_MENU_ITEM", "Logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
