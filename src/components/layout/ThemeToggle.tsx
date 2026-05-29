"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const enabled = stored === "dark" || (!stored && prefersDark);
    setDark(enabled);
    document.documentElement.classList.toggle("dark", enabled);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="p-2 rounded-full text-ocean-600 hover:bg-ocean-100 dark:text-ocean-200 dark:hover:bg-ocean-800 transition-colors"
      aria-label={dark ? "Mode clair" : "Mode sombre"}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
