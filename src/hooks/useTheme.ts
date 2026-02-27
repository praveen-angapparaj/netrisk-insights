import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type Theme = "light" | "dark";

const getSystemTheme = (): Theme =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem("netrisk-theme") as Theme | null;
    return stored || getSystemTheme();
  });

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("netrisk-theme", theme);
  }, [theme]);

  // Load preference from DB on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase
        .from("user_preferences" as any)
        .select("theme")
        .eq("user_id", data.user.id)
        .maybeSingle()
        .then(({ data: pref }) => {
          if (pref && (pref as any).theme && (pref as any).theme !== "system") {
            setThemeState((pref as any).theme as Theme);
          }
        });
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      // Persist to DB
      supabase.auth.getUser().then(({ data }) => {
        if (!data.user) return;
        supabase
          .from("user_preferences" as any)
          .upsert({ user_id: data.user.id, theme: next, updated_at: new Date().toISOString() } as any, { onConflict: "user_id" })
          .then(() => {});
      });
      return next;
    });
  }, []);

  return { theme, toggleTheme };
};
