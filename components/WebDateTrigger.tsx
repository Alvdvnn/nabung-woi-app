import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { isoDay } from '../utils/date';

interface Props {
  open: boolean;
  value: Date;
  onChange: (d: Date) => void;
  onClose: () => void;
}

// Web-only hidden <input type="date">. Imperatively opened when `open` flips true.
// On native this component is a no-op so it can be left in JSX unconditionally.
export default function WebDateTrigger({ open, value, onChange, onClose }: Props) {
  const ref = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!open) return;
    const el = ref.current as HTMLInputElement | null;
    if (!el) return;
    const t = setTimeout(() => {
      if (typeof el.showPicker === 'function') {
        try { el.showPicker(); return; } catch {}
      }
      el.click();
      el.focus();
    }, 0);
    return () => clearTimeout(t);
  }, [open]);

  if (Platform.OS !== 'web') return null;

  return (
    // @ts-ignore react-native-web passes unknown elements through
    <input
      ref={ref}
      type="date"
      value={isoDay(value)}
      onChange={(e: any) => {
        const v = e.target.value as string;
        if (!v) { onClose(); return; }
        const [y, m, d] = v.split('-').map(Number);
        onChange(new Date(y, m - 1, d));
        onClose();
      }}
      onBlur={onClose}
      style={{
        position: 'absolute',
        left: -9999,
        top: -9999,
        width: 1,
        height: 1,
        opacity: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
