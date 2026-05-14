import { Building2, Wallet, Smartphone, CreditCard, LucideIcon } from 'lucide-react-native';

export interface AccountTypeDef {
  id: string;
  name: string;
  icon: LucideIcon;
}

export const ACCOUNT_TYPES: AccountTypeDef[] = [
  { id: 'bank', name: 'Bank', icon: Building2 },
  { id: 'cash', name: 'Cash', icon: Wallet },
  { id: 'ewallet', name: 'E-Wallet', icon: Smartphone },
  { id: 'card', name: 'Card', icon: CreditCard },
];

export function findAccountType(id: string): AccountTypeDef {
  return ACCOUNT_TYPES.find((t) => t.id === id) ?? ACCOUNT_TYPES[0];
}
