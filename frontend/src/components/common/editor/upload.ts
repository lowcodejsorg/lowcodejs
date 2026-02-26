import { API } from '@/lib/api';
import type { IStorage } from '@/lib/interfaces';

export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('files', file);
  const res = await API.post<Array<IStorage>>('/storage', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data[0].url;
}
