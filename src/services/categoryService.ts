export interface CategoryItem {
  name: string;
  count: number;
  icon: string;
  color: string;
}

export interface DynamicFieldItem {
  id: number;
  name: string;
  type: string;
  options: string;
  required: boolean;
}

const CATEGORIES_STORAGE_KEY = 'dream-jewels-categories';
const FIELDS_STORAGE_KEY = 'dream-jewels-dynamic-fields';

export const INITIAL_CATEGORIES: CategoryItem[] = [
  { name: 'Rings',     count: 0, icon: '💍', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { name: 'Necklaces', count: 0, icon: '📿', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { name: 'Earrings',  count: 0, icon: '✨', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { name: 'Bracelets', count: 0, icon: '🔱', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { name: 'Bangles',   count: 0, icon: '⭕', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { name: 'Pendants',  count: 0, icon: '💎', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { name: 'Other',     count: 0, icon: '👑', color: 'bg-slate-50 text-slate-700 border-slate-200' },
];

export const INITIAL_DYNAMIC_FIELDS: DynamicFieldItem[] = [
  { id: 1, name: 'Gross Weight', type: 'Number', options: 'in grams', required: true },
  { id: 2, name: 'Diamond Quality', type: 'Select', options: 'VVS, VS, SI, I', required: false },
  { id: 3, name: 'Certification', type: 'Select', options: 'IGI, GIA, SGL', required: false },
  { id: 4, name: 'Custom Engraving', type: 'Text', options: 'max 25 chars', required: false },
];

export function getStoredCategories(): CategoryItem[] {
  if (typeof window === 'undefined') return INITIAL_CATEGORIES;
  try {
    const raw = window.localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!raw) return INITIAL_CATEGORIES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CATEGORIES;
  } catch {
    return INITIAL_CATEGORIES;
  }
}

export function saveStoredCategories(categories: CategoryItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch (e) {
    console.warn('Failed to save categories:', e);
  }
}

export function getStoredDynamicFields(): DynamicFieldItem[] {
  if (typeof window === 'undefined') return INITIAL_DYNAMIC_FIELDS;
  try {
    const raw = window.localStorage.getItem(FIELDS_STORAGE_KEY);
    if (!raw) return INITIAL_DYNAMIC_FIELDS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_DYNAMIC_FIELDS;
  } catch {
    return INITIAL_DYNAMIC_FIELDS;
  }
}

export function saveStoredDynamicFields(fields: DynamicFieldItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FIELDS_STORAGE_KEY, JSON.stringify(fields));
  } catch (e) {
    console.warn('Failed to save dynamic fields:', e);
  }
}
