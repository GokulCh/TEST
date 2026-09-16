"use client";

import { useEffect } from "react";
import { applyThemePreset } from "@/lib/theme-presets";

const THEME_VARIABLES = [
  "--bg-canvas", "--fg-default", "--fg-muted", "--border-subtle", "--panel-bg",
  "--surface-raised", "--surface-inset", "--accent-purple", "--accent-cyan", "--focus-ring",
  "--primary-50", "--primary-500", "--primary-600", "--secondary-50", "--secondary-500",
  "--secondary-600", "--tertiary-50", "--tertiary-500", "--tertiary-600",
];

export function ThemeScope({ children, dashboard = false }: { children: React.ReactNode; dashboard?: boolean }) {
  useEffect(() => {
    const root = document.documentElement;
    if (dashboard) {
      applyThemePreset(localStorage.getItem("guild-theme") ?? "default");
      return;
    }
    applyThemePreset("default");
  }, [dashboard]);

  return <>{children}</>;
}
