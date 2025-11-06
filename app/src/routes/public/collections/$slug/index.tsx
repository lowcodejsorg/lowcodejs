import { Pagination } from "@/components/custom/pagination";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { API } from "@/lib/api";
import { type Collection, type Paginated, type Row } from "@/lib/entity";
import { MetaDefault } from "@/lib/utils";
import { Gallery } from "@/routes/_private/collections/$slug/-components/gallery.style";
import { List } from "@/routes/_private/collections/$slug/-components/list.style";
import { useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  useParams,
  useSearch,
} from "@tanstack/react-router";
import type { AxiosError } from "axios";
import { LockIcon, LogInIcon, Share2Icon, UserPlusIcon } from "lucide-react";
import { toast } from "sonner";
import z from "zod";

export const Route = createFileRoute("/public/collections/$slug/")({
  component: RouteComponent,
  validateSearch: z
    .object({
      search: z.string().optional(),
      page: z.coerce.number().default(1),
      perPage: z.coerce.number().default(50),
    })
    .loose(),
});

function RouteComponent() {
  const search = useSearch({
    from: "/public/collections/$slug/",
  });

  const { slug } = useParams({
    from: "/public/collections/$slug/",
  });

  const collection = useQuery({
    queryKey: ["/collections/".concat(slug), slug],
    queryFn: async () => {
      const route = "/collections/".concat(slug);
      const response = await API.get<Collection>(route);
      return response.data;
    },
    enabled: Boolean(slug),
  });

  const pagination = useQuery({
    queryKey: [
      "/collections/".concat(slug).concat("/rows/paginated"),
      slug,
      search,
    ],
    queryFn: async () => {
      const route = "/collections/".concat(slug).concat("/rows/paginated");
      const response = await API.get<Paginated<Row[]>>(route, {
        params: {
          ...search,
        },
      });
      return response.data;
    },
    enabled: Boolean(slug),
  });

  const isPrivate = collection.data?.configuration?.visibility !== "public";
  const hasError = Boolean(collection.error || pagination.error);

  const error = (collection.error || pagination.error) as AxiosError as {
    response: {
      data: {
        message: string;
        code: number;
        cause: string;
      };
    };
  };

  if (
    isPrivate ||
    (hasError && error?.response?.data?.cause === "AUTHENTICATION_REQUIRED")
  ) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <LockIcon className="h-6 w-6" />
            </div>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Esta tabela requer permissão para ser visualizada.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Você precisa fazer login ou não tem permissão para acessar esta
              tabela
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link to="/">
                  <LogInIcon className="mr-2 h-4 w-4" />
                  Fazer Login
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link to="/sign-up">
                  <UserPlusIcon className="mr-2 h-4 w-4" />
                  Criar Conta
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 p-2 flex flex-col gap-1 ">
        <div className="flex-1 flex flex-col gap-6 lg:flex-row lg:justify-between">
          <div className="inline-flex items-start gap-2">
            <div className="flex flex-col">
              <div className="inline-flex items-center gap-2">
                <h2 className="text-2xl font-medium">
                  {collection?.data?.name}
                </h2>
                <Button
                  className="cursor-copy h-auto p-1"
                  variant="outline"
                  onClick={() => {
                    const link = window.location.href;

                    navigator.clipboard.writeText(link);

                    toast("Link copied", {
                      className:
                        "!bg-primary !text-primary-foreground !border-primary",
                      description: "The link was copied successfully",
                      descriptionClassName: "!text-primary-foreground",
                      closeButton: true,
                    });
                  }}
                >
                  <Share2Icon className="size-4" />
                </Button>
              </div>

              {/* <CollectionFiltersSheet /> */}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        {pagination.status === "success" &&
          collection?.status === "success" &&
          collection?.data?.configuration?.style === "list" && (
            <List
              data={pagination?.data?.data ?? []}
              headers={collection?.data?.fields ?? []}
              order={collection?.data?.configuration?.fields?.orderList ?? []}
            />
          )}

        {pagination.status === "success" &&
          collection?.status === "success" &&
          collection?.data?.configuration?.style === "gallery" && (
            <Gallery
              data={pagination?.data?.data ?? []}
              headers={collection?.data?.fields ?? []}
              order={collection?.data?.configuration?.fields?.orderList ?? []}
            />
          )}
      </div>

      <div className="flex-shrink-0 border-t p-2">
        <Pagination meta={pagination?.data?.meta ?? MetaDefault} />
      </div>
    </div>
  );
}
