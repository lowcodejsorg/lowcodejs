import { useI18n } from "@/hooks/i18.hook";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authentication/sign-up")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useI18n();
  return <div>{t("AUTH_SIGNIN_HELLO_MESSAGE", "Hello '_authentication/sign-up'!")}</div>;
}
