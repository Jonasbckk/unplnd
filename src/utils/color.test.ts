import { shade } from './color';

describe('shade', () => {
  it('returns the same colour at 0%', () => {
    expect(shade('#c97b63', 0)).toBe('#c97b63');
  });

  it('fully darkens toward black at -1', () => {
    expect(shade('#808080', -1)).toBe('#000000');
  });

  it('fully lightens toward white at 1', () => {
    expect(shade('#808080', 1)).toBe('#ffffff');
  });

  it('expands 3-digit hex', () => {
    expect(shade('#fff', 0)).toBe('#ffffff');
  });

  it('always returns a 7-char hex string', () => {
    const out = shade('#6d9dc5', -0.2);
    expect(out).toMatch(/^#[0-9a-f]{6}$/);
  });
});
