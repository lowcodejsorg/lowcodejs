import { Logo } from "@/components/custom/logo";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuthentication } from "@/hooks/authentication.hook";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { EyeClosedIcon, EyeIcon, LoaderCircle } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export const Route = createFileRoute("/_authentication/")({
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();
  const { t } = useI18n();
  const { signIn, check } = useAuthentication();
  const form = useForm();

  const [show, setShow] = React.useState<{
    password: boolean;
  }>({
    password: false,
  });

  const signInMutation = useMutation({
    mutationFn: async function (payload: { email: string; password: string }) {
      const response = await API.post("/authentication/sign-in", payload);
      return response.data;
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        // 400 - INVALID_PARAMETERS
        if (data?.code === 400 && data?.cause === "INVALID_PARAMETERS") {
          toast.error(
            data?.message ?? t("ERROR_INVALID_DATA_MESSAGE", "Invalid data")
          );
        }

        // 401 - AUTHENTICATION_REQUIRED (credenciais inválidas ou usuário inativo)
        if (data?.code === 401 && data?.cause === "AUTHENTICATION_REQUIRED") {
          form.setError("senha", {
            message:
              data?.message ??
              t("ERROR_INVALID_CREDENTIALS_MESSAGE", "Invalid credentials"),
          });
        }

        // 429 - RATE_LIMIT_EXCEEDED
        if (data?.code === 429 && data?.cause === "RATE_LIMIT_EXCEEDED") {
          toast.error(
            data?.message ??
              t(
                "ERROR_RATE_LIMIT_MESSAGE",
                "Too many attempts. Try again later"
              )
          );
        }

        // 500 - SIGN_IN_ERROR
        if (data?.code === 500 && data?.cause === "SIGN_IN_ERROR") {
          toast.error(
            data?.message ??
              t("ERROR_INTERNAL_SERVER_MESSAGE", "Internal server error")
          );
        }
      }

      console.error(error);
    },
    onSuccess(data) {
      signIn(data);

      check();

      router.navigate({
        from: "/",
        to: "/collections",
        replace: true,
      });
    },
  });

  const onSignIn = form.handleSubmit(async (data) => {
    if (signInMutation.status === "pending") return;

    const payload = {
      email: data.email?.trim(),
      password: data.senha?.trim(),
    };

    await signInMutation.mutateAsync(payload);
  });

  return (
    <section className="flex flex-1 flex-col w-full h-screen items-center justify-center">
      <Form {...form}>
        <form
          onSubmit={onSignIn}
          className="max-w-[32.5rem] w-full flex flex-col gap-4 shadow-2xl p-8 rounded-2xl"
        >
          <div className="flex justify-center pt-4 pb-2">
            <Logo />
          </div>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("AUTH_SIGNIN_EMAIL_LABEL", "E-mail")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={
                      t(
                        "AUTH_SIGNIN_EMAIL_PLACEHOLDER",
                        "johndoe@gmail.com"
                      ) as string
                    }
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-right" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="senha"
            render={({ field }) => (
              <FormItem className="flex flex-col w-full">
                <FormLabel>
                  {t("AUTH_SIGNIN_PASSWORD_LABEL", "Senha")}
                </FormLabel>
                <FormControl>
                  <div className="relative inline-flex">
                    <Input
                      type={show.password ? "text" : "password"}
                      className="text-lg w-full flex-1 rounded-tl-md rounded-bl-md rounded-tr-none rounded-br-none"
                      {...field}
                    />
                    <Button
                      type="button"
                      onClick={() =>
                        setShow((state) => ({
                          ...state,
                          password: !state.password,
                        }))
                      }
                      className="rounded-tl-none rounded-bl-none rounded-tr-md rounded-br-md"
                    >
                      {!show.password && <EyeIcon className="size-4" />}
                      {show.password && <EyeClosedIcon className="size-4" />}
                    </Button>
                  </div>
                </FormControl>

                <FormMessage className="text-right" />
              </FormItem>
            )}
          />

          <div className="inline-flex w-full justify-between">
            <Link
              // to="/recuperacao-de-conta"
              to="/request-code"
              className="text-sm hover:underline"
            >
              {t("AUTH_SIGNIN_FORGOT_PASSWORD_LINK", "Esqueci a senha")}
            </Link>
            <Link to="/sign-up" replace className="text-sm hover:underline">
              {t("AUTH_SIGNIN_REGISTER_LINK", "Registrar-se")}
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full "
            disabled={signInMutation.status === "pending"}
          >
            {signInMutation.status === "pending" && (
              <LoaderCircle className="size-4 animate-spin" />
            )}
            {!(signInMutation.status === "pending") && (
              <span>{t("AUTH_SIGNIN_LOGIN_BUTTON", "Entrar")}</span>
            )}
          </Button>
        </form>
      </Form>
    </section>
  );
}
