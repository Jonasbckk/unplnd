import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useAuthStore } from '@/features/auth/auth-store';
import type { GeneratedPlan } from '@/features/planner/types';
import { supabase } from '@/lib/supabase';
import type { Album, AlbumMood } from './types';

const MOOD_COLORS: Record<string, string> = {
  Romantic: '#C97B63',
  Relaxed: '#7A8F63',
  Party: '#E88C5A',
  Cozy: '#8A6D5A',
  Adventure: '#6D9DC5',
  Luxury: '#B08D57',
  Drinks: '#C97B63',
  Food: '#E88C5A',
  Nature: '#7A8F63',
};

const ALBUM_MOODS: AlbumMood[] = ['Romantic', 'Relaxed', 'Party', 'Cozy', 'Adventure', 'Luxury'];

function moodColor(mood?: string): string {
  return MOOD_COLORS[mood ?? ''] ?? '#C97B63';
}

function normalizeMood(mood?: string): AlbumMood {
  return ALBUM_MOODS.includes(mood as AlbumMood) ? (mood as AlbumMood) : 'Relaxed';
}

interface AlbumRow {
  id: string;
  title: string;
  city: string | null;
  date: string;
  mood: string | null;
  weather: string | null;
  cover_color: string | null;
  timeline: Album['timeline'] | null;
  photo_count: number | null;
  favorite: boolean | null;
  note: string | null;
  plan_id: string | null;
}

function rowToAlbum(row: AlbumRow): Album {
  return {
    id: row.id,
    title: row.title,
    city: row.city ?? '',
    date: row.date,
    mood: normalizeMood(row.mood ?? undefined),
    weather: row.weather ?? '',
    coverColor: row.cover_color ?? '#C97B63',
    timeline: row.timeline ?? [],
    photoCount: row.photo_count ?? 0,
    favorite: Boolean(row.favorite),
    note: row.note ?? undefined,
    planId: row.plan_id ?? undefined,
  };
}

/** A finished evening waiting to become a server album (queued while offline). */
interface PendingAlbum {
  tempId: string;
  plan: GeneratedPlan;
  mood?: string;
  city: string;
  planId: string | null;
}

/** Insert a finished evening as an album row. Returns the created Album, or null if the write fails (offline). */
async function insertAlbumRow(
  plan: GeneratedPlan,
  mood: string | undefined,
  city: string,
  planId: string | null,
): Promise<Album | null> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return null;
  const { data, error } = await supabase
    .from('albums')
    .insert({
      owner_id: userId,
      title: plan.title,
      city,
      mood: mood ?? null,
      weather: '22°C · Clear sky',
      cover_color: moodColor(mood),
      timeline: plan.stops,
      photo_count: 0,
      favorite: false,
      plan_id: planId ?? null,
    })
    .select('*')
    .single();
  if (error || !data) return null;
  return rowToAlbum(data as AlbumRow);
}

interface AlbumsState {
  albums: Album[];
  /** Finished evenings not yet synced to the server (offline queue). */
  outbox: PendingAlbum[];
  loading: boolean;
  loaded: boolean;
  hasHydrated: boolean;
  loadAlbums: () => Promise<void>;
  createFromPlan: (
    plan: GeneratedPlan,
    mood: string | undefined,
    city: string,
    planId?: string | null,
  ) => Promise<string | null>;
  /** Retry any queued albums (call on reconnect / launch). */
  flushOutbox: () => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  updateNote: (id: string, note: string) => Promise<void>;
  /** Hard delete (removes photos too). `deletePublished` also removes the community publication. */
  deleteAlbum: (id: string, deletePublished: boolean) => Promise<void>;
  setHasHydrated: (value: boolean) => void;
}

export const useAlbumsStore = create<AlbumsState>()(
  persist(
    (set, get) => ({
      albums: [],
      outbox: [],
      loading: false,
      loaded: false,
      hasHydrated: false,

      loadAlbums: async () => {
        set({ loading: true });
        const { data, error } = await supabase
          .from('albums')
          .select('*')
          .order('date', { ascending: false });
        if (!error && data) {
          // Keep any not-yet-synced local albums on top; the rest come from the server.
          const fetched = (data as AlbumRow[]).map(rowToAlbum);
          const pending = get().albums.filter((a) => a.pending);
          set({ albums: [...pending, ...fetched], loaded: true });
        }
        // Offline (error) → keep the cached albums we already have. Try to drain the queue.
        set({ loading: false });
        void get().flushOutbox();
      },

      createFromPlan: async (plan, mood, city, planId) => {
        const userId = useAuthStore.getState().user?.id;
        if (!userId) return null;

        // Local-first: the memory shows immediately, so a finished evening is never lost offline.
        const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const localAlbum: Album = {
          id: tempId,
          title: plan.title,
          city,
          date: new Date().toISOString(),
          mood: normalizeMood(mood),
          weather: '22°C · Clear sky',
          coverColor: moodColor(mood),
          timeline: plan.stops,
          photoCount: 0,
          favorite: false,
          planId: planId ?? undefined,
          pending: true,
        };
        set((s) => ({ albums: [localAlbum, ...s.albums] }));

        const synced = await insertAlbumRow(plan, mood, city, planId ?? null);
        if (synced) {
          set((s) => ({ albums: s.albums.map((a) => (a.id === tempId ? synced : a)) }));
          return synced.id;
        }
        // Offline / failed → queue it and keep the local album; it'll sync on reconnect.
        set((s) => ({ outbox: [...s.outbox, { tempId, plan, mood, city, planId: planId ?? null }] }));
        return tempId;
      },

      flushOutbox: async () => {
        if (!useAuthStore.getState().user?.id) return;
        const jobs = get().outbox;
        for (const job of jobs) {
          const synced = await insertAlbumRow(job.plan, job.mood, job.city, job.planId);
          if (!synced) break; // still offline — stop and retry next time
          set((s) => ({
            albums: s.albums.map((a) => (a.id === job.tempId ? synced : a)),
            outbox: s.outbox.filter((o) => o.tempId !== job.tempId),
          }));
        }
      },

      toggleFavorite: async (id) => {
        const current = get().albums.find((a) => a.id === id);
        if (!current) return;
        const next = !current.favorite;
        // optimistic update
        set((s) => ({ albums: s.albums.map((a) => (a.id === id ? { ...a, favorite: next } : a)) }));
        if (current.pending) return; // not on the server yet — local only
        const { error } = await supabase.from('albums').update({ favorite: next }).eq('id', id);
        if (error) {
          set((s) => ({ albums: s.albums.map((a) => (a.id === id ? { ...a, favorite: current.favorite } : a)) }));
        }
      },

      updateNote: async (id, note) => {
        const trimmed = note.trim();
        const current = get().albums.find((a) => a.id === id);
        set((s) => ({ albums: s.albums.map((a) => (a.id === id ? { ...a, note: trimmed || undefined } : a)) }));
        if (current?.pending) return; // local only until synced
        await supabase.from('albums').update({ note: trimmed || null }).eq('id', id);
      },

      deleteAlbum: async (id, deletePublished) => {
        const current = get().albums.find((a) => a.id === id);
        // Drop it locally + remove any queued job first.
        set((s) => ({ albums: s.albums.filter((a) => a.id !== id), outbox: s.outbox.filter((o) => o.tempId !== id) }));
        if (current?.pending) return; // never reached the server — nothing to clean up

        if (deletePublished) {
          await supabase.from('published_plans').delete().eq('source_album_id', id);
        }
        // Clean up stored photos (album_photos rows cascade with the album row).
        const { data: photoRows } = await supabase.from('album_photos').select('storage_path').eq('album_id', id);
        const paths = (photoRows ?? []).map((row) => row.storage_path as string);
        if (paths.length > 0) {
          await supabase.storage.from('photos').remove(paths);
        }
        await supabase.from('albums').delete().eq('id', id);
      },

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'unplnd-albums',
      storage: createJSONStorage(() => AsyncStorage),
      // Cache the memories + the offline queue; never persist transient loading flags.
      partialize: (s) => ({ albums: s.albums, outbox: s.outbox }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
