import {
  Utensils,
  Coffee,
  Car,
  Bus,
  Fuel,
  Plane,
  ShoppingBag,
  HeartPulse,
  Dumbbell,
  Gamepad2,
  Music,
  Film,
  Home,
  Lightbulb,
  Wifi,
  GraduationCap,
  BookOpen,
  Receipt,
  Briefcase,
  Laptop,
  TrendingUp,
  PiggyBank,
  Gift,
  CircleDollarSign,
  Wallet,
  Dog,
  Baby,
  Shirt,
  Pizza,
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

// Fallback icon used when a custom category has no recognized iconId.
export const CUSTOM_ICON: LucideIcon = Tag;

// Curated palette the icon picker exposes for custom categories.
// Keep the keys stable — they're persisted in CustomCategory.iconId.
const ICON_BY_ID: Record<string, LucideIcon> = {
  tag: Tag,
  other: Tag,
  utensils: Utensils,
  coffee: Coffee,
  pizza: Pizza,
  car: Car,
  bus: Bus,
  fuel: Fuel,
  plane: Plane,
  shopping: ShoppingBag,
  shirt: Shirt,
  health: HeartPulse,
  dumbbell: Dumbbell,
  gamepad: Gamepad2,
  music: Music,
  film: Film,
  home: Home,
  lightbulb: Lightbulb,
  wifi: Wifi,
  education: GraduationCap,
  book: BookOpen,
  bills: Receipt,
  briefcase: Briefcase,
  laptop: Laptop,
  trending: TrendingUp,
  piggy: PiggyBank,
  gift: Gift,
  dollar: CircleDollarSign,
  wallet: Wallet,
  dog: Dog,
  baby: Baby,
};

// Stable display order for the picker grid.
export const CUSTOM_ICON_CHOICES: string[] = [
  'tag', 'utensils', 'coffee', 'pizza',
  'car', 'bus', 'fuel', 'plane',
  'shopping', 'shirt', 'health', 'dumbbell',
  'gamepad', 'music', 'film', 'home',
  'lightbulb', 'wifi', 'education', 'book',
  'bills', 'briefcase', 'laptop', 'trending',
  'piggy', 'gift', 'dollar', 'wallet',
  'dog', 'baby',
];

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
