import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "../types";
import { useTodoStore } from "../store/todoStore";

export function TaskItem({ task }: { task: Task }) {
  const toggle = useTodoStore((s) => s.toggleTask);
  const rename = useTodoStore((s) => s.renameTask);
  const remove = useTodoStore((s) => s.deleteTask);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { type: "task", task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const commit = () => {
    const v = draft.trim();
    if (v && v !== task.title) rename(task.id, v);
    else setDraft(task.title);
    setEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-2 px-3 py-2 rounded-lg
                 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800
                 border border-zinc-200 dark:border-zinc-800"
    >
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-zinc-400 select-none px-1"
        title="드래그하여 이동"
      >
        ⋮⋮
      </span>

      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => toggle(task.id)}
        className="w-4 h-4 accent-accent cursor-pointer"
      />

      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraft(task.title);
              setEditing(false);
            }
          }}
          className="flex-1 bg-transparent outline-none text-sm"
        />
      ) : (
        <span
          onDoubleClick={() => setEditing(true)}
          className={`flex-1 text-sm cursor-text select-none ${
            task.completed
              ? "line-through text-zinc-400 dark:text-zinc-500"
              : ""
          }`}
        >
          {task.title}
        </span>
      )}

      <button
        onClick={() => remove(task.id)}
        className="opacity-0 group-hover:opacity-100 text-xs text-zinc-400 hover:text-red-500 px-1.5"
        title="삭제"
      >
        ✕
      </button>
    </div>
  );
}
