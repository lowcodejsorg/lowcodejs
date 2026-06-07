import { toast } from 'sonner';

export function toastSuccess(title: string, description?: string): void {
  toast.success(title, { description, closeButton: true });
}

export function toastError(title: string, description?: string): void {
  toast.error(title, { description, closeButton: true });
}

export function toastInfo(title: string, description?: string): void {
  toast(title, { description, closeButton: true });
}

export function toastWarning(title: string, description?: string): void {
  toast(title, {
    description,
    closeButton: true,
    className: '!bg-amber-600 !text-white !border-amber-600',
    descriptionClassName: '!text-white',
  });
}
