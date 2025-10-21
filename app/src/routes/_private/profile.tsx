import { useI18n } from "@/hooks/i18.hook";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_private/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useI18n();
  return <div>{t("PROFILE_HELLO_MESSAGE", "Hello '_private/profile'!")}</div>;
}
