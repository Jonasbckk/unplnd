import { useState } from 'react';
import { View } from 'react-native';

import { Button, StatementTitle } from '@/components/ui';
import { optionLabel, useT } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { ChoiceGrid } from './ChoiceGrid';
import { StepSlider } from './StepSlider';
import type { Question } from './questions';

interface QuestionCardProps {
  question: Question;
  /** For single: the selected value. For multi: the selected list. */
  selected: string | string[] | undefined;
  onSelect: (value: string) => void;
}

/** Budget & time: a slider you drag, then confirm — feels deliberate, not a form field. */
function SliderChoice({
  question,
  selected,
  onSelect,
}: {
  question: Question;
  selected: string | undefined;
  onSelect: (value: string) => void;
}) {
  const t = useTheme();
  const { t: tr } = useT();
  const steps = question.options.map((value) => ({ value, label: optionLabel(value) }));
  const found = selected ? question.options.indexOf(selected) : -1;
  const [index, setIndex] = useState(found >= 0 ? found : Math.floor(steps.length / 2));

  return (
    <View style={{ gap: t.spacing.lg }}>
      <StepSlider steps={steps} index={index} onChange={setIndex} />
      <Button title={tr('common.continue')} onPress={() => onSelect(steps[index].value)} />
    </View>
  );
}

/** One question in the Planner conversation — a title and its choices. */
export function QuestionCard({ question, selected, onSelect }: QuestionCardProps) {
  const t = useTheme();
  const { t: tr } = useT();

  return (
    <View style={{ gap: t.spacing.base }}>
      <StatementTitle text={tr(`planner.questions.${question.key}`)} variant="h1" />
      {question.type === 'slider' ? (
        <SliderChoice
          question={question}
          selected={typeof selected === 'string' ? selected : undefined}
          onSelect={onSelect}
        />
      ) : (
        <ChoiceGrid
          options={question.options}
          selected={selected}
          multi={question.type === 'multi'}
          onSelect={onSelect}
        />
      )}
    </View>
  );
}
