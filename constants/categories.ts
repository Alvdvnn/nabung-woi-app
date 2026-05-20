import {
  Utensils,
  Car,
  ShoppingBag,
  HeartPulse,
  Gamepad2,
  Home,
  GraduationCap,
  Receipt,
  Briefcase,
  Laptop,
  TrendingUp,
  Gift,
  CircleDollarSign,
  Tag,
  LucideIcon,
} from 'lucide-react-native';
import type { CustomCategory } from '../utils/storage';

export interface CategoryDef {
  id: string;
  name: string;
  icon: LucideIcon;
  type: 'income' | 'expense';
}

export const EXPENSE_CATEGORIES: CategoryDef[] = [
  { id: 'food', name: 'Food', icon: Utensils, type: 'expense' },
  { id: 'transport', name: 'Transport', icon: Car, type: 'expense' },
  { id: 'shopping', name: 'Shopping', icon: ShoppingBag, type: 'expense' },
  { id: 'health', name: 'Health', icon: HeartPulse, type: 'expense' },
  { id: 'entertainment', name: 'Fun', icon: Gamepad2, type: 'expense' },
  { id: 'home', name: 'Home', icon: Home, type: 'expense' },
  { id: 'education', name: 'Education', icon: GraduationCap, type: 'expense' },
  { id: 'bills', name: 'Bills', icon: Receipt, type: 'expense' },
];

export const INCOME_CATEGORIES: CategoryDef[] = [
  { id: 'salary', name: 'Salary', icon: Briefcase, type: 'income' },
  { id: 'freelance', name: 'Freelance', icon: Laptop, type: 'income' },
  { id: 'investment', name: 'Investment', icon: TrendingUp, type: 'income' },
  { id: 'gift', name: 'Gift', icon: Gift, type: 'income' },
  { id: 'other_income', name: 'Other', icon: CircleDollarSign, type: 'income' },
];

export const ALL_CATEGORIES: CategoryDef[] = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

// Single fallback icon used for all user-added custom categories.
export const CUSTOM_ICON: LucideIcon = Tag;

const ICON_BY_ID: Record<string, LucideIcon> = {
  other: Tag,
  tag: Tag,
};

export function iconForCustom(iconId: string | undefined): LucideIcon {
  return (iconId && ICON_BY_ID[iconId]) || CUSTOM_ICON;
}

export function customToDef(c: CustomCategory): CategoryDef {
  return { id: c.id, name: c.name, icon: iconForCustom(c.iconId), type: c.type };
}

export function findCategory(id: string, customCats: CustomCategory[] = []): CategoryDef | undefined {
  const builtin = ALL_CATEGORIES.find((c) => c.id === id);
  if (builtin) return builtin;
  const custom = customCats.find((c) => c.id === id);
  return custom ? customToDef(custom) : undefined;
}
