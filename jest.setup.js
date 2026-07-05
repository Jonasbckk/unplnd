// The native AsyncStorage module isn't available under Jest — use the library's official mock.
// Many modules import it transitively (supabase client, persisted stores).
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
