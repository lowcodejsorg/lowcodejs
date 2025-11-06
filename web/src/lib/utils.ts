import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Category, Meta, Storage } from "./entity";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const MetaDefault: Meta = {
  total: 1,
  perPage: 50,
  page: 1,
  lastPage: 1,
  firstPage: 1,
};

export function getCategoryItem(
  category: Category[],
  id: string
): Category | null {
  for (const item of category) {
    if (item.id === id) {
      return item;
    }

    if (item.children && item.children.length > 0) {
      const r = getCategoryItem(item.children, id);
      if (r) {
        return r;
      }
    }
  }

  return null;
}

export function enabledMenuOfGroup(route: string) {
  const groups: Record<string, string[]> = {
    "/dashboard": ["master", "administrator", "manager"],
    "/tables": ["master", "administrator", "manager", "registered"],
    "/users": ["master", "administrator"],
    "/user-groups": ["master"],
    "/settings": ["master"],
  };

  return groups[route] || [];
}

export function enabledMenu(route?: string, grupo?: string): boolean {
  if (!route || !grupo) return false;
  const routes = enabledMenuOfGroup(route);
  return routes.includes(grupo);
}

export function storageToFile(storage: Storage): File {
  // const response = await fetch(storage.url);
  // const blob = await response.blob();
  // return new File([blob], storage.name, { type: storage.type });
  const blob = new Blob([""], { type: storage.type });

  return new File([blob], storage.filename || "arquivo.png", {
    type: storage.type,
    lastModified: new Date().getTime(),
  });
}

export function getFileType({ type, filename }: Storage) {
  if (type) {
    if (type.startsWith("image/")) return "image";
    if (type.startsWith("video/")) return "video";
    if (type.startsWith("audio/")) return "audio";
    if (type.startsWith("application/pdf")) return "pdf";
    if (type.includes("zip") || type.includes("tar") || type.includes("rar"))
      return "archive";
    if (type.includes("text/html") || type.includes("application/javascript"))
      return "code";
  }

  // Fallback to extension check
  const extension = filename.split(".").pop()?.toLowerCase();
  if (!extension) return "text";

  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(extension))
    return "image";
  if (["mp4", "webm", "mov", "avi", "wmv", "flv", "mkv"].includes(extension))
    return "video";
  if (["mp3", "wav", "ogg", "flac", "aac"].includes(extension)) return "audio";
  if (extension === "pdf") return "pdf";
  if (["zip", "rar", "tar", "7z", "gz"].includes(extension)) return "archive";
  if (
    [
      "html",
      "css",
      "js",
      "ts",
      "jsx",
      "tsx",
      "php",
      "py",
      "java",
      "rb",
      "c",
      "cpp",
    ].includes(extension)
  )
    return "code";

  return "text";
}
