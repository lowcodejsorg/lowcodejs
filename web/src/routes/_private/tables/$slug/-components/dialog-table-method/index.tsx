import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { API } from "@/lib/api";
import { type Table } from "@/lib/entity";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import React from "react";
import { FormTableMethod } from "./form-table-method";

export function DialogTableMethod({
  ...props
}: React.ComponentProps<typeof DialogTrigger>) {
  const [open, setOpen] = React.useState(false);

  const { slug } = useParams({
    from: "/_private/tables/$slug/",
  });

  const table = useQuery({
    queryKey: ["/tables/".concat(slug), slug],
    queryFn: async () => {
      const route = "/tables/".concat(slug);
      const response = await API.get<Table>(route);
      return response.data;
    },
    enabled: Boolean(slug),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="hidden" {...props} />
      <DialogContent className="flex flex-col py-4 px-6 gap-5 sm:max-w-[85vw] sm:max-h-[85vh] overflow-y-auto">
        <DialogHeader className="px-0">
          <DialogTitle className="text-lg font-medium">
            Métodos da tabela
          </DialogTitle>
          <DialogDescription>
            Configure scripts JavaScript para automatizar sua tabela
          </DialogDescription>
        </DialogHeader>

        {table.status === "success" && (
          <div className="grid w-full gap-4">
            <FormTableMethod
              onClose={() => setOpen((state) => !state)}
              table={table.data}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
