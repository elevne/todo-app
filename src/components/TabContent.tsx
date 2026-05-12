import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useTodoStore } from "../store/todoStore";
import { Section } from "./Section";
import { TaskItem } from "./TaskItem";
import type { Task } from "../types";

export function TabContent() {
  const activeId = useTodoStore((s) => s.activeCategoryId);
  const sections = useTodoStore((s) => s.sections);
  const tasks = useTodoStore((s) => s.tasks);
  const addSection = useTodoStore((s) => s.addSection);
  const reorderSections = useTodoStore((s) => s.reorderSections);
  const reorderTasks = useTodoStore((s) => s.reorderTasks);
  const moveTaskToSection = useTodoStore((s) => s.moveTaskToSection);

  const [activeDragTask, setActiveDragTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // 섹션별로 task 그룹화 (sectionId === null 그룹은 제일 위에 표시)
  const grouped = useMemo(() => {
    const noSec = tasks
      .filter((t) => t.sectionId === null)
      .sort((a, b) => a.position - b.position);
    const bySection = new Map<string, Task[]>();
    for (const s of sections) bySection.set(s.id, []);
    for (const t of tasks) {
      if (t.sectionId !== null && bySection.has(t.sectionId)) {
        bySection.get(t.sectionId)!.push(t);
      }
    }
    for (const arr of bySection.values()) arr.sort((a, b) => a.position - b.position);
    return { noSec, bySection };
  }, [sections, tasks]);

  if (!activeId) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-400 dark:text-zinc-500">
        왼쪽 위 + 버튼으로 첫 카테고리를 만들어 보세요
      </div>
    );
  }

  const onDragStart = (e: DragStartEvent) => {
    const task = tasks.find((t) => t.id === e.active.id);
    if (task) setActiveDragTask(task);
  };

  const onDragEnd = async (e: DragEndEvent) => {
    setActiveDragTask(null);
    const { active, over } = e;
    if (!over) return;

    const activeData = active.data.current as
      | { type?: string; task?: Task }
      | undefined;
    const overData = over.data.current as
      | { type?: string; sectionId?: string | null }
      | undefined;

    // 1) 섹션끼리 reorder
    if (
      activeData?.type === "section-handle" &&
      sections.some((s) => s.id === over.id)
    ) {
      if (active.id === over.id) return;
      const oldIdx = sections.findIndex((s) => s.id === active.id);
      const newIdx = sections.findIndex((s) => s.id === over.id);
      if (oldIdx < 0 || newIdx < 0) return;
      const next = arrayMove(sections, oldIdx, newIdx).map((s) => s.id);
      await reorderSections(activeId, next);
      return;
    }

    // 2) Task 드래그
    if (activeData?.type === "task" && activeData.task) {
      const movedTask = activeData.task;

      // (a) Drop 대상이 섹션 영역(droppable)인 경우 → 섹션 이동
      if (overData?.type === "section") {
        const newSectionId = overData.sectionId ?? null;
        if (newSectionId !== movedTask.sectionId) {
          await moveTaskToSection(movedTask.id, newSectionId);
        }
        return;
      }

      // (b) Drop 대상이 다른 task인 경우 → 같은 섹션 내 reorder
      const overTask = tasks.find((t) => t.id === over.id);
      if (overTask) {
        if (overTask.sectionId !== movedTask.sectionId) {
          // 섹션 변경
          await moveTaskToSection(movedTask.id, overTask.sectionId);
          return;
        }
        // 같은 섹션: 그룹 안에서 순서 변경
        const groupTasks =
          movedTask.sectionId === null
            ? grouped.noSec
            : grouped.bySection.get(movedTask.sectionId) ?? [];
        const oldIdx = groupTasks.findIndex((t) => t.id === movedTask.id);
        const newIdx = groupTasks.findIndex((t) => t.id === overTask.id);
        if (oldIdx < 0 || newIdx < 0 || oldIdx === newIdx) return;
        const reordered = arrayMove(groupTasks, oldIdx, newIdx).map((t) => t.id);
        await reorderTasks(reordered);
      }
    }
  };

  return (
    <div className="flex-1 overflow-auto px-6 py-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        {/* 섹션 미지정 영역 (항상 표시) */}
        <Section section={null} categoryId={activeId} tasks={grouped.noSec} />

        {/* 섹션 목록 (sortable) */}
        <SortableContext
          items={sections.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {sections.map((s) => (
            <Section
              key={s.id}
              section={s}
              categoryId={activeId}
              tasks={grouped.bySection.get(s.id) ?? []}
            />
          ))}
        </SortableContext>

        <AddSectionButton onAdd={(name) => addSection(activeId, name)} />

        <DragOverlay>
          {activeDragTask ? (
            <div className="drag-overlay">
              <TaskItem task={activeDragTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function AddSectionButton({ onAdd }: { onAdd: (name: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="mt-2 px-3 py-2 rounded-lg text-sm
                   text-zinc-500 dark:text-zinc-400
                   hover:bg-zinc-100 dark:hover:bg-zinc-800
                   border border-dashed border-zinc-300 dark:border-zinc-700"
      >
        + 섹션 추가
      </button>
    );
  }

  const commit = () => {
    const v = draft.trim();
    if (v) onAdd(v);
    setDraft("");
    setEditing(false);
  };

  return (
    <input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") {
          setDraft("");
          setEditing(false);
        }
      }}
      placeholder="섹션 이름"
      className="mt-2 px-3 py-2 rounded-lg text-sm outline-none w-64
                 bg-white dark:bg-zinc-900
                 border border-accent focus:ring-2 focus:ring-accent/40"
    />
  );
}
