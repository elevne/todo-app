export interface Category {
  id: string;
  name: string;
  position: number;
}

export interface Section {
  id: string;
  categoryId: string;
  name: string;
  position: number;
}

export interface Task {
  id: string;
  categoryId: string;
  sectionId: string | null;
  title: string;
  completed: boolean;
  position: number;
}

export type Theme = "light" | "dark";
