import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: number;
  type: "calendar" | "task" | "message" | "system";
  isRead: boolean;
}

interface NotificationsState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'time'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      notifications: [
        {
          id: "1",
          title: "System Update",
          message: "Welcome to your new workspace!",
          time: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
          type: "system",
          isRead: false,
        }
      ],
      addNotification: (notif) => set((state) => ({
        notifications: [
          {
            ...notif,
            id: crypto.randomUUID(),
            time: Date.now(),
            isRead: false,
          },
          ...state.notifications,
        ],
      })),
      markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map((n) => 
          n.id === id ? { ...n, isRead: true } : n
        ),
      })),
      markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      })),
      deleteNotification: (id) => set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      })),
    }),
    {
      name: 'notifications-storage',
    }
  )
);
