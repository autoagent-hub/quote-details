import { useState, useEffect } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  useEffect(() => {
    const stored = localStorage.getItem("detailr-theme") as "light" | "dark" | "system" | null;
    if (stored) {
      setTheme(stored);
      applyTheme(stored);
    } else {
      applyTheme("system");
    }

    // Listen to system theme changes if in system mode
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const currentStored = localStorage.getItem("detailr-theme") as
        "light" | "dark" | "system" | null;
      if (!currentStored || currentStored === "system") {
        applyTheme("system");
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const applyTheme = (newTheme: "light" | "dark" | "system") => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (newTheme === "dark" || (newTheme === "system" && prefersDark)) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    localStorage.setItem("detailr-theme", newTheme);
    applyTheme(newTheme);
  };

  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-xs">
      <button
        type="button"
        onClick={() => handleThemeChange("light")}
        title="Light Mode"
        aria-label="Switch to light mode"
        className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
          theme === "light"
            ? "bg-primary text-primary-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
      >
        <Sun className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={() => handleThemeChange("dark")}
        title="Dark Mode"
        aria-label="Switch to dark mode"
        className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
          theme === "dark"
            ? "bg-primary text-primary-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
      >
        <Moon className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={() => handleThemeChange("system")}
        title="System Theme"
        aria-label="Use device system theme"
        className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
          theme === "system"
            ? "bg-primary text-primary-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
      >
        <Monitor className="size-3.5" />
      </button>
    </div>
  );
}
