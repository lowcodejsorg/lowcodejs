import { Button } from "@/components/ui/button";
import { useAuthentication } from "@/hooks/authentication.hook";
import { API } from "@/lib/api";
import type { Field, Paginated, Reaction, Row } from "@/lib/entity";
import { QueryClient } from "@/lib/query-client";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useParams, useSearch } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import { toast } from "sonner";

interface Props {
  row: Row;
  field: Field;
}
export function FieldReaction({ field, row }: Props) {
  const { user } = useAuthentication();

  const data = Array.from<Reaction>(row[field.slug] ?? []);

  const total_like = data?.filter((d) => d.type === "like").length ?? 0;
  const total_unlike = data?.filter((d) => d.type === "unlike").length ?? 0;

  const user_like = data?.some(
    (d) =>
      d.type === "like" && d?.user?._id?.toString() === user?._id?.toString()
  );

  const user_unlike = data?.some(
    (d) =>
      d.type === "unlike" && d?.user?._id?.toString() === user?._id?.toString()
  );

  const { slug } = useParams({
    from: "/_private/tables/$slug/",
  });

  const search = useSearch({
    strict: false,
  });

  const reaction = useMutation({
    mutationFn: async function (payload: {
      user: string;
      field: string;
      type: Reaction["type"];
    }) {
      const route = "/tables/"
        .concat(slug)
        .concat("/rows/")
        .concat(row._id)
        .concat("/reaction");
      const response = await API.post<Row>(route, payload);
      return response.data;
    },
    onSuccess(data) {
      QueryClient.setQueryData<Paginated<Row[]>>(
        ["/tables/".concat(slug).concat("/rows/paginated"), slug, search],
        (old) => {
          if (!old) return old;
          return {
            meta: old.meta,
            data: old.data.map((item) => {
              if (item._id === data._id) {
                return data;
              }
              return item;
            }),
          };
        }
      );
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        // 400 - INVALID_PARAMETERS
        if (data?.code === 400 && data?.cause === "INVALID_PARAMETERS") {
          toast.error(data?.message ?? "Dados inválidos para reação");
        }

        // 401 - AUTHENTICATION_REQUIRED
        if (data?.code === 401 && data?.cause === "AUTHENTICATION_REQUIRED") {
          toast.error(data?.message ?? "Autenticação necessária");
        }

        // 403 - ACCESS_DENIED
        if (data?.code === 403 && data?.cause === "ACCESS_DENIED") {
          toast.error(
            data?.message ?? "Permissão negada para reagir a este item"
          );
        }

        // 404 - ROW_NOT_FOUND
        if (data?.code === 404 && data?.cause === "ROW_NOT_FOUND") {
          toast.error(data?.message ?? "Registro não encontrado");
        }

        // 409 - REACTION_ALREADY_EXISTS
        if (data?.code === 409 && data?.cause === "REACTION_ALREADY_EXISTS") {
          toast.error(data?.message ?? "Você já reagiu a este item");
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
    <div className="inline-flex">
      <Button
        size="sm"
        variant="ghost"
        className="cursor-pointer"
        onClick={() => {
          reaction.mutateAsync({
            user: user!._id.toString(),
            field: field.slug,
            type: "like",
          });
        }}
      >
        <ThumbsUpIcon
          className={cn(
            "size-4 transition-transform",
            user_like && "fill-primary text-primary"
          )}
        />
        <span className="font-medium">{total_like ?? 0}</span>
      </Button>

      <Button
        size="sm"
        variant="ghost"
        className="cursor-pointer"
        onClick={() => {
          reaction.mutateAsync({
            user: user!._id.toString(),
            field: field.slug,
            type: "unlike",
          });
        }}
      >
        <ThumbsDownIcon
          className={cn(
            "size-4 transition-transform",
            user_unlike && "fill-destructive text-destructive"
          )}
        />
        <span className="font-medium">{total_unlike ?? 0}</span>
      </Button>
    </div>
  );
}
