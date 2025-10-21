import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import type { User } from "@/lib/entity";
import { useQuery } from "@tanstack/react-query";
import React from "react";

function UserDetailSkeleton() {
  const { t } = useI18n();

  return (
    <section className="space-y-4 mt-4">
      <Card className="py-4 px-3 shadow-none gap-2">
        <CardHeader className="p-0">
          <CardTitle>
            {t("USER_ROUTE_SHEET_FIELD_EMAIL_LABEL", "E-mail")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Skeleton className="h-5 w-full max-w-[250px]" />
        </CardContent>
      </Card>

      <Card className="py-4 px-3 shadow-none gap-2">
        <CardHeader className="p-0">
          <CardTitle>
            {t("USER_ROUTE_SHEET_FIELD_NAME_LABEL", "Nome")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Skeleton className="h-5 w-full max-w-[200px]" />
        </CardContent>
      </Card>

      <Card className="py-4 px-3 shadow-none gap-2">
        <CardHeader className="p-0">
          <CardTitle>
            {t("USER_ROUTE_SHEET_FIELD_ROLE_LABEL", "Cargo")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Skeleton className="h-5 w-full max-w-[150px]" />
        </CardContent>
      </Card>
    </section>
  );
}

function UserDetail({ user }: { user: User }) {
  const { t } = useI18n();

  return (
    <section className="space-y-4">
      <Card className="py-4 px-3 shadow-none gap-2">
        <CardHeader className="p-0">
          <CardTitle>
            {t("USER_ROUTE_SHEET_FIELD_EMAIL_LABEL", "E-mail")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">{user?.email}</CardContent>
      </Card>

      <Card className="py-4 px-3 shadow-none gap-2">
        <CardHeader className="p-0">
          <CardTitle>
            {t("USER_ROUTE_SHEET_FIELD_NAME_LABEL", "Nome")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">{user?.name}</CardContent>
      </Card>

      <Card className="py-4 px-3 shadow-none gap-2">
        <CardHeader className="p-0">
          <CardTitle>
            {t("USER_ROUTE_SHEET_FIELD_ROLE_LABEL", "Cargo")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">{user?.group?.name}</CardContent>
      </Card>
    </section>
  );
}

interface ShowUserSheetProps extends React.ComponentProps<typeof SheetTrigger> {
  _id: string;
}

export function ShowUserSheet({ _id, ...props }: ShowUserSheetProps) {
  const { t } = useI18n();

  const [open, setOpen] = React.useState(false);

  const response = useQuery({
    queryKey: ["/users/".concat(_id), _id],
    queryFn: async function () {
      const route = "/users/".concat(_id);
      const response = await API.get<User>(route);
      return response.data;
    },
    enabled: Boolean(open) && Boolean(_id),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="hidden" {...props} />
      <SheetContent className="flex flex-col py-4 px-6 gap-5 sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="px-0">
          <SheetTitle className="text-lg font-medium">
            {t("USER_ROUTE_SHEET_SHOW_TITLE", "Detalhes do Usuário")}
          </SheetTitle>
          <SheetDescription>
            {t(
              "USER_ROUTE_SHEET_SHOW_DESCRIPTION",
              t("USER_SHEET_SHOW_DESCRIPTION", "View user details")
            )}
          </SheetDescription>
        </SheetHeader>
        {response.status === "pending" && <UserDetailSkeleton />}
        {response.status === "success" && <UserDetail user={response.data} />}
      </SheetContent>
    </Sheet>
  );
}
