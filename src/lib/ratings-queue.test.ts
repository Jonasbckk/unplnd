// Chained supabase mock: from().update().eq() and from().upsert() resolve to { error }.
const mockUpdateEq = jest.fn();
const mockUpsert = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      update: () => ({ eq: mockUpdateEq }),
      upsert: mockUpsert,
    }),
  },
}));
jest.mock('@/features/auth/auth-store', () => ({
  useAuthStore: { getState: () => ({ user: { id: 'u1' } }) },
}));

import { useRatingsQueue } from './ratings-queue';

beforeEach(() => {
  useRatingsQueue.setState({ jobs: [] });
  mockUpdateEq.mockReset();
  mockUpsert.mockReset();
});

describe('ratings offline queue', () => {
  it('dedupes plan ratings — latest wins', () => {
    useRatingsQueue.getState().enqueuePlan('p1', 3);
    useRatingsQueue.getState().enqueuePlan('p1', 5);
    const { jobs } = useRatingsQueue.getState();
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({ kind: 'plan', planRowId: 'p1', rating: 5 });
  });

  it('flush clears jobs when the writes succeed', async () => {
    mockUpdateEq.mockResolvedValue({ error: null });
    mockUpsert.mockResolvedValue({ error: null });
    useRatingsQueue.getState().enqueuePlan('p1', 4);
    useRatingsQueue.getState().enqueuePlace('place1', 'Bar', 5);
    await useRatingsQueue.getState().flush();
    expect(useRatingsQueue.getState().jobs).toHaveLength(0);
  });

  it('flush keeps the jobs when offline (write errors)', async () => {
    mockUpdateEq.mockResolvedValue({ error: { message: 'offline' } });
    useRatingsQueue.getState().enqueuePlan('p1', 4);
    await useRatingsQueue.getState().flush();
    expect(useRatingsQueue.getState().jobs).toHaveLength(1);
  });
});
