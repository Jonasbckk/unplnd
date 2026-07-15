import {
  currentTierLevel,
  effectiveVerifyLevel,
  nextTier,
  tierByLevel,
  tierMet,
  tierProgress,
  TIERS,
  type VerifyMetrics,
} from './verification';

const ZERO: VerifyMetrics = {
  eveningsCreated: 0,
  published: 0,
  ownPlans: 0,
  streakDays: 0,
  connections: 0,
  ratingsReceived: 0,
  topPlans: 0,
};
const metrics = (o: Partial<VerifyMetrics>): VerifyMetrics => ({ ...ZERO, ...o });

describe('verification tiers', () => {
  it('no progress → level 0, next tier is verified (1)', () => {
    expect(currentTierLevel(ZERO)).toBe(0);
    expect(nextTier(ZERO)?.level).toBe(1);
    expect(nextTier(ZERO)?.id).toBe('verified');
  });

  it('meeting tier 1 exactly → level 1, next is tier 2', () => {
    const m = metrics({ eveningsCreated: 2, published: 1, streakDays: 2 });
    expect(currentTierLevel(m)).toBe(1);
    expect(nextTier(m)?.level).toBe(2);
  });

  it('one short of a requirement does not reach the tier', () => {
    const m = metrics({ eveningsCreated: 1, published: 1, streakDays: 2 }); // eveningsCreated 1 < 2
    expect(tierMet(m, TIERS[0])).toBe(false);
    expect(currentTierLevel(m)).toBe(0);
  });

  it('tiers are cumulative — meeting tier 3 implies 1 and 2', () => {
    const m = metrics({ eveningsCreated: 12, published: 6, ownPlans: 1, streakDays: 10 });
    expect(currentTierLevel(m)).toBe(3);
    expect(tierMet(m, TIERS[0])).toBe(true);
    expect(tierMet(m, TIERS[1])).toBe(true);
  });

  it('meeting the top tier → level 5, no next tier', () => {
    const m = metrics({
      eveningsCreated: 50,
      published: 25,
      ownPlans: 6,
      streakDays: 45,
      connections: 60,
      ratingsReceived: 150,
      topPlans: 3,
    });
    expect(currentTierLevel(m)).toBe(5);
    expect(nextTier(m)).toBeNull();
  });

  it('tierProgress reports have/need/done per requirement', () => {
    const p = tierProgress(ZERO, TIERS[0]);
    expect(p.every((x) => x.have === 0 && !x.done)).toBe(true);
    const need = Object.fromEntries(p.map((x) => [x.key, x.need]));
    expect(need.eveningsCreated).toBe(2);
    expect(need.published).toBe(1);
    expect(need.streakDays).toBe(2);
  });

  it('tierByLevel returns the right tier or undefined', () => {
    expect(tierByLevel(5)?.id).toBe('master');
    expect(tierByLevel(99)).toBeUndefined();
  });
});

describe('verify-level ratchet', () => {
  it('an earned tier survives a broken streak (stored wins over live)', () => {
    expect(effectiveVerifyLevel(1, 0)).toBe(1);
  });

  it('ratchets up when the live level passes the stored one', () => {
    expect(effectiveVerifyLevel(1, 3)).toBe(3);
  });

  it('never goes negative', () => {
    expect(effectiveVerifyLevel(0, 0)).toBe(0);
    expect(effectiveVerifyLevel(-2, -1)).toBe(0);
  });
});
