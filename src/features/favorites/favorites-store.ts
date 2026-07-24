import { create } from 'zustand';

import { useAuthStore } from '@/features/auth/auth-store';
import { fetchIsPremium } from '@/features/profile/use-premium';
import { supabase } from '@/lib/supabase';

/**
 * Favorite places (MVP slice of 13_MVP_SCOPE "Favorites").
 * Until Google Places lands, a place is identified by its title (entity_id).
 */

/** Free tier keeps 20 favorites (25_MONETIZATION: "only soft limits"); Premium has no cap.
 *  Matches the paywall's benefitFavorites copy — change both together. */
const FREE_FAVORITES_LIMIT = 20;

export type ToggleResult = 'added' | 'removed' | 'limit';

interface FavoritesState {
  places: string[];
  loaded: boolean;
  loadFavorites: () => Promise<void>;
  isFavorite: (title: string) => boolean;
  toggleFavorite: (title: string) => Promise<ToggleResult>;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  places: [],
  loaded: false,

  loadFavorites: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;
    const { data, error } = await supabase
      .from('favorites')
      .select('entity_id')
      .eq('entity_type', 'place')
      .order('created_at', { ascending: false });
    if (!error && data) {
      set({ places: data.map((row) => row.entity_id as string), loaded: true });
    }
  },

  isFavorite: (title) => get().places.includes(title),

  toggleFavorite: async (title) => {
    // The soft cap only ever blocks ADDING the 21st — removing always works, and the
    // premium lookup only runs at the boundary so the common case stays instant.
    const before = get().places;
    if (!before.includes(title) && before.length >= FREE_FAVORITES_LIMIT && !(await fetchIsPremium())) {
      return 'limit';
    }

    // Re-read after the possible await — a second tap may have landed meanwhile — and
    // build the add-branch dedup-safe so a double-tap can never insert the title twice.
    const has = get().places.includes(title);
    // Optimistic — favorites must feel instant (09_ANIMATIONS: favorite = light tap).
    set((s) => ({
      places: has ? s.places.filter((p) => p !== title) : [title, ...s.places.filter((p) => p !== title)],
    }));

    const result: ToggleResult = has ? 'removed' : 'added';
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return result; // signed-out: local-only until the offline sync phase

    if (has) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('entity_type', 'place')
        .eq('entity_id', title);
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: userId, entity_type: 'place', entity_id: title });
      if (error && error.code !== '23505') {
        // revert on real failure (23505 = already saved, fine)
        set((s) => ({ places: s.places.filter((p) => p !== title) }));
      }
    }
    return result;
  },
}));
