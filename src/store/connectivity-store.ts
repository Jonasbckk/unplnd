import NetInfo from '@react-native-community/netinfo';
import { create } from 'zustand';

interface ConnectivityState {
  /** Optimistic default: assume online until told otherwise (never block on startup). */
  isOnline: boolean;
  /** Subscribe to connectivity changes. Returns an unsubscribe function. Call once in the root. */
  init: () => () => void;
}

export const useConnectivityStore = create<ConnectivityState>((set) => ({
  isOnline: true,
  init: () => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // reachability can be null while unknown — only treat an explicit false as offline.
      const online = state.isConnected !== false && state.isInternetReachable !== false;
      set({ isOnline: online });
    });
    return unsubscribe;
  },
}));
