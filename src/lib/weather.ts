export type WeatherKey =
  | 'clear'
  | 'mostlyClear'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'storm';

export interface Weather {
  temperature: number;
  /** i18n key under weather.conditions / weather.suggestions. */
  key: WeatherKey;
  /** English condition text — sent to the AI context, never shown to users. */
  conditionEn: string;
  /** Ionicons name for the condition. */
  icon: string;
  /** Local sunset time, e.g. "21:32". */
  sunset: string;
  /** Planner mood that fits the weather (canonical value). */
  mood: string;
}

// WMO weather codes → key/icon/mood. Copy lives in the i18n dictionaries (always positive, 24_DELIGHT).
function describe(code: number): Pick<Weather, 'key' | 'conditionEn' | 'icon' | 'mood'> {
  if (code === 0) return { key: 'clear', conditionEn: 'Clear sky', icon: 'sunny-outline', mood: 'Romantic' };
  if (code <= 2) return { key: 'mostlyClear', conditionEn: 'Mostly clear', icon: 'partly-sunny-outline', mood: 'Nature' };
  if (code === 3) return { key: 'cloudy', conditionEn: 'Cloudy', icon: 'cloud-outline', mood: 'Relaxed' };
  if (code === 45 || code === 48) return { key: 'fog', conditionEn: 'Foggy', icon: 'cloud-outline', mood: 'Cozy' };
  if (code <= 57) return { key: 'drizzle', conditionEn: 'Drizzle', icon: 'rainy-outline', mood: 'Relaxed' };
  if (code <= 67 || (code >= 80 && code <= 82)) return { key: 'rain', conditionEn: 'Rainy', icon: 'rainy-outline', mood: 'Stay In' };
  if (code <= 77 || code === 85 || code === 86) return { key: 'snow', conditionEn: 'Snowy', icon: 'snow-outline', mood: 'Cozy' };
  return { key: 'storm', conditionEn: 'Stormy', icon: 'thunderstorm-outline', mood: 'Stay In' };
}

let cache: { at: number; data: Weather } | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes per 14_TECH_STACK

/** Current weather + sunset via Open-Meteo (free, no API key). Returns null on failure — callers hide the card. */
export async function getWeather(latitude: number, longitude: number): Promise<Weather | null> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.data;
  }
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      '&current=temperature_2m,weather_code&daily=sunset&timezone=auto&forecast_days=1';
    const res = await fetch(url);
    if (!res.ok) return cache?.data ?? null;
    const json = (await res.json()) as {
      current?: { temperature_2m?: number; weather_code?: number };
      daily?: { sunset?: string[] };
    };
    const temp = json.current?.temperature_2m;
    const code = json.current?.weather_code;
    if (typeof temp !== 'number' || typeof code !== 'number') return cache?.data ?? null;

    const sunsetIso = json.daily?.sunset?.[0];
    const sunset = sunsetIso
      ? new Date(sunsetIso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
      : '';

    const data: Weather = { temperature: Math.round(temp), sunset, ...describe(code) };
    cache = { at: Date.now(), data };
    return data;
  } catch {
    return cache?.data ?? null; // last successful response as fallback (14_TECH_STACK)
  }
}
