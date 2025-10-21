import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table as TabelaBase,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useI18n } from "@/hooks/i18.hook";
import type { UserGroup } from "@/lib/entity";
import { EllipsisIcon, EyeIcon, PencilIcon } from "lucide-react";
import React from "react";
import { SheetShowUserGroup } from "./sheet-show-user-group";
import { SheetUpdateUserGroup } from "./sheet-update-user-group";
interface Props {
  data: UserGroup[];
  headers: string[];
}
export function UserGroupTableRow({ data }: { data: UserGroup }) {
  const { t } = useI18n();

  const sheetShowUserGroupButtonRef = React.useRef<HTMLButtonElement | null>(
    null
  );
  const sheetUpdateUserGroupButtonRef = React.useRef<HTMLButtonElement | null>(
    null
  );

  return (
    <TableRow key={data._id}>
      <TableCell>{data.name}</TableCell>
      <TableCell>
        <Badge variant="outline">{data?.slug || "N/A"}</Badge>
      </TableCell>
      <TableCell>{data.description || "N/A"}</TableCell>
      <TableCell className="w-[80px]">
        <DropdownMenu dir="ltr" modal={false}>
          <DropdownMenuTrigger className="p-1 rounded-full ">
            <EllipsisIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="mr-10">
            <DropdownMenuLabel>{t("ACTION_LABEL", "Ações")}</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="inline-flex space-x-1 w-full"
              onClick={() => {
                sheetShowUserGroupButtonRef?.current?.click();
              }}
            >
              <EyeIcon className="size-4" />
              <span>{t("ACTION_SHOW_LABEL", "Visualizar")}</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="inline-flex space-x-1 w-full"
              onClick={() => {
                sheetUpdateUserGroupButtonRef?.current?.click();
              }}
            >
              <PencilIcon className="size-4" />
              <span>{t("ACTION_UPDATE_LABEL", "Editar")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <SheetShowUserGroup _id={data._id} ref={sheetShowUserGroupButtonRef} />
        <SheetUpdateUserGroup
          _id={data._id}
          ref={sheetUpdateUserGroupButtonRef}
        />
      </TableCell>
    </TableRow>
  );
}

export function TableUserGroup({ data, headers }: Props): React.ReactElement {
  return (
    <TabelaBase>
      <TableHeader className="sticky top-0 bg-background">
        <TableRow className="">
          {headers.map((head) => (
            <TableHead key={head}>
              <span>{head}</span>
            </TableHead>
          ))}
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.map((group) => (
          <UserGroupTableRow data={group} key={group._id} />
        ))}
      </TableBody>
    </TabelaBase>
  );
}
