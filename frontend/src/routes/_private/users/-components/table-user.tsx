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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useI18n } from "@/hooks/i18.hook";
import type { User } from "@/lib/entity";
import { cn } from "@/lib/utils";
import { EllipsisIcon, EyeIcon, PencilIcon } from "lucide-react";
import React from "react";
import { SheetUserShow } from "./sheet-user-show";
import { SheetUserUpdate } from "./sheet-user-update";

interface Props {
  data: User[];
  headers: string[];
}

function TableUserRow({ user }: { user: User }) {
  const { t } = useI18n();

  const sheetUserShowButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const sheetUserUpdateButtonRef = React.useRef<HTMLButtonElement | null>(null);

  return (
    <TableRow key={user._id}>
      <TableCell>{user.name}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>
        <Badge variant="outline">{user?.group?.name || "N/A"}</Badge>
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={cn(
            "font-semibold border-transparent",
            user.status === "active" && "bg-green-100 text-green-700",
            user.status === "inactive" && "bg-red-100 text-red-700"
          )}
        >
          {user?.status || "N/A"}
        </Badge>
      </TableCell>
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
                sheetUserShowButtonRef?.current?.click();
              }}
            >
              <EyeIcon className="size-4" />
              <span>{t("ACTION_SHOW_LABEL", "Visualizar")}</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="inline-flex space-x-1 w-full"
              onClick={() => {
                sheetUserUpdateButtonRef?.current?.click();
              }}
            >
              <PencilIcon className="size-4" />
              <span>{t("ACTION_UPDATE_LABEL", "Editar")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <SheetUserShow ref={sheetUserShowButtonRef} _id={user._id} />
        <SheetUserUpdate ref={sheetUserUpdateButtonRef} _id={user._id} />
      </TableCell>
    </TableRow>
  );
}

export function TableUsers({ data, headers }: Props): React.ReactElement {
  return (
    <Table>
      <TableHeader className="sticky top-0 bg-background">
        <TableRow className="">
          {headers?.map((head) => (
            <TableHead key={head}>
              <span>{head}</span>
            </TableHead>
          ))}
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((user) => (
          <TableUserRow user={user} key={user?._id} />
        ))}
      </TableBody>
    </Table>
  );
}
