import { create } from 'zustand';

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
  };
}

interface AlbumsState {
  albums: Album[];
  loading: boolean;
  loaded: boolean;
  loadAlbums: () => Promise<void>;
  createFromPlan: (plan: GeneratedPlan, mood: string | undefined, city: string) => Promise<string | null>;
  toggleFavorite: (id: string) => Promise<void>;
  updateNote: (id: string, note: string) => Promise<void>;
  /** Hard delete for MVP (soft delete comes with the offline/sync phase) — removes photos too. */
  deleteAlbum: (id: string) => Promise<void>;
}

export const useAlbumsStore = create<AlbumsState>((set, get) => ({
  albums: [],
  loading: false,
  loaded: false,

  loadAlbums: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .order('date', { ascending: false });
    if (!error && data) {
      set({ albums: (data as AlbumRow[]).map(rowToAlbum), loaded: true });
    }
    set({ loading: false });
  },

  createFromPlan: async (plan, mood, city) => {
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
      })
      .select('*')
      .single();

    if (error || !data) return null;
    const album = rowToAlbum(data as AlbumRow);
    set((s) => ({ albums: [album, ...s.albums] }));
    return album.id;
  },

  toggleFavorite: async (id) => {
    const current = get().albums.find((a) => a.id === id);
    if (!current) return;
    const next = !current.favorite;
    // optimistic update
    set((s) => ({ albums: s.albums.map((a) => (a.id === id ? { ...a, favorite: next } : a)) }));
    const { error } = await supabase.from('albums').update({ favorite: next }).eq('id', id);
    if (error) {
      set((s) => ({ albums: s.albums.map((a) => (a.id === id ? { ...a, favorite: current.favorite } : a)) }));
    }
  },

  updateNote: async (id, note) => {
    const trimmed = note.trim();
    set((s) => ({ albums: s.albums.map((a) => (a.id === id ? { ...a, note: trimmed || undefined } : a)) }));
    await supabase.from('albums').update({ note: trimmed || null }).eq('id', id);
  },

  deleteAlbum: async (id) => {
    // Clean up stored photos first (album_photos rows cascade with the album row).
    const { data: photoRows } = await supabase.from('album_photos').select('storage_path').eq('album_id', id);
    const paths = (photoRows ?? []).map((row) => row.storage_path as string);
    if (paths.length > 0) {
      await supabase.storage.from('photos').remove(paths);
    }
    await supabase.from('albums').delete().eq('id', id);
    set((s) => ({ albums: s.albums.filter((a) => a.id !== id) }));
  },
}));
