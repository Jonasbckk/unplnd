import { Alert, Platform } from 'react-native';

import { i18n } from '@/lib/i18n';
import { useAppStore } from '@/store/app-store';

/**
 * Explicit permission before anything reaches the third-party model (App Review 5.1.2(i):
 * personal data shared with third-party AI needs disclosure + consent first; EU AI Act Art. 50).
 *
 * Accepting here and tapping "Einverstanden" on the Planner card are the same consent — both set
 * aiNoticeSeen. Every flow that calls the model (plan generation, voice concierge) asks this
 * first, so nobody can skip past the card and still send data.
 */
export async function ensureAiConsent(): Promise<boolean> {
  const { aiNoticeSeen, acknowledgeAiNotice } = useAppStore.getState();
  if (aiNoticeSeen) return true;

  const title = i18n.t('aiNotice.title');
  const body = i18n.t('aiNotice.body');
  const accept = i18n.t('aiNotice.ack');
  const decline = i18n.t('aiNotice.decline');

  const ok =
    Platform.OS === 'web'
      ? typeof window !== 'undefined' && window.confirm(`${title}\n\n${body}`)
      : await new Promise<boolean>((resolve) => {
          Alert.alert(title, body, [
            { text: decline, style: 'cancel', onPress: () => resolve(false) },
            { text: accept, onPress: () => resolve(true) },
          ]);
        });

  if (ok) acknowledgeAiNotice();
  return ok;
}
