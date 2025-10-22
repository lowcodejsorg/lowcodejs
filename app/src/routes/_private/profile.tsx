import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuthentication } from "@/hooks/authentication.hook";
import { useI18n } from "@/hooks/i18.hook";
import { API } from "@/lib/api";
import type { UserGroup } from "@/lib/entity";
import { QueryClient } from "@/lib/query-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { EyeClosedIcon, EyeIcon, LoaderCircle } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export const Route = createFileRoute("/_private/profile")({
  component: RouteComponent,
});

interface ProfileData {
  name: string;
  email: string;
  status: string;
  group: UserGroup;
  createdAt: string;
  updatedAt: string;
}

function RouteComponent() {
  const { t } = useI18n();
  const form = useForm();
  const { user } = useAuthentication();

  const [show, setShow] = React.useState<{
    currentPassword: boolean;
    newPassword: boolean;
    confirmPassword: boolean;
  }>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [allowPasswordChange, setAllowPasswordChange] = React.useState(false);

  const profileQuery = useQuery({
    queryKey: ["/profile", user?._id],
    queryFn: async function () {
      const response = await API.get<ProfileData>("/profile");
      return response.data;
    },
    enabled: Boolean(user?._id),
    staleTime: 0, // Always fetch fresh data
  });

  const updateProfileMutation = useMutation({
    mutationFn: async function (payload: {
      name: string;
      email: string;
      group: string;
      allowPasswordChange: boolean;
      currentPassword?: string;
      newPassword?: string;
    }) {
      const response = await API.put<ProfileData>("/profile", payload);
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

        // 401 - AUTHENTICATION_REQUIRED
        if (data?.code === 401 && data?.cause === "AUTHENTICATION_REQUIRED") {
          toast.error(
            data?.message ??
              t("ERROR_AUTHENTICATION_REQUIRED", "Authentication required")
          );
        }

        // 403 - ACCESS_DENIED / INVALID_CURRENT_PASSWORD
        if (data?.code === 403) {
          if (data?.cause === "INVALID_CURRENT_PASSWORD") {
            form.setError("currentPassword", {
              message: data?.message ?? "Current password is incorrect",
            });
          } else {
            toast.error(data?.message ?? "Access denied");
          }
        }

        // 409 - EMAIL_ALREADY_EXISTS
        if (data?.code === 409 && data?.cause === "EMAIL_ALREADY_EXISTS") {
          form.setError("email", {
            message: data?.message ?? "This email is already in use",
          });
        }

        // 500 - SERVER_ERROR
        if (data?.code === 500) {
          toast.error(
            data?.message ??
              t("ERROR_INTERNAL_SERVER_MESSAGE", "Internal server error")
          );
        }
      }

      console.error(error);
    },
    onSuccess(data) {
      toast.success("Profile updated successfully!");

      // Reset password fields and toggle
      setAllowPasswordChange(false);
      form.setValue("currentPassword", "");
      form.setValue("newPassword", "");
      form.setValue("confirmPassword", "");

      // Update query cache
      QueryClient.setQueryData(["/profile", user?._id], data);
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    if (updateProfileMutation.status === "pending") return;

    if (allowPasswordChange && data.newPassword !== data.confirmPassword) {
      form.setError("confirmPassword", {
        message: "Passwords do not match",
      });
      return;
    }

    const payload = {
      name: data.name?.trim(),
      email: data.email?.trim(),
      group: profileQuery.data?.group?._id || "",
      allowPasswordChange,
      ...(allowPasswordChange && {
        currentPassword: data.currentPassword?.trim(),
        newPassword: data.newPassword?.trim(),
      }),
    };

    await updateProfileMutation.mutateAsync(payload);
  });

  // Clear form when user changes to prevent showing previous user data
  React.useEffect(() => {
    form.reset();
    setAllowPasswordChange(false);
  }, [user?._id, form]);

  // Set form values when profile data loads
  React.useEffect(() => {
    if (profileQuery.data) {
      form.setValue("name", profileQuery.data.name);
      form.setValue("email", profileQuery.data.email);
    }
  }, [profileQuery.data, form]);

  if (profileQuery.status === "pending") {
    return (
      <div className="flex items-center justify-center h-64">
        <LoaderCircle className="size-8 animate-spin" />
      </div>
    );
  }

  if (profileQuery.status === "error") {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Error loading profile data</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">
          Update your personal information
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-6">
          <FormField
            control={form.control}
            defaultValue={profileQuery.data?.name}
            name="name"
            rules={{
              validate: (value) => {
                if (!value) {
                  return "Name is required";
                }
                return true;
              },
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Name <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Enter your full name" {...field} />
                </FormControl>
                <FormMessage className="text-right" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            defaultValue={profileQuery.data?.email}
            rules={{
              validate: (value) => {
                if (!value) {
                  return "Email is required";
                }
                return true;
              },
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Email <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your email"
                    type="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-right" />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <FormLabel>Group Information</FormLabel>
            <div className="rounded-lg border p-4 bg-muted/50">
              <div className="space-y-2">
                <p className="font-medium">{profileQuery.data?.group?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {profileQuery.data?.group?.description ||
                    "No description available"}
                </p>
                <div className="flex flex-wrap gap-1">
                  {profileQuery.data?.group?.permissions?.map((permission) => (
                    <span
                      key={permission.slug}
                      className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                    >
                      {permission.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Change Password</FormLabel>
                <FormDescription>
                  Enable this option to update your password
                </FormDescription>
              </div>
              <Switch
                checked={allowPasswordChange}
                onCheckedChange={setAllowPasswordChange}
              />
            </div>

            {allowPasswordChange && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="currentPassword"
                  rules={{
                    validate: (value) => {
                      if (allowPasswordChange && !value) {
                        return "Current password is required";
                      }
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Current Password{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative inline-flex w-full">
                          <Input
                            type={show.currentPassword ? "text" : "password"}
                            placeholder="Enter your current password"
                            className="flex-1 rounded-tr-none rounded-br-none"
                            {...field}
                          />
                          <Button
                            type="button"
                            onClick={() =>
                              setShow((state) => ({
                                ...state,
                                currentPassword: !state.currentPassword,
                              }))
                            }
                            className="rounded-tl-none rounded-bl-none"
                          >
                            {!show.currentPassword && (
                              <EyeIcon className="size-4" />
                            )}
                            {show.currentPassword && (
                              <EyeClosedIcon className="size-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-right" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newPassword"
                  rules={{
                    validate: (value) => {
                      if (allowPasswordChange && !value) {
                        return "New password is required";
                      }
                      if (allowPasswordChange && value && value.length < 6) {
                        return "Password must be at least 6 characters";
                      }
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        New Password <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative inline-flex w-full">
                          <Input
                            type={show.newPassword ? "text" : "password"}
                            placeholder="Enter your new password"
                            className="flex-1 rounded-tr-none rounded-br-none"
                            {...field}
                          />
                          <Button
                            type="button"
                            onClick={() =>
                              setShow((state) => ({
                                ...state,
                                newPassword: !state.newPassword,
                              }))
                            }
                            className="rounded-tl-none rounded-bl-none"
                          >
                            {!show.newPassword && (
                              <EyeIcon className="size-4" />
                            )}
                            {show.newPassword && (
                              <EyeClosedIcon className="size-4" />
                            )}
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
                    validate: (value) => {
                      if (allowPasswordChange && !value) {
                        return "Confirm password is required";
                      }
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Confirm New Password{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative inline-flex w-full">
                          <Input
                            type={show.confirmPassword ? "text" : "password"}
                            placeholder="Confirm your new password"
                            className="flex-1 rounded-tr-none rounded-br-none"
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
                            className="rounded-tl-none rounded-bl-none"
                          >
                            {!show.confirmPassword && (
                              <EyeIcon className="size-4" />
                            )}
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
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={updateProfileMutation.status === "pending"}
              className="min-w-32"
            >
              {updateProfileMutation.status === "pending" && (
                <LoaderCircle className="size-4 animate-spin" />
              )}
              {!(updateProfileMutation.status === "pending") && (
                <span>Update Profile</span>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
