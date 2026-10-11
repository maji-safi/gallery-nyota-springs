import { categories, EXTRA_FEATURED_IMAGE } from "./collections";
import extras from "@/data/extra-photos.json";
export type Photo = {
  id: string;
  src: string;
  title: string;
  category: string;
  width: number;
  height: number;
  filename: string;
};
type WPAttachment = {
  id: number;
  source_url?: string;
  media_type?: string;
  mime_type?: string;
  media_details?: {
    width?: number;
    height?: number;
    sizes?: Record<
      string,
      { source_url?: string; width?: number; height?: number }
    >;
  };
};
const allowed = /^https:\/\/nyotasprings\.com\/wp-content\/uploads\//i;
const fileNumber = (src: string): number | null => {
  const match = decodeURIComponent(src)
    .split("/")
    .pop()
    ?.match(/^IMG_(\d+)(?:[-.]|$)/i);
  return match ? Number(match[1]) : null;
};
function classify(src: string) {
  const num = fileNumber(src);
  if (num === null) return null;
  // Filename numbers are NOT ZIP identifiers. They are used solely for grouping.
  const setMatch = src.match(/\/nyota-gallery\/set-(\d+)\//i);
  const setMap: Record<string, string> = {
    "8": "breakfast",
    "7": "executive-room",
    "9": "outside-lunch",
    "6": "triple-room",
    "5": "twin-room",
    "10": "bush-breakfast",
  };
  if (setMatch && setMap[setMatch[1]])
    return categories.find((c) => c.id === setMap[setMatch[1]]) ?? null;
  // For photos in /2026/09/, filename range is a best-effort guess when ranges overlap.
  return categories.find((c) => num >= c.min && num <= c.max) ?? null;
}
function photoFromUrl(
  src: string,
  width = 1200,
  height = 900,
  id?: string,
): Photo | null {
  if (!allowed.test(src) || !/\.(jpe?g|png|webp)(?:\?|$)/i.test(src))
    return null;
  const category = classify(src);
  if (!category) return null;
  const filename = decodeURIComponent(src.split("/").pop() || "photo");
  return {
    id: id || src,
    src,
    title: category.title,
    category: category.id,
    width,
    height,
    filename,
  };
}
async function discoverWordPress(): Promise<Photo[]> {
  if (process.env.WP_AUTO_DISCOVER === "false") return [];
  const maxPages = Math.min(
    Math.max(Number(process.env.WP_MAX_PAGES || 20), 1),
    50,
  );
  const result: Photo[] = [];
  // WP REST API discovery is best effort. The gallery still works with curated URLs when disabled/blocked.
  for (let page = 1; page <= maxPages; page += 4) {
    const endpoints = Array.from(
      { length: Math.min(4, maxPages - page + 1) },
      (_, i) => page + i,
    );
    const pages = await Promise.all(
      endpoints.map(async (n) => {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          try {
            const res = await fetch(
              `https://nyotasprings.com/wp-json/wp/v2/media?media_type=image&per_page=100&page=${n}&_fields=id,source_url,media_type,mime_type,media_details`,
              { next: { revalidate: 3600 }, signal: controller.signal },
            );
            return res.ok ? ((await res.json()) as WPAttachment[]) : [];
          } finally {
            clearTimeout(timeout);
          }
        } catch {
          return [] as WPAttachment[];
        }
      }),
    );
    for (const batch of pages) {
      for (const attachment of batch) {
        const src = attachment.source_url;
        if (!src) continue;
        const photo = photoFromUrl(
          src,
          attachment.media_details?.width ?? 1200,
          attachment.media_details?.height ?? 900,
          `wp-${attachment.id}`,
        );
        if (photo) result.push(photo);
      }
    }
    if (
      pages.every((batch) => batch.length === 0) ||
      pages.some((batch) => batch.length > 0 && batch.length < 100)
    )
      break;
  }
  return result;
}
export async function getPhotos(): Promise<Photo[]> {
  const photos = await discoverWordPress();
  // Include supplied exact links; no speculative IMG_XXXX generation, no assumed suffixes.
  // This also provides a usable baseline if WordPress REST API is blocked.
  const seededEntries = categories.flatMap((c) =>
    [c.start, c.end].map((src) => ({ src, category: c.id, title: c.title })),
  );
  seededEntries.push({
    src: EXTRA_FEATURED_IMAGE,
    category: "twin-room",
    title: "Twin Room",
  });
  const seeded = seededEntries.map((e) => e.src);
  const explicit = (
    extras as {
      src: string;
      width?: number;
      height?: number;
      category?: string;
    }[]
  )
    .map((item) => {
      const inferred = photoFromUrl(
        item.src,
        item.width ?? 1200,
        item.height ?? 900,
      );
      if (!inferred) return null;
      const category = categories.find((c) => c.id === item.category);
      return category
        ? { ...inferred, category: category.id, title: category.title }
        : inferred;
    })
    .filter((p): p is Photo => p !== null);
  const all = [
    ...explicit,
    ...seededEntries
      .map((e) => {
        const photo = photoFromUrl(e.src);
        return photo
          ? { ...photo, category: e.category, title: e.title }
          : null;
      })
      .filter((p): p is Photo => p !== null),
    ...photos,
  ];
  const seen = new Set<string>();
  return all
    .filter((photo) => {
      // Ignore scaled media EXCEPT the two exact user-given boundary URLs.
      if (/-scaled\./i.test(photo.filename) && !seeded.includes(photo.src))
        return false;
      // Deduplicate by image basename + category rather than source path.
      const key = `${photo.category}:${photo.filename.toLowerCase().replace(/-scaled(?=\.)/, "")}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort(
      (a, b) =>
        categories.findIndex((c) => c.id === a.category) -
          categories.findIndex((c) => c.id === b.category) ||
        (fileNumber(a.src) ?? 0) - (fileNumber(b.src) ?? 0),
    );
}
