/** Time-based greeting segment (24_DELIGHT). Copy lives in the i18n dictionaries. */
export type GreetingSegment = 'morning' | 'afternoon' | 'evening' | 'night';

export function getGreetingSegment(now: Date = new Date()): GreetingSegment {
  const hour = now.getHours();
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 23) return 'evening';
  return 'night';
}
