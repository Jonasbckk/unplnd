import type { GeneratedPlan } from '@/features/planner/types';

// from().insert().select().single() resolves to { data, error }.
const mockSingle = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      insert: () => ({ select: () => ({ single: mockSingle }) }),
    }),
  },
}));
jest.mock('@/features/auth/auth-store', () => ({
  useAuthStore: { getState: () => ({ user: { id: 'u1' } }) },
}));

import { useAlbumsStore } from './albums-store';

const plan = { title: 'Test evening', stops: [] } as unknown as GeneratedPlan;
const serverRow = (id: string) => ({
  id,
  title: 'Test evening',
  city: 'Berlin',
  date: '2026-07-05',
  mood: 'Party',
  weather: '',
  cover_color: '#000',
  timeline: [],
  photo_count: 0,
  favorite: false,
  note: null,
  plan_id: null,
});

beforeEach(() => {
  useAlbumsStore.setState({ albums: [], outbox: [] });
  mockSingle.mockReset();
});

describe('albums local-first + offline outbox', () => {
  it('offline: keeps the memory locally and queues it — never lost', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'offline' } });
    const id = await useAlbumsStore.getState().createFromPlan(plan, 'Party', 'Berlin', null);
    const { albums, outbox } = useAlbumsStore.getState();
    expect(id).toMatch(/^local-/);
    expect(albums).toHaveLength(1);
    expect(albums[0].pending).toBe(true);
    expect(outbox).toHaveLength(1);
  });

  it('online: creates the album synced, nothing queued', async () => {
    mockSingle.mockResolvedValue({ data: serverRow('real-1'), error: null });
    const id = await useAlbumsStore.getState().createFromPlan(plan, 'Party', 'Berlin', null);
    const { albums, outbox } = useAlbumsStore.getState();
    expect(id).toBe('real-1');
    expect(albums).toHaveLength(1);
    expect(albums[0].pending).toBeFalsy();
    expect(outbox).toHaveLength(0);
  });

  it('flushOutbox syncs a queued album on reconnect (temp id → real id)', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'offline' } });
    const tempId = await useAlbumsStore.getState().createFromPlan(plan, 'Party', 'Berlin', null);
    expect(useAlbumsStore.getState().outbox).toHaveLength(1);

    mockSingle.mockResolvedValueOnce({ data: serverRow('real-9'), error: null });
    await useAlbumsStore.getState().flushOutbox();

    const { albums, outbox } = useAlbumsStore.getState();
    expect(outbox).toHaveLength(0);
    expect(albums.find((a) => a.id === tempId)).toBeUndefined();
    expect(albums.find((a) => a.id === 'real-9')?.pending).toBeFalsy();
  });
});
