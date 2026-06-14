import { isPlaceholderContentImage } from "@/lib/cover-image";

export function hasPoster(image?: string | null): boolean {
  return !!image?.trim() && !isPlaceholderContentImage(image);
}
