import { SystemConfigContext } from "@/contexts/system-config.context";
import React from "react";

export function useSystemConfig() {
  const context = React.useContext(SystemConfigContext);
  if (!context) {
    throw new Error("useSystemConfig deve ser usado dentro de SystemProvider");
  }
  return context;
}
