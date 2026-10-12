
import approvedPhotos from "@/data/approved-photos.json";
import { categories } from "./collections";

export type Photo = {
  id: string;
  src: string;
  title: string;
  category: string;
  width: number;
  height: number;
  filename: string;
};

const ALLOWED_MEDIA_URL =
  /^https:\/\/nyotasprings\.com\/wp-content\/uploads\//i;

/**
 * Extracts the image number from a WordPress filename.
 *
 * Examples:
 * IMG_2543.jpg     -> 2543
 * IMG_2943-HDR.jpg -> 2943
 * IMG_4362-scaled.jpg -> 4362
 */
function fileNumber(src: string): number | null {
  const filename = decodeURIComponent(
    src.split("/").pop() || "",
  );

  const match = filename.match(/^IMG_(\d+)(?:[-.]|$)/i);

  return match ? Number(match[1]) : null;
}

/**
 * Validates a photograph before including it
 * in the public gallery.
 */
function isValidPhoto(photo: Photo): boolean {
  if (!photo || !photo.src || !photo.category) {
    return false;
  }

  if (!ALLOWED_MEDIA_URL.test(photo.src)) {
    return false;
  }

  if (!/\.(jpe?g|png|webp)(?:\?|$)/i.test(photo.src)) {
    return false;
  }

  if (!categories.some((c) => c.id === photo.category)) {
    return false;
  }

  return true;
}

/**
 * Returns only manually approved photographs.
 *
 * IMPORTANT:
 * - Does not call the WordPress REST API.
 * - Does not load extra-photos.json.
 * - Does not restore excluded photographs.
 * - Does not modify or delete WordPress media.
 */
export async function getPhotos(): Promise<Photo[]> {
  const approved = approvedPhotos as Photo[];

  if (!Array.isArray(approved)) {
    throw new Error(
      "Nyota Springs: approved-photos.json must contain an array.",
    );
  }

  if (approved.length === 0) {
    console.warn(
      "Nyota Springs: approved photo manifest is empty.",
    );

    return [];
  }

  const seen = new Set<string>();

  return approved
    .filter(isValidPhoto)
    .filter((photo) => {
      // Prevent the exact same source URL appearing twice.
      const key = photo.src.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      const categoryA = categories.findIndex(
        (c) => c.id === a.category,
      );

      const categoryB = categories.findIndex(
        (c) => c.id === b.category,
      );

      if (categoryA !== categoryB) {
        return categoryA - categoryB;
      }

      return (
        (fileNumber(a.src) ?? 0) -
        (fileNumber(b.src) ?? 0)
      );
    });
}
