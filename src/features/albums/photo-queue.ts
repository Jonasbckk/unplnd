import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useAuthStore } from '@/features/auth/auth-store';
import { supabase } from '@/lib/supabase';

export interface PhotoJob {
  id: string;
  albumId: string;
  uri: string;
  mimeType: string;
}

interface PhotoQueueState {
  jobs: PhotoJob[];
  hasHydrated: boolean;
  /** Queue picked photos for an album. Returns how many were queued. */
  enqueue: (albumId: string, assets: { uri: string; mimeType?: string }[]) => number;
  flush: () => Promise<void>;
  removeForAlbum: (albumId: string) => void;
  setHasHydrated: (value: boolean) => void;
}

/**
 * Offline queue for album photos. Picked images are held (by their local URI) until they can be
 * uploaded to the private bucket — so adding photos works with no connection and syncs on reconnect.
 * Local albums (temp id) are skipped until they themselves sync. Unreadable local files are dropped.
 */
export const usePhotoQueue = create<PhotoQueueState>()(
  persist(
    (set, get) => ({
      jobs: [],
      hasHydrated: false,

      enqueue: (albumId, assets) => {
        const stamp = Date.now();
        const jobs: PhotoJob[] = assets
          .filter((a) => a.uri)
          .map((a, i) => ({
            id: `pj-${stamp}-${i}-${Math.random().toString(36).slice(2, 6)}`,
            albumId,
            uri: a.uri,
            mimeType: a.mimeType ?? 'image/jpeg',
          }));
        set((s) => ({ jobs: [...s.jobs, ...jobs] }));
        return jobs.length;
      },

      flush: async () => {
        const userId = useAuthStore.getState().user?.id;
        if (!userId || get().jobs.length === 0) return;

        const byAlbum = new Map<string, PhotoJob[]>();
        for (const j of get().jobs) {
          const arr = byAlbum.get(j.albumId);
          if (arr) arr.push(j);
          else byAlbum.set(j.albumId, [j]);
        }

        for (const [albumId, jobs] of byAlbum) {
          if (albumId.startsWith('local-')) continue; // album not on the server yet — wait
          const { count, error: countErr } = await supabase
            .from('album_photos')
            .select('id', { count: 'exact', head: true })
            .eq('album_id', albumId);
          if (countErr) continue; // offline — try again next time
          let order = count ?? 0;
          let uploadedAny = false;

          for (const job of jobs) {
            // Read the local file first. If it's gone, we can never recover it — drop the job.
            let body: ArrayBuffer;
            try {
              const res = await fetch(job.uri);
              body = await res.arrayBuffer();
            } catch {
              set((s) => ({ jobs: s.jobs.filter((j) => j.id !== job.id) }));
              continue;
            }
            // Upload (network). On failure we're offline → stop and retry this album later.
            let ok = false;
            try {
              const ext = job.mimeType.split('/')[1] || 'jpg';
              const path = `${userId}/${albumId}/${Date.now()}-${order}.${ext}`;
              const { error: upErr } = await supabase.storage.from('photos').upload(path, body, { contentType: job.mimeType });
              if (!upErr) {
                const { error: rowErr } = await supabase
                  .from('album_photos')
                  .insert({ album_id: albumId, storage_path: path, sort_order: order });
                ok = !rowErr;
              }
            } catch {
              ok = false;
            }
            if (!ok) break;
            order += 1;
            uploadedAny = true;
            set((s) => ({ jobs: s.jobs.filter((j) => j.id !== job.id) }));
          }

          if (uploadedAny) {
            await supabase.from('albums').update({ photo_count: order }).eq('id', albumId);
          }
        }
      },

      removeForAlbum: (albumId) => set((s) => ({ jobs: s.jobs.filter((j) => j.albumId !== albumId) })),

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'unplnd-photo-queue',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ jobs: s.jobs }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
