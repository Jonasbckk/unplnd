/** Lighten (percent > 0) or darken (percent < 0) a hex color toward white/black. */
export function shade(hex: string, percent: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const num = parseInt(full, 16);
  const target = percent < 0 ? 0 : 255;
  const p = Math.abs(percent);
  const r = Math.round((target - ((num >> 16) & 0xff)) * p) + ((num >> 16) & 0xff);
  const g = Math.round((target - ((num >> 8) & 0xff)) * p) + ((num >> 8) & 0xff);
  const b = Math.round((target - (num & 0xff)) * p) + (num & 0xff);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
