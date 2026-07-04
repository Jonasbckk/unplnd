import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Screen, Text } from '@/components/ui';
import { LocationChip } from '@/features/location/LocationChip';
import { AnswerRow } from '@/features/planner/AnswerRow';
import { QuestionCard } from '@/features/planner/QuestionCard';
import { QUESTIONS, type Question } from '@/features/planner/questions';
import { isPlanReady, usePlannerStore } from '@/features/planner/planner-store';
import { optionLabel, useT } from '@/lib/i18n';
import { useTheme } from '@/theme';

/** The Planner — a conversation, not a form (Constitution Rule 12). One question at a time. */
export default function PlannerScreen() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const answers = usePlannerStore((s) => s.answers);
  const setSingle = usePlannerStore((s) => s.setSingle);
  const togglePreference = usePlannerStore((s) => s.togglePreference);
  const setRequest = usePlannerStore((s) => s.setRequest);
  const [editing, setEditing] = useState<number | null>(null);
  const [freeText, setFreeText] = useState('');

  // The active question is the first unanswered one — or whichever the user is editing.
  const frontier = useMemo(() => {
    const idx = QUESTIONS.findIndex((q) => q.key !== 'preferences' && !answers[q.key]);
    return idx === -1 ? QUESTIONS.length - 1 : idx;
  }, [answers]);
  const activeIndex = editing ?? frontier;
  const revealed = Math.max(frontier, activeIndex);
  const ready = isPlanReady(answers);
  const requiredAnswered = (['mood', 'group', 'budget', 'transport', 'time'] as const).filter((k) => answers[k]).length;

  const displayValue = (q: Question) => {
    if (q.key === 'preferences') {
      return answers.preferences.length ? answers.preferences.map(optionLabel).join(', ') : tr('planner.none');
    }
    const value = answers[q.key];
    return value ? optionLabel(value) : '';
  };

  const onSelect = (index: number, value: string) => {
    const q = QUESTIONS[index];
    if (q.type === 'multi') {
      togglePreference(value);
    } else {
      // single (tap) and slider (confirm) both commit one value and advance.
      setSingle(q.key as 'mood', value);
      setEditing(null);
    }
  };

  const planFromText = () => {
    const text = freeText.trim();
    if (!text) return;
    setRequest(text);
    router.push('/plan/generating');
  };

  return (
    <Screen scroll contentStyle={{ gap: t.spacing.lg }}>
      <LocationChip />

      <Text variant="displayMedium">{tr('planner.title')}</Text>

      <View style={{ height: 4, borderRadius: t.radius.pill, backgroundColor: t.colors.border, overflow: 'hidden' }}>
        <View
          style={{
            width: `${(requiredAnswered / 5) * 100}%`,
            height: '100%',
            backgroundColor: t.colors.primary,
            borderRadius: t.radius.pill,
          }}
        />
      </View>

      {QUESTIONS.slice(0, revealed + 1).map((q, i) => {
        if (i === activeIndex) {
          const selected = q.key === 'preferences' ? answers.preferences : answers[q.key];
          return <QuestionCard key={q.key} question={q} selected={selected} onSelect={(v) => onSelect(i, v)} />;
        }
        const answered = q.key === 'preferences' ? answers.preferences.length > 0 : Boolean(answers[q.key]);
        if (!answered) return null;
        return (
          <AnswerRow
            key={q.key}
            label={tr(`planner.shorts.${q.key}`)}
            value={displayValue(q)}
            onEdit={() => setEditing(i)}
          />
        );
      })}

      {ready && <Button title={tr('planner.create')} onPress={() => router.push('/plan/generating')} />}

      {/* Or describe it yourself — the Planner is a conversation, not a form (Constitution Rule 12). */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, marginTop: t.spacing.sm }}>
        <View style={{ flex: 1, height: 1, backgroundColor: t.colors.divider }} />
        <Text variant="small" color="textSecondary">
          {tr('planner.or')}
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: t.colors.divider }} />
      </View>

      <View style={{ gap: t.spacing.md }}>
        <Text variant="h3">{tr('planner.freeTitle')}</Text>
        <Input
          value={freeText}
          onChangeText={setFreeText}
          placeholder={tr('planner.freePlaceholder')}
          multiline
          style={{ height: 104, paddingTop: t.spacing.md, textAlignVertical: 'top' }}
        />
        <Button title={tr('planner.freeGo')} disabled={!freeText.trim()} onPress={planFromText} />
      </View>
    </Screen>
  );
}
