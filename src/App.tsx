import { useEffect } from "react";
import { TabBar } from "./components/TabBar";
import { TabContent } from "./components/TabContent";
import { ThemeToggle } from "./components/ThemeToggle";
import { useTodoStore } from "./store/todoStore";

export default function App() {
  const init = useTodoStore((s) => s.init);
  const loaded = useTodoStore((s) => s.loaded);

  useEffect(() => {
    init().catch((e) => console.error("DB init failed", e));
  }, [init]);

  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center justify-between px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-lg font-semibold tracking-tight">Todo</h1>
        <ThemeToggle />
      </header>

      {loaded ? (
        <>
          <TabBar />
          <TabContent />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-zinc-400">
          불러오는 중...
        </div>
      )}
    </div>
  );
}
