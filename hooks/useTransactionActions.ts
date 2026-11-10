import { useCallback } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from './useToast';
import { useT } from '../i18n';
import { Transaction } from '../utils/storage';
import { isoDay, moveToDay } from '../utils/date';
import { formatDate } from '../utils/format';

/**
 * Delete-with-undo, shared by every screen that lists transactions.
 *
 * The row is removed optimistically and the deleted snapshot is handed to the
 * toast, so "Undo" re-adds the exact same transaction (same id, same date) and
 * the list lands back in its original order.
 */
export function useDeleteWithUndo() {
  const { deleteTx, addTx, findTx } = useData();
  const toast = useToast();
  const t = useT();

  return useCallback(
    async (id: string) => {
      const snapshot: Transaction | undefined = findTx(id);
      try {
        await deleteTx(id);
      } catch {
        toast.show('error', t('history.deleteFailed'));
        return;
      }
      toast.show('success', t('history.deleted'), {
        action: snapshot
          ? {
              label: t('common.undo'),
              onPress: () => {
                addTx(snapshot).then(
                  () => toast.show('success', t('history.restored')),
                  () => toast.show('error', t('history.restoreFailed')),
                );
              },
            }
          : undefined,
      });
    },
    [deleteTx, addTx, findTx, toast, t],
  );
}

/**
 * Move a transaction to another calendar day, keeping its wall-clock time.
 * The replacement for drag-and-drop: explicit target, instant Undo.
 */
export function useMoveToDate() {
  const { updateTx, findTx } = useData();
  const toast = useToast();
  const t = useT();

  return useCallback(
    async (id: string, day: Date) => {
      const before = findTx(id);
      if (!before) return;
      const next: Transaction = { ...before, date: moveToDay(new Date(before.date), day).toISOString(), dayKey: isoDay(day) };
      if (next.dayKey === before.dayKey) return;
      try {
        await updateTx(next);
      } catch {
        toast.show('error', t('input.saveFailed'));
        return;
      }
      toast.show('success', t('date.moved', { date: formatDate(next.date) }), {
        action: {
          label: t('common.undo'),
          onPress: () => {
            updateTx(before).catch(() => toast.show('error', t('input.saveFailed')));
          },
        },
      });
    },
    [updateTx, findTx, toast, t],
  );
}
