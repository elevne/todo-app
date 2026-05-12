import { useState } from "react";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Section as SectionType, Task } from "../types";
import { TaskItem } from "./TaskItem";
import { useTodoStore } from "../store/todoStore";
import { AutoGrowTextarea } from "./AutoGrowTextarea";

interface Props {
  section: SectionType | null; // null = 섹션 미지정 영역
  categoryId: string;
  tasks: Task[];
}

export function Section({ section, categoryId, tasks }: Props) {
  const renameSection = useTodoStore((s) => s.renameSection);
  const deleteSection = useTodoStore((s) => s.deleteSection);
  const addTask = useTodoStore((s) => s.addTask);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(section?.name ?? "");
  const [adding, setAdding] = useState(false);
  const [taskDraft, setTaskDraft] = useState("");

  const sectionId = section?.id ?? null;
  const droppableId = sectionId ?? "__no_section__";

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: droppableId,
    data: { type: "section", sectionId },
  });

  const sortable = useSortable({
    id: section?.id ?? "__no_section__",
    data: { type: "section-handle" },
    disabled: !section,
  });

  const style = section
    ? {
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
        opacity: sortable.isDragging ? 0.5 : 1,
      }
    : undefined;

  const commitName = () => {
    if (!section) return;
    const v = draftName.trim();
    if (v && v !== section.name) renameSection(section.id, v);
    else setDraftName(section.name);
    setEditingName(false);
  };

  const commitTask = () => {
    const v = taskDraft.trim();
    if (v) addTask(categoryId, sectionId, v);
    setTaskDraft("");
    setAdding(false);
  };

  return (
    <div
      ref={section ? sortable.setNodeRef : undefined}
      style={style}
      className="mb-6"
    >
      {section ? (
        <div
          className="group flex items-center gap-2 mb-2 px-1"
          {...sortable.attributes}
        >
          <span
            {...sortable.listeners}
            className="cursor-grab active:cursor-grabbing text-zinc-400 select-none"
            title="섹션 드래그하여 이동"
          >
            ⋮⋮
          </span>
          {editingName ? (
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitName();
                if (e.key === "Escape") {
                  setDraftName(section.name);
                  setEditingName(false);
                }
              }}
              className="bg-transparent outline-none font-semibold text-base border-b border-zinc-300 dark:border-zinc-700"
            />
          ) : (
            <h3
              onDoubleClick={() => setEditingName(true)}
              className="font-semibold text-base cursor-text select-none"
              title="더블클릭으로 이름 변경"
            >
              {section.name}
            </h3>
          )}
          <span className="text-xs text-zinc-400">
            {tasks.length}
          </span>
          <button
            onClick={() => {
              if (confirm(`"${section.name}" 섹션을 삭제할까요? (할 일은 유지됩니다)`)) {
                deleteSection(section.id);
              }
            }}
            className="opacity-0 group-hover:opacity-100 text-xs text-zinc-400 hover:text-red-500 ml-auto px-1.5"
            title="섹션 삭제"
          >
            ✕
          </button>
        </div>
      ) : tasks.length > 0 ? (
        <div className="text-xs text-zinc-400 mb-2 px-1">섹션 미지정</div>
      ) : null}

      <div
        ref={setDroppableRef}
        className={`space-y-1.5 rounded-lg p-1 ${
          isOver ? "ring-2 ring-accent/40 bg-accent/5" : ""
        } ${tasks.length === 0 ? "min-h-[44px]" : ""}`}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((t) => (
            <TaskItem key={t.id} task={t} />
          ))}
        </SortableContext>

        {adding ? (
          <AutoGrowTextarea
            autoFocus
            value={taskDraft}
            onChange={(e) => setTaskDraft(e.target.value)}
            onBlur={commitTask}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                commitTask();
              }
              if (e.key === "Escape") {
                setTaskDraft("");
                setAdding(false);
              }
            }}
            placeholder="할 일 입력 후 Enter (Shift+Enter로 줄바꿈)"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none leading-relaxed
                       bg-white dark:bg-zinc-900
                       border border-accent focus:ring-2 focus:ring-accent/40"
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full text-left px-3 py-2 rounded-lg text-sm
                       text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300
                       hover:bg-zinc-100 dark:hover:bg-zinc-800/50
                       border border-dashed border-zinc-200 dark:border-zinc-800"
          >
            + 할 일 추가
          </button>
        )}
      </div>
    </div>
  );
}
