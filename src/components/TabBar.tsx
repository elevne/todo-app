import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Category } from "../types";
import { useTodoStore } from "../store/todoStore";
import { ConfirmDialog } from "./ConfirmDialog";

export function TabBar() {
  const categories = useTodoStore((s) => s.categories);
  const activeId = useTodoStore((s) => s.activeCategoryId);
  const setActive = useTodoStore((s) => s.setActiveCategory);
  const reorder = useTodoStore((s) => s.reorderCategories);
  const add = useTodoStore((s) => s.addCategory);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = categories.findIndex((c) => c.id === active.id);
    const newIdx = categories.findIndex((c) => c.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const next = arrayMove(categories, oldIdx, newIdx).map((c) => c.id);
    reorder(next);
  };

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext
          items={categories.map((c) => c.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex items-center gap-1">
            {categories.map((c) => (
              <Tab
                key={c.id}
                category={c}
                active={c.id === activeId}
                onClick={() => setActive(c.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <AddTabButton onAdd={(name) => add(name)} />
    </div>
  );
}

function Tab({
  category,
  active,
  onClick,
}: {
  category: Category;
  active: boolean;
  onClick: () => void;
}) {
  const renameCategory = useTodoStore((s) => s.renameCategory);
  const deleteCategory = useTodoStore((s) => s.deleteCategory);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(category.name);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== category.name) {
      renameCategory(category.id, trimmed);
    } else {
      setDraft(category.name);
    }
    setEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onDoubleClick={() => setEditing(true)}
      onClick={onClick}
      className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm cursor-pointer select-none shrink-0
        ${
          active
            ? "bg-accent text-white"
            : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        }`}
      title="더블클릭으로 이름 변경, 드래그로 순서 변경"
    >
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraft(category.name);
              setEditing(false);
            }
          }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="bg-transparent outline-none w-24 text-current"
        />
      ) : (
        <span>{category.name}</span>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setConfirmOpen(true);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="opacity-0 group-hover:opacity-100 hover:text-red-300 text-xs px-1"
        title="카테고리 삭제"
      >
        ✕
      </button>
      <ConfirmDialog
        open={confirmOpen}
        title="카테고리 삭제"
        message={`"${category.name}" 카테고리를 삭제할까요?\n포함된 모든 섹션과 할 일도 함께 삭제됩니다.`}
        confirmLabel="삭제"
        variant="danger"
        onConfirm={() => {
          setConfirmOpen(false);
          deleteCategory(category.id);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

function AddTabButton({ onAdd }: { onAdd: (name: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="ml-2 shrink-0 px-2.5 py-1.5 rounded-lg text-sm
                   bg-zinc-100 hover:bg-zinc-200
                   dark:bg-zinc-800 dark:hover:bg-zinc-700"
        title="카테고리 추가"
      >
        +
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
      placeholder="카테고리 이름"
      className="ml-2 shrink-0 px-2 py-1.5 rounded-lg text-sm w-32 outline-none
                 bg-zinc-100 dark:bg-zinc-800 focus:ring-2 focus:ring-accent"
    />
  );
}
