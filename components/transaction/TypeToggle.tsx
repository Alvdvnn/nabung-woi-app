import { useMemo } from 'react';
import { ArrowDownCircle, ArrowRightLeft, ArrowUpCircle, Scale } from 'lucide-react-native';
import SegmentedControl, { Segment } from '../ui/SegmentedControl';
import { useTheme } from '../../hooks/useTheme';
import { TransactionType } from '../../utils/storage';
import { useT } from '../../i18n';

interface Props {
  value: TransactionType;
  onChange: (v: TransactionType) => void;
}

/**
 * Transaction type picker. Each segment carries the semantic color of the type
 * it selects, so the form's accent matches what is being recorded.
 */
export default function TypeToggle({ value, onChange }: Props) {
  const { colors } = useTheme();
  const t = useT();

  const options = useMemo<Segment<TransactionType>[]>(
    () => [
      { id: 'expense', label: t('type.expense'), Icon: ArrowDownCircle, activeColor: colors.expense },
      { id: 'income', label: t('type.income'), Icon: ArrowUpCircle, activeColor: colors.income },
      { id: 'transfer', label: t('type.transfer'), Icon: ArrowRightLeft, activeColor: colors.transfer },
      { id: 'adjustment', label: t('type.adjustmentShort'), Icon: Scale, activeColor: colors.adjustment },
    ],
    [t, colors],
  );

  return <SegmentedControl options={options} value={value} onChange={onChange} compact />;
}
