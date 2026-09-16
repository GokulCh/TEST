"use client";

import { useEffect } from "react";
import { applyThemePreset } from "@/lib/theme-presets";

export function ThemeScope({ children, dashboard = false }: { children: React.ReactNode; dashboard?: boolean }) {
  useEffect(() => {
    applyThemePreset(dashboard ? (localStorage.getItem("guild-theme") ?? "default") : "default");
  }, [dashboard]);

  return <>{children}</>;
}
