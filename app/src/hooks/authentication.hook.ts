import { AuthenticationContext } from "@/contexts/authentication.context";
import React from "react";

export function useAuthentication() {
  const context = React.useContext(AuthenticationContext);

  if (context === undefined)
    throw new Error(
      "useAuthentication deve ser usado dentro de um ProviderAutenticacao/ContextAutenticacao"
    );

  return context;
}
