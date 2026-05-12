import { create } from "zustand";
import { db } from "../db/database";
import type { Category, Section, Task } from "../types";

interface State {
  categories: Category[];
  sections: Section[];
  tasks: Task[];
  activeCategoryId: string | null;
  loaded: boolean;

  init: () => Promise<void>;
  setActiveCategory: (id: string | null) => Promise<void>;

  addCategory: (name: string) => Promise<void>;
  renameCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (orderedIds: string[]) => Promise<void>;

  addSection: (categoryId: string, name: string) => Promise<void>;
  renameSection: (id: string, name: string) => Promise<void>;
  deleteSection: (id: string) => Promise<void>;
  reorderSections: (categoryId: string, orderedIds: string[]) => Promise<void>;

  addTask: (
    categoryId: string,
    sectionId: string | null,
    title: string
  ) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  renameTask: (id: string, title: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  reorderTasks: (orderedIds: string[]) => Promise<void>;
  moveTaskToSection: (taskId: string, sectionId: string | null) => Promise<void>;

  reloadCategoryData: (categoryId: string) => Promise<void>;
}

export const useTodoStore = create<State>((set, get) => ({
  categories: [],
  sections: [],
  tasks: [],
  activeCategoryId: null,
  loaded: false,

  init: async () => {
    try {
      const categories = await db.listCategories();
      let activeId = categories[0]?.id ?? null;
      let sections: Section[] = [];
      let tasks: Task[] = [];
      if (activeId) {
        sections = await db.listSections(activeId);
        tasks = await db.listTasks(activeId);
      }
      set({
        categories,
        sections,
        tasks,
        activeCategoryId: activeId,
        loaded: true,
      });
    } catch (e) {
      // Tauri 런타임 부재 (브라우저 미리보기) 등 — UI는 그대로 띄움
      console.warn("DB unavailable, running without persistence:", e);
      set({ loaded: true });
    }
  },

  setActiveCategory: async (id) => {
    set({ activeCategoryId: id });
    if (id) {
      const sections = await db.listSections(id);
      const tasks = await db.listTasks(id);
      set({ sections, tasks });
    } else {
      set({ sections: [], tasks: [] });
    }
  },

  addCategory: async (name) => {
    const cat = await db.createCategory(name);
    const list = [...get().categories, cat];
    set({ categories: list });
    if (!get().activeCategoryId) {
      await get().setActiveCategory(cat.id);
    }
  },

  renameCategory: async (id, name) => {
    await db.renameCategory(id, name);
    set({
      categories: get().categories.map((c) =>
        c.id === id ? { ...c, name } : c
      ),
    });
  },

  deleteCategory: async (id) => {
    await db.deleteCategory(id);
    const remaining = get().categories.filter((c) => c.id !== id);
    set({ categories: remaining });
    if (get().activeCategoryId === id) {
      const next = remaining[0]?.id ?? null;
      await get().setActiveCategory(next);
    }
  },

  reorderCategories: async (orderedIds) => {
    const map = new Map(get().categories.map((c) => [c.id, c]));
    const next = orderedIds
      .map((id, i) => {
        const c = map.get(id);
        return c ? { ...c, position: i } : null;
      })
      .filter((c): c is Category => c !== null);
    set({ categories: next });
    await db.reorderCategories(orderedIds);
  },

  addSection: async (categoryId, name) => {
    const sec = await db.createSection(categoryId, name);
    if (get().activeCategoryId === categoryId) {
      set({ sections: [...get().sections, sec] });
    }
  },

  renameSection: async (id, name) => {
    await db.renameSection(id, name);
    set({
      sections: get().sections.map((s) => (s.id === id ? { ...s, name } : s)),
    });
  },

  deleteSection: async (id) => {
    await db.deleteSection(id);
    set({
      sections: get().sections.filter((s) => s.id !== id),
      // 섹션 삭제 시 그 섹션 소속 task들의 sectionId가 null로 바뀜 (DB SET NULL)
      tasks: get().tasks.map((t) =>
        t.sectionId === id ? { ...t, sectionId: null } : t
      ),
    });
  },

  reorderSections: async (categoryId, orderedIds) => {
    const map = new Map(get().sections.map((s) => [s.id, s]));
    const next = orderedIds
      .map((id, i) => {
        const s = map.get(id);
        return s ? { ...s, position: i } : null;
      })
      .filter((s): s is Section => s !== null);
    set({ sections: next });
    await db.reorderSections(categoryId, orderedIds);
  },

  addTask: async (categoryId, sectionId, title) => {
    const task = await db.createTask(categoryId, sectionId, title);
    if (get().activeCategoryId === categoryId) {
      set({ tasks: [...get().tasks, task] });
    }
  },

  toggleTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    const completed = !task.completed;
    await db.updateTask(id, { completed });
    set({
      tasks: get().tasks.map((t) => (t.id === id ? { ...t, completed } : t)),
    });
  },

  renameTask: async (id, title) => {
    await db.updateTask(id, { title });
    set({
      tasks: get().tasks.map((t) => (t.id === id ? { ...t, title } : t)),
    });
  },

  deleteTask: async (id) => {
    await db.deleteTask(id);
    set({ tasks: get().tasks.filter((t) => t.id !== id) });
  },

  reorderTasks: async (orderedIds) => {
    const map = new Map(get().tasks.map((t) => [t.id, t]));
    // 순서를 받은 id에 한해 위치 재할당, 다른 task는 그대로
    const reordered = orderedIds.map((id, i) => {
      const t = map.get(id);
      return t ? { ...t, position: i } : null;
    });
    const updatedIds = new Set(orderedIds);
    const others = get().tasks.filter((t) => !updatedIds.has(t.id));
    const next = [...reordered.filter((t): t is Task => t !== null), ...others];
    set({ tasks: next });
    await db.reorderTasks(orderedIds);
  },

  moveTaskToSection: async (taskId, sectionId) => {
    await db.moveTaskToSection(taskId, sectionId);
    set({
      tasks: get().tasks.map((t) =>
        t.id === taskId ? { ...t, sectionId } : t
      ),
    });
  },

  reloadCategoryData: async (categoryId) => {
    const sections = await db.listSections(categoryId);
    const tasks = await db.listTasks(categoryId);
    set({ sections, tasks });
  },
}));
