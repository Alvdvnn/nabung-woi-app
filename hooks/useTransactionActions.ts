import { useCallback } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from './useToast';
import { useT } from '../i18n';
import { Transaction } from '../utils/storage';

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
