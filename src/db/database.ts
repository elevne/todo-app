import Database from "@tauri-apps/plugin-sql";
import { nanoid } from "nanoid";
import type { Category, Section, Task } from "../types";

let dbPromise: Promise<Database> | null = null;

function getDb(): Promise<Database> {
  return dbPromise ?? (dbPromise = Database.load("sqlite:todo.db"));
}

interface CategoryRow {
  id: string;
  name: string;
  position: number;
}

interface SectionRow {
  id: string;
  category_id: string;
  name: string;
  position: number;
}

interface TaskRow {
  id: string;
  category_id: string;
  section_id: string | null;
  title: string;
  completed: number;
  position: number;
}

export const db = {
  // Categories ------------------------------------------------------------
  async listCategories(): Promise<Category[]> {
    const d = await getDb();
    const rows = await d.select<CategoryRow[]>(
      "SELECT id, name, position FROM categories ORDER BY position ASC"
    );
    return rows.map((r) => ({ id: r.id, name: r.name, position: r.position }));
  },

  async createCategory(name: string): Promise<Category> {
    const d = await getDb();
    const max = await d.select<{ max: number | null }[]>(
      "SELECT MAX(position) as max FROM categories"
    );
    const position = (max[0]?.max ?? -1) + 1;
    const id = nanoid();
    await d.execute(
      "INSERT INTO categories (id, name, position) VALUES (?, ?, ?)",
      [id, name, position]
    );
    return { id, name, position };
  },

  async renameCategory(id: string, name: string) {
    const d = await getDb();
    await d.execute("UPDATE categories SET name = ? WHERE id = ?", [name, id]);
  },

  async deleteCategory(id: string) {
    const d = await getDb();
    await d.execute("DELETE FROM categories WHERE id = ?", [id]);
  },

  async reorderCategories(orderedIds: string[]) {
    const d = await getDb();
    for (let i = 0; i < orderedIds.length; i++) {
      await d.execute("UPDATE categories SET position = ? WHERE id = ?", [
        i,
        orderedIds[i],
      ]);
    }
  },

  // Sections --------------------------------------------------------------
  async listSections(categoryId: string): Promise<Section[]> {
    const d = await getDb();
    const rows = await d.select<SectionRow[]>(
      "SELECT id, category_id, name, position FROM sections WHERE category_id = ? ORDER BY position ASC",
      [categoryId]
    );
    return rows.map((r) => ({
      id: r.id,
      categoryId: r.category_id,
      name: r.name,
      position: r.position,
    }));
  },

  async createSection(categoryId: string, name: string): Promise<Section> {
    const d = await getDb();
    const max = await d.select<{ max: number | null }[]>(
      "SELECT MAX(position) as max FROM sections WHERE category_id = ?",
      [categoryId]
    );
    const position = (max[0]?.max ?? -1) + 1;
    const id = nanoid();
    await d.execute(
      "INSERT INTO sections (id, category_id, name, position) VALUES (?, ?, ?, ?)",
      [id, categoryId, name, position]
    );
    return { id, categoryId, name, position };
  },

  async renameSection(id: string, name: string) {
    const d = await getDb();
    await d.execute("UPDATE sections SET name = ? WHERE id = ?", [name, id]);
  },

  async deleteSection(id: string) {
    const d = await getDb();
    await d.execute("DELETE FROM sections WHERE id = ?", [id]);
  },

  async reorderSections(categoryId: string, orderedIds: string[]) {
    const d = await getDb();
    for (let i = 0; i < orderedIds.length; i++) {
      await d.execute(
        "UPDATE sections SET position = ? WHERE id = ? AND category_id = ?",
        [i, orderedIds[i], categoryId]
      );
    }
  },

  // Tasks -----------------------------------------------------------------
  async listTasks(categoryId: string): Promise<Task[]> {
    const d = await getDb();
    const rows = await d.select<TaskRow[]>(
      "SELECT id, category_id, section_id, title, completed, position FROM tasks WHERE category_id = ? ORDER BY position ASC",
      [categoryId]
    );
    return rows.map((r) => ({
      id: r.id,
      categoryId: r.category_id,
      sectionId: r.section_id,
      title: r.title,
      completed: r.completed === 1,
      position: r.position,
    }));
  },

  async createTask(
    categoryId: string,
    sectionId: string | null,
    title: string
  ): Promise<Task> {
    const d = await getDb();
    const max = await d.select<{ max: number | null }[]>(
      sectionId === null
        ? "SELECT MAX(position) as max FROM tasks WHERE category_id = ? AND section_id IS NULL"
        : "SELECT MAX(position) as max FROM tasks WHERE category_id = ? AND section_id = ?",
      sectionId === null ? [categoryId] : [categoryId, sectionId]
    );
    const position = (max[0]?.max ?? -1) + 1;
    const id = nanoid();
    await d.execute(
      "INSERT INTO tasks (id, category_id, section_id, title, position) VALUES (?, ?, ?, ?, ?)",
      [id, categoryId, sectionId, title, position]
    );
    return {
      id,
      categoryId,
      sectionId,
      title,
      completed: false,
      position,
    };
  },

  async updateTask(id: string, patch: Partial<Pick<Task, "title" | "completed" | "sectionId">>) {
    const d = await getDb();
    const sets: string[] = [];
    const args: unknown[] = [];
    if (patch.title !== undefined) {
      sets.push("title = ?");
      args.push(patch.title);
    }
    if (patch.completed !== undefined) {
      sets.push("completed = ?");
      args.push(patch.completed ? 1 : 0);
    }
    if (patch.sectionId !== undefined) {
      sets.push("section_id = ?");
      args.push(patch.sectionId);
    }
    if (sets.length === 0) return;
    args.push(id);
    await d.execute(`UPDATE tasks SET ${sets.join(", ")} WHERE id = ?`, args);
  },

  async deleteTask(id: string) {
    const d = await getDb();
    await d.execute("DELETE FROM tasks WHERE id = ?", [id]);
  },

  async reorderTasks(orderedIds: string[]) {
    const d = await getDb();
    for (let i = 0; i < orderedIds.length; i++) {
      await d.execute("UPDATE tasks SET position = ? WHERE id = ?", [
        i,
        orderedIds[i],
      ]);
    }
  },

  async moveTaskToSection(taskId: string, sectionId: string | null) {
    const d = await getDb();
    await d.execute("UPDATE tasks SET section_id = ? WHERE id = ?", [
      sectionId,
      taskId,
    ]);
  },
};
