import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/i18.hook";
import type { Collection } from "@/lib/entity";
import { Link } from "@tanstack/react-router";
import { CopyIcon } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { ActionMenu } from "./action.menu";

interface Props {
  data: Collection[];
  headers: string[];
}

export function GalleryList({ data, headers }: Props): React.ReactElement {
  const { t } = useI18n();
  const [name, type, link] = headers;

  return (
    <main className="flex-1 w-full flex flex-col  rounded-md gap-4 p-4">
      <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {data?.map((collection) => {
          return (
            <div
              key={collection._id}
              className="flex flex-col gap-3 px-4 pb-4 rounded-lg border w-full"
            >
              <div className="inline-flex items-center justify-end">
                <ActionMenu collection={collection} />
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-sm">
                  <span className="font-semibold">{name}:</span>{" "}
                  {collection?.name}
                </h2>
                <h2 className="text-sm">
                  <span className="font-semibold">{type}:</span>{" "}
                  {collection?.configuration?.style?.toUpperCase() || "N/A"}
                </h2>
                <div className="inline-flex items-center space-x-2">
                  <h2 className="text-sm">
                    <span className="font-semibold">{link}:</span>{" "}
                  </h2>
                  <Link
                    to="/collections/$slug"
                    params={{ slug: collection?.slug }}
                    className="underline underline-offset-4 opacity-70 font-medium"
                  >
                    {"/".concat(collection?.slug)}
                  </Link>
                  <Button
                    className="cursor-copy size-8"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const link = window.location.origin.concat(
                        location.pathname.replace(/\/$/, ""),
                        "/",
                        collection.slug
                      );

                      navigator.clipboard.writeText(link);

                      toast(t("COLLECTION_TOAST_LINK_COPIED", "Link copied"), {
                        className:
                          "!bg-primary !text-primary-foreground !border-primary",
                        description: t("COLLECTION_TOAST_LINK_COPIED_DESCRIPTION", "The link was copied successfully"),
                        descriptionClassName: "!text-primary-foreground",
                        closeButton: true,
                      });
                    }}
                  >
                    <CopyIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
