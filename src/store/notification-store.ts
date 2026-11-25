import { create } from "zustand";

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  level: "info" | "success" | "warning";
  link: string | null;
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  unread: number;
  items: NotificationItem[];
  loading: boolean;
  /** cheap poll used by the bell */
  refreshCount: () => Promise<void>;
  /** latest few, shown in the bell dropdown */
  loadLatest: () => Promise<void>;
  setUnread: (n: number) => void;
  markRead: (ids: string[]) => Promise<void>;
  markAllRead: () => Promise<void>;
  reset: () => void;
}

async function api<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) return null;
    const json = await res.json();
    return json.ok ? (json.data as T) : null;
  } catch {
    return null;
  }
}

const post = (url: string, body: unknown) =>
  api<{ updated: number; unreadCount: number }>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unread: 0,
  items: [],
  loading: false,

  refreshCount: async () => {
    const data = await api<{ count: number }>("/api/notifications/unread-count");
    if (data) set({ unread: data.count });
  },

  loadLatest: async () => {
    set({ loading: true });
    const data = await api<{ items: NotificationItem[]; unreadCount: number }>("/api/notifications?limit=6");
    set(data ? { items: data.items, unread: data.unreadCount, loading: false } : { loading: false });
  },

  setUnread: (n) => set({ unread: n }),

  markRead: async (ids) => {
    // Optimistic: update the UI now, reconcile with the server's count after.
    set((s) => ({
      items: s.items.map((i) => (ids.includes(i.id) ? { ...i, read: true } : i)),
      unread: Math.max(0, s.unread - s.items.filter((i) => ids.includes(i.id) && !i.read).length),
    }));
    const res = await post("/api/notifications/read", { ids });
    if (res) set({ unread: res.unreadCount });
  },

  markAllRead: async () => {
    set((s) => ({ items: s.items.map((i) => ({ ...i, read: true })), unread: 0 }));
    const res = await post("/api/notifications/read", { all: true });
    if (res) set({ unread: res.unreadCount });
    else void get().refreshCount();
  },

  reset: () => set({ unread: 0, items: [], loading: false }),
}));
