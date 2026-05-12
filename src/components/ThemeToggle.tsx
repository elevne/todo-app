import { useTheme } from "../hooks/useTheme";

export function ThemeToggle() {
  const [theme, toggle] = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      title={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
      className="px-3 py-1.5 rounded-lg text-sm font-medium
                 bg-zinc-200 hover:bg-zinc-300
                 dark:bg-zinc-800 dark:hover:bg-zinc-700
                 transition-colors"
    >
      {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}
