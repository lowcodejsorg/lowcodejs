import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import type { UserGroup } from "@/lib/entity";
import { useQuery } from "@tanstack/react-query";
import React from "react";

interface Props {
  data: UserGroup;
}
export function UserGroupDetail({ data }: Props) {
  const { t } = useI18n();

  return (
    <section className="flex flex-col gap-2">
      <Card className="py-4 px-3 shadow-none gap-2">
        <CardHeader className="p-0">
          <CardTitle>
            {t("USER_GROUP_ROUTE_SHEET_FIELD_NAME_LABEL", "Nome")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">{data?.name}</CardContent>
      </Card>

      <Card className="py-4 px-3 shadow-none gap-2">
        <CardHeader className="p-0">
          <CardTitle>Slug</CardTitle>
        </CardHeader>
        <CardContent className="p-0">{data?.slug}</CardContent>
      </Card>

      <Card className="py-4 px-3 shadow-none gap-2">
        <CardHeader className="p-0">
          <CardTitle>
            {t("USER_GROUP_ROUTE_SHEET_FIELD_DESCRIPTION_LABEL", "Descrição")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">{data?.description}</CardContent>
      </Card>

      <Card className="py-4 px-3 shadow-none gap-2">
        <CardHeader className="p-0">
          <CardTitle>
            {t("USER_GROUP_ROUTE_SHEET_FIELD_PERMISSIONS_LABEL", "Permissões")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data?.permissions?.map((permission) => (
            <div
              className="flex flex-row items-center justify-between p-3 border-b"
              key={permission._id}
            >
              <div className="flex flex-col gap-1">
                <Label className="font-medium">{permission.name}</Label>
                <span className="text-sm opacity-50">
                  {permission?.description}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

export function SheetShowUserGroup({
  _id,
  ...props
}: React.ComponentProps<typeof SheetTrigger> & {
  _id: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);

  // const grupo = useQueryBuscarGrupoDeUsuario({ _id, enabled });

  const group = useQuery({
    queryKey: ["/user-group/".concat(_id), _id],
    queryFn: async function () {
      const route = "/user-group/".concat(_id);
      const response = await API.get<UserGroup>(route);
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
            {t("USER_GROUP_ROUTE_SHEET_SHOW_TITLE", "Detalhes do registro")}
          </SheetTitle>

          <SheetDescription>
            {t(
              "USER_GROUP_ROUTE_SHEET_SHOW_DESCRIPTION",
              "Visualizar detalhes do registro"
            )}
          </SheetDescription>
        </SheetHeader>

        {/* {grupo.status === "pending" && <Skeleton />} */}
        {group.status === "success" && <UserGroupDetail data={group.data} />}
      </SheetContent>
    </Sheet>
  );
}
