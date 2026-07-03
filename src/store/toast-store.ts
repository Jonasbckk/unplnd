import { create } from 'zustand';

interface ToastState {
  message: string | null;
  show: (message: string) => void;
  hide: () => void;
}

let timer: ReturnType<typeof setTimeout> | null = null;

/** One transient toast at a time — a gentle confirmation, never a stack of noise (12_IA). */
export const useToastStore = create<ToastState>((set) => ({
  message: null,
  show: (message) => {
    if (timer) clearTimeout(timer);
    set({ message });
    timer = setTimeout(() => set({ message: null }), 2600);
  },
  hide: () => {
    if (timer) clearTimeout(timer);
    set({ message: null });
  },
}));

/** Fire-and-forget helper: `toast('Album gelöscht')`. */
export function toast(message: string): void {
  useToastStore.getState().show(message);
}
