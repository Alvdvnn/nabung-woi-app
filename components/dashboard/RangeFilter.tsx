import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { CalendarRange } from 'lucide-react-native';
import Chip from '../ui/Chip';
import Sheet from '../ui/Sheet';
import Button from '../ui/Button';
import ListRow from '../ui/ListRow';
import SectionGroup from '../ui/SectionGroup';
import DateSheet from '../transaction/DateSheet';
import { spacing } from '../../constants/theme';
import { DateRange, customRange, lastDaysRange, rangeFor } from '../../utils/period';
import { formatDateLong } from '../../utils/format';
import { useT } from '../../i18n';

export type RangePreset = 'today' | 'week' | 'month' | 'year' | '30d' | 'custom';

interface Props {
  preset: RangePreset;
  range: DateRange;
  onChange: (preset: RangePreset, range: DateRange) => void;
}

export function rangeForPreset(preset: Exclude<RangePreset, 'custom'>): DateRange {
  switch (preset) {
    case 'today': return rangeFor('day');
    case 'week': return rangeFor('week');
    case 'year': return rangeFor('year');
    case '30d': return lastDaysRange(30);
    case 'month':
    default: return rangeFor('month');
  }
}

/** Preset chips plus a custom start/end picker. Drives every dashboard number. */
export default function RangeFilter({ preset, range, onChange }: Props) {
  const t = useT();
  const [customOpen, setCustomOpen] = useState(false);
  const [start, setStart] = useState<Date>(range.start);
  const [end, setEnd] = useState<Date>(range.end);
  const [picking, setPicking] = useState<'start' | 'end' | null>(null);

  const presets = useMemo<{ id: Exclude<RangePreset, 'custom'>; label: string }[]>(
    () => [
      { id: 'today', label: t('period.today') },
      { id: 'week', label: t('period.thisWeek') },
      { id: 'month', label: t('period.thisMonth') },
      { id: 'year', label: t('period.thisYear') },
      { id: '30d', label: t('range.last30') },
    ],
    [t],
  );

  const styles = useMemo(
    () => StyleSheet.create({ row: { flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.lg } }),
    [],
  );

  const openCustom = () => {
    setStart(range.start);
    setEnd(range.end);
    setCustomOpen(true);
  };

  const applyCustom = () => {
    onChange('custom', customRange(start, end));
    setCustomOpen(false);
  };

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {presets.map((p) => (
          <Chip key={p.id} label={p.label} size="sm" selected={preset === p.id} onPress={() => onChange(p.id, rangeForPreset(p.id))} />
        ))}
        <Chip label={t('range.custom')} Icon={CalendarRange} size="sm" selected={preset === 'custom'} onPress={openCustom} />
      </ScrollView>

      <Sheet
        visible={customOpen}
        title={t('range.customTitle')}
        onClose={() => setCustomOpen(false)}
        footer={<Button label={t('common.apply')} onPress={applyCustom} size="lg" />}
      >
        <SectionGroup>
          <ListRow title={t('range.from')} value={formatDateLong(start.toISOString())} trailing="chevron" onPress={() => setPicking('start')} />
          <ListRow title={t('range.to')} value={formatDateLong(end.toISOString())} trailing="chevron" onPress={() => setPicking('end')} />
        </SectionGroup>
      </Sheet>

      <DateSheet
        visible={picking === 'start'}
        value={start}
        onChange={(d) => {
          setStart(d);
          if (d > end) setEnd(d);
        }}
        onClose={() => setPicking(null)}
        withTime={false}
        title={t('range.from')}
      />
      <DateSheet
        visible={picking === 'end'}
        value={end}
        onChange={(d) => {
          setEnd(d);
          if (d < start) setStart(d);
        }}
        onClose={() => setPicking(null)}
        withTime={false}
        title={t('range.to')}
      />
    </View>
  );
}
