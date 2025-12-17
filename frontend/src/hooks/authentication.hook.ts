import { AuthenticationContext } from "@/contexts/authentication.context";
import React from "react";

export function useAuthentication() {
  const context = React.useContext(AuthenticationContext);

  if (context === undefined)
    throw new Error(
      "useAuthentication must be used within a AuthenticationProvider"
    );

  return context;
}
