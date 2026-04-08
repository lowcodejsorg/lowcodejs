import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: Array<ClassValue>): string {
  return twMerge(clsx(inputs));
}

export function fileExtensionsToAccept(extensions: Array<string>): string {
  return extensions.map((ext) => `.${ext}`).join(',');
}
