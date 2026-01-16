import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { ICategory, IDropdown } from './interfaces';

export function cn(...inputs: Array<ClassValue>): string {
  return twMerge(clsx(inputs));
}

export function getCategoryItem(
  categories: Array<ICategory>,
  id: string,
): ICategory | undefined {
  for (const category of categories) {
    if (category.id === id) {
      return category;
    }
    if (category.children.length > 0) {
      const found = getCategoryItem(category.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

export function getDropdownItem(
  items: Array<IDropdown>,
  id: string,
): IDropdown | undefined {
  return items.find((item) => item.id === id);
}
