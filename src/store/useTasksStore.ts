import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useNotificationsStore } from './useNotificationsStore';

export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate?: string;
  createdAt: number;
}

interface TasksState {
  tasks: Task[];
  addTask: (title: string, status?: TaskStatus, dueDate?: string) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
}

export const useTasksStore = create<TasksState>()(
  persist(
    (set, get) => ({
      tasks: [],
      addTask: (title, status = 'todo', dueDate) => {
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              id: crypto.randomUUID(),
              title,
              status,
              dueDate,
              createdAt: Date.now(),
            },
          ],
        }));
        useNotificationsStore.getState().addNotification({
          title: "New Task Created",
          message: `Task "${title}" was successfully created.`,
          type: "task"
        });
      },
      updateTaskStatus: (id, status) => {
        const taskName = get().tasks.find((t) => t.id === id)?.title;
        set((state) => ({
          tasks: state.tasks.map((t) => t.id === id ? { ...t, status } : t),
        }));
        
        if (status === 'completed' && taskName) {
           useNotificationsStore.getState().addNotification({
              title: "Task Completed",
              message: `Task "${taskName}" was marked as completed.`,
              type: "task"
           });
        }
      },
      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map((t) => t.id === id ? { ...t, ...updates } : t),
      })),
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      })),
    }),
    {
      name: 'tasks-storage',
    }
  )
);
