import { API } from "@/lib/api";
import type { Menu } from "@/lib/entity";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";

export const Route = createFileRoute("/_private/pages/$slug/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { slug } = useParams({
    from: "/_private/pages/$slug/",
  });
  const page = useQuery({
    queryKey: ["/pages/".concat(slug), slug],
    queryFn: async function () {
      const route = "/pages/".concat(slug);
      const response = await API.get<Menu>(route);
      return response.data;
    },
  });

  return (
    <div className="flex flex-col p-4 space-y-4">
      <div className="i">
        <h2 className="font-semibold text-2xl">Título da página</h2>
      </div>
      <div
        className="prose"
        dangerouslySetInnerHTML={{ __html: page.data?.html ?? "" }}
      />
    </div>
  );
}
