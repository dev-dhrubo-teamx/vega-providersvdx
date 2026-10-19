export type LoopstreamCategory = "Movies" | "Anime" | "My Videos";
export type LoopstreamSourceType = "mp4" | "m3u8" | "embed";

export interface LoopstreamItem {
  title: string;
  link: string;
  image: string;
  category: LoopstreamCategory;
  year?: string;
  synopsis?: string;
  sourceType: LoopstreamSourceType;
  videoUrl: string;
  language?: string;
  tags?: string[];
  tmdbId?: string;
}

/*
 * Workflow:
 * 1. Generate an item in the existing PHP panel.
 * 2. Copy the generated object.
 * 3. Paste it as a new item inside this libraryItems array.
 * 4. Run the build.
 * 5. Open Vega and select "loopstream".
 *
 * Keep each object followed by a comma so more generated objects can be
 * pasted without editing catalog.ts, posts.ts, meta.ts, or stream.ts.
 */
export const libraryItems: LoopstreamItem[] = [
  {
    title: "Alu",
    link: "mylibrary://alu",
    image: "https://image.tmdb.org/t/p/w500/zAB9sS1Z1jAODvfxjopQisrgGQK.jpg",
    category: "Movies",
    year: "2024",
    synopsis: "Theater at Hager Fikir Theater",
    sourceType: "mp4",
    videoUrl:
      "https://ia800107.us.archive.org/5/items/upload-67642d96/Daemons-of-the-Shadow-Realm-S01E06-720p-HEVC-%5BHIN-ENG-JAP%5D.mp4",
    language: "Bangla",
    tags: [],
    tmdbId: "1241202",
  },
  // Initial test item from the PHP generator. Its video filename appears to
  // describe another title; both supplied values are intentionally preserved.
  {
    title: "Jawan",
    link: "mylibrary://jawan",
    image: "https://image.tmdb.org/t/p/w500/jFt1gS4BGHlK8xt76Y81Alp4dbt.jpg",
    category: "Movies",
    year: "2023",
    synopsis:
      "An emotional journey of a prison warden, driven by a personal vendetta while keeping up to a promise made years ago, recruits inmates to commit outrageous crimes that shed light on corruption and injustice, in an attempt to get even with his past, and that leads him to an unexpected reunion.",
    sourceType: "mp4",
    videoUrl:
      "https://archive.org/download/upload-67642d96/Daemons-of-the-Shadow-Realm-S01E06-720p-HEVC-%5BHIN-ENG-JAP%5D.mkv",
    language: "Bangla",
    tags: [],
    tmdbId: "872906",
  },
  {
    title: "Stranger Things",
    link: "mylibrary://stranger-things",
    image: "https://image.tmdb.org/t/p/w500/uOOtwVbSr4QDjAGIifLDwpb2Pdl.jpg",
    category: "Anime",
    year: "2016",
    synopsis:
      "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces, and one strange little girl.",
    sourceType: "mp4",
    videoUrl:
      "https://ia800107.us.archive.org/5/items/upload-67642d96/Daemons-of-the-Shadow-Realm-S01E06-720p-HEVC-%5BHIN-ENG-JAP%5D.mp4",
    language: "Bangla",
    tags: [],
    tmdbId: "66732",
  },
  // Paste each future PHP-generated object here as a new comma-terminated
  // item. Keep every link stable and unique.
];

export function findLibraryItem(link: string): LoopstreamItem | undefined {
  return libraryItems.find((item) => item.link === link);
}

export function isYouTubeUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === "youtu.be" || host === "youtube.com" || host.endsWith(".youtube.com");
  } catch {
    return false;
  }
}

