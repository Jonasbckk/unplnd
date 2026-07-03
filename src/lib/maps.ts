import { Linking } from 'react-native';

/**
 * Map hand-off (19A): launch the maps app for a stop, return to UNPLND afterwards.
 * When a Google place_id is known, open that EXACT venue; otherwise fall back to a text search.
 * Plain URLs — no API key needed in the client.
 */
export function openInMaps(query: string, placeId?: string) {
  const encoded = encodeURIComponent(query);
  const url = placeId
    ? `https://www.google.com/maps/search/?api=1&query=${encoded}&query_place_id=${placeId}`
    : `https://www.google.com/maps/search/?api=1&query=${encoded}`;
  void Linking.openURL(url);
}
