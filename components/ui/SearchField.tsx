import { useMemo } from 'react';
import { Pressable, StyleProp, StyleSheet, TextInput, View, ViewStyle } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { fontSize, radius, spacing } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useT } from '../../i18n';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function SearchField({ value, onChange, placeholder, autoFocus = false, style }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          minHeight: 48,
          paddingLeft: spacing.md,
          paddingRight: spacing.xs,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        input: { flex: 1, fontSize: fontSize.input, color: colors.textPrimary, paddingVertical: spacing.sm },
        clear: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
      }),
    [colors],
  );

  return (
    <View style={[styles.wrap, style]}>
      <Search size={18} color={colors.textMuted} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? t('common.search')}
        placeholderTextColor={colors.textMuted}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel={placeholder ?? t('common.search')}
      />
      {value ? (
        <Pressable
          onPress={() => onChange('')}
          style={styles.clear}
          accessibilityRole="button"
          accessibilityLabel={t('common.clear')}
        >
          <X size={16} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}
