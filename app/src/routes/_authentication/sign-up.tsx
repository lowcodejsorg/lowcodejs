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
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { EyeClosedIcon, EyeIcon, LoaderCircle } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export const Route = createFileRoute("/_authentication/sign-up")({
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();
  const { t } = useI18n();
  const form = useForm();

  const [show, setShow] = React.useState<{
    password: boolean;
    confirmPassword: boolean;
  }>({
    password: false,
    confirmPassword: false,
  });

  const signUpMutation = useMutation({
    mutationFn: async function (payload: {
      name: string;
      email: string;
      password: string;
    }) {
      const response = await API.post("/authentication/sign-up", payload);
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

        // 409 - RESOURCE_ALREADY_EXISTS (email já cadastrado)
        if (data?.code === 409 && data?.cause === "RESOURCE_ALREADY_EXISTS") {
          toast.error("Email already exists");
          // form.setError("email", {
          //   message:
          //     data?.message ??
          //     t("ERROR_EMAIL_ALREADY_EXISTS_MESSAGE", "Email already exists"),
          // });
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

        // 500 - SIGN_UP_ERROR
        if (data?.code === 500 && data?.cause === "SIGN_UP_ERROR") {
          toast.error(
            data?.message ??
              t("ERROR_INTERNAL_SERVER_MESSAGE", "Internal server error")
          );
        }
      }

      console.error(error);
    },
    onSuccess() {
      // toast.success(
      //   t("SUCCESS_ACCOUNT_CREATED_MESSAGE", "Account created successfully!")
      // );

      router.navigate({
        from: "/sign-up",
        to: "/",
        replace: true,
      });
    },
  });

  console.log(form.formState.errors);

  const onSignUp = form.handleSubmit(async (data) => {
    if (signUpMutation.status === "pending") return;

    if (data.password !== data.confirmPassword) {
      form.setError("confirmPassword", {
        // message: t("ERROR_PASSWORD_MISMATCH_MESSAGE", "Passwords do not match"),
        message: "Passwords do not match",
      });
      return;
    }

    const payload = {
      name: data.name?.trim(),
      email: data.email?.trim(),
      password: data.password?.trim(),
    };

    await signUpMutation.mutateAsync(payload);
  });

  return (
    <section className="flex flex-1 flex-col w-full h-screen items-center justify-center">
      <Form {...form}>
        <form
          onSubmit={onSignUp}
          className="max-w-[32.5rem] w-full flex flex-col gap-4 shadow-2xl p-8 rounded-2xl"
        >
          <div className="flex justify-center pt-4 pb-2">
            <Logo />
          </div>

          <FormField
            control={form.control}
            name="name"
            rules={{
              validate: function (value) {
                value = value?.trim();

                if (!value) return "Nome é obrigatório";

                if (value.trim().length < 3) {
                  return "Nome deve ter pelo menos 3 caracteres";
                }

                return true;
              },
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("AUTH_SIGNUP_NAME_LABEL", "Nome")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={
                      t(
                        "AUTH_SIGNUP_NAME_PLACEHOLDER",
                        "João da Silva"
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
            name="email"
            rules={{
              validate: function (value) {
                value = value?.trim();

                if (!value) return "E-mail é obrigatório";

                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                  return "E-mail inválido";
                }

                return true;
              },
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("AUTH_SIGNUP_EMAIL_LABEL", "E-mail")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={
                      t(
                        "AUTH_SIGNUP_EMAIL_PLACEHOLDER",
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
            name="password"
            rules={{
              validate: function (value) {
                if (!value) return "Senha é obrigatória";

                if (value.length < 8) {
                  return "Senha deve ter pelo menos 8 caracteres";
                }

                if (!/[A-Z]/.test(value)) {
                  return "Senha deve conter pelo menos uma letra maiúscula";
                }

                if (!/[a-z]/.test(value)) {
                  return "Senha deve conter pelo menos uma letra minúscula";
                }

                if (!/[0-9]/.test(value)) {
                  return "Senha deve conter pelo menos um número";
                }

                if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
                  return "Senha deve conter pelo menos um caractere especial";
                }

                return true;
              },
            }}
            render={({ field }) => (
              <FormItem className="flex flex-col w-full">
                <FormLabel>
                  {t("AUTH_SIGNUP_PASSWORD_LABEL", "Senha")}
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

          <FormField
            control={form.control}
            name="confirmPassword"
            rules={{
              validate: function (value) {
                if (!value) return "Confirmação de senha é obrigatória";

                const password = form.getValues("password");
                if (value !== password) {
                  return "As senhas não coincidem";
                }

                return true;
              },
            }}
            render={({ field }) => (
              <FormItem className="flex flex-col w-full">
                <FormLabel>
                  {t("AUTH_SIGNUP_CONFIRM_PASSWORD_LABEL", "Confirmar Senha")}
                </FormLabel>
                <FormControl>
                  <div className="relative inline-flex">
                    <Input
                      type={show.confirmPassword ? "text" : "password"}
                      className="text-lg w-full flex-1 rounded-tl-md rounded-bl-md rounded-tr-none rounded-br-none"
                      {...field}
                    />
                    <Button
                      type="button"
                      onClick={() =>
                        setShow((state) => ({
                          ...state,
                          confirmPassword: !state.confirmPassword,
                        }))
                      }
                      className="rounded-tl-none rounded-bl-none rounded-tr-md rounded-br-md"
                    >
                      {!show.confirmPassword && <EyeIcon className="size-4" />}
                      {show.confirmPassword && (
                        <EyeClosedIcon className="size-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>

                <FormMessage className="text-right" />
              </FormItem>
            )}
          />

          <div className="inline-flex w-full justify-end">
            <Link to="/" replace className="text-sm hover:underline">
              Já tenho uma conta
              {/* {t("AUTH_SIGNUP_SIGNIN_LINK", "Já tenho uma conta")} */}
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full "
            disabled={signUpMutation.status === "pending"}
          >
            {signUpMutation.status === "pending" && (
              <LoaderCircle className="size-4 animate-spin" />
            )}
            {!(signUpMutation.status === "pending") && (
              <span>{t("AUTH_SIGNUP_REGISTER_BUTTON", "Registrar")}</span>
            )}
          </Button>
        </form>
      </Form>
    </section>
  );
}
