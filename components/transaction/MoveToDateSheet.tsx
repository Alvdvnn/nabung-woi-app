import DateSheet from './DateSheet';
import { useMoveToDate } from '../../hooks/useTransactionActions';
import { useData } from '../../context/DataContext';
import { useT } from '../../i18n';

interface Props {
  /** Transaction being moved; null keeps the sheet closed. */
  txId: string | null;
  onClose: () => void;
}

/** "Move to date" for one transaction: pick a day, get an Undo toast. */
export default function MoveToDateSheet({ txId, onClose }: Props) {
  const { findTx } = useData();
  const moveToDate = useMoveToDate();
  const t = useT();
  const tx = txId ? findTx(txId) : undefined;
  return (
    <DateSheet
      visible={!!tx}
      value={tx ? new Date(tx.date) : new Date()}
      onChange={(d) => {
        if (txId) moveToDate(txId, d);
      }}
      onClose={onClose}
      withTime={false}
      title={t('date.moveTo')}
    />
  );
}
