import { useI18n } from "@/hooks/i18.hook";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_recovery/request-code")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useI18n();
  return <div>{t("AUTH_RECOVERY_HELLO_MESSAGE", "Hello '_recovery/request-code'!")}</div>;
}
