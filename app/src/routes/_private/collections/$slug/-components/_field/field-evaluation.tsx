import { Button } from "@/components/ui/button";
import { useAuthentication } from "@/hooks/authentication.hook";
import { API } from "@/lib/api";
import type { Evaluation, Field, Paginated, Row } from "@/lib/entity";
import { QueryClient } from "@/lib/query-client";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useParams, useSearch } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { Star } from "lucide-react";
import React from "react";
import { toast } from "sonner";

interface Props {
  size?: number;
  disabled?: boolean;
  className?: string;
  row: Row;
  field: Field;
}

export function FieldEvaluation({
  size = 16,
  disabled = false,
  className,
  row,
  field,
}: Props) {
  const MAX_RATING = 5;

  const { user } = useAuthentication();

  const data = Array.from<Evaluation>(row[field.slug] ?? []);

  const userEvaluation = data?.some(
    (d) => d?.user?._id?.toString() === user?._id?.toString()
  );
  const userEvaluationValue = data?.find(
    (d) => d?.user?._id?.toString() === user?._id?.toString()
  )?.value;

  const average =
    data?.length > 0
      ? data?.reduce((acc, curr) => acc + curr.value, 0) / data?.length
      : 0;

  const [hoverRating, setHoverRating] = React.useState(0);

  const { slug } = useParams({
    from: "/_private/collections/$slug/",
  });

  const search = useSearch({
    strict: false,
  });

  const evaluation = useMutation({
    mutationFn: async function (payload: {
      user: string;
      field: string;
      value: number;
    }) {
      const route = "/collections/"
        .concat(slug)
        .concat("/rows/")
        .concat(row._id)
        .concat("/evaluation");
      const response = await API.post<Row>(route, payload);
      return response.data;
    },
    onSuccess(data) {
      QueryClient.setQueryData<Paginated<Row[]>>(
        ["/collections/".concat(slug).concat("/rows/paginated"), slug, search],
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
          toast.error(data?.message ?? "Avaliação inválida");
        }

        // 401 - AUTHENTICATION_REQUIRED
        if (data?.code === 401 && data?.cause === "AUTHENTICATION_REQUIRED") {
          toast.error(data?.message ?? "Autenticação necessária");
        }

        // 403 - ACCESS_DENIED
        if (data?.code === 403 && data?.cause === "ACCESS_DENIED") {
          toast.error(data?.message ?? "Permissão negada para avaliar este item");
        }

        // 404 - ROW_NOT_FOUND
        if (data?.code === 404 && data?.cause === "ROW_NOT_FOUND") {
          toast.error(data?.message ?? "Registro não encontrado");
        }

        // 409 - EVALUATION_ALREADY_EXISTS
        if (data?.code === 409 && data?.cause === "EVALUATION_ALREADY_EXISTS") {
          toast.error(data?.message ?? "Você já avaliou este item");
        }

        // 500 - SERVER_ERROR
        if (data?.code === 500) {
          toast.error(data?.message ?? "Erro interno do servidor");
        }
      }

      console.error(error);
    },
  });

  const handleMouseEnter = (value: number) => {
    if (disabled) return;
    setHoverRating(value);
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    setHoverRating(0);
  };

  const displayRating = (userEvaluationValue || hoverRating) ?? average;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1">
        {Array.from({ length: MAX_RATING }, (_, index) => {
          const value = index + 1;
          const isFilled = userEvaluation && value <= displayRating;

          return (
            <Button
              size="sm"
              variant="ghost"
              key={index}
              type="button"
              onClick={() => {
                evaluation.mutateAsync({
                  user: user!._id.toString(),
                  field: field.slug,
                  value,
                });
              }}
              onMouseEnter={() => handleMouseEnter(value)}
              onMouseLeave={handleMouseLeave}
              disabled={disabled}
              className={cn(
                "transition-all duration-200 ease-in-out p-0 has-[>svg]:p-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm",
                disabled && "cursor-not-allowed opacity-50",
                !disabled && "cursor-pointer hover:scale-110"
              )}
            >
              <Star
                size={size}
                className={cn(
                  "transition-all duration-200",
                  isFilled && "fill-yellow-400 text-yellow-400",
                  !isFilled && "fill-none text-gray-300 hover:text-yellow-400"
                )}
              />
            </Button>
          );
        })}
      </div>

      <span className="text-sm font-medium text-muted-foreground min-w-[3ch]">
        {average?.toPrecision(1)}
      </span>
    </div>
  );
}
