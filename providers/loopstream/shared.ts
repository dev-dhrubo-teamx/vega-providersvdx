import { Content } from "../types";

export type LoopstreamCategory = "Movies" | "Anime" | "My Videos";
export type LoopstreamSourceType = "mp4" | "m3u8" | "embed";

export interface LoopstreamItem extends Content {
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
      "https://archive.org/download/upload-67642d96/Daemons-of-the-Shadow-Realm-S01E06-720p-HEVC-%5BHIN-ENG-JAP%5D.mp4",
    language: "Bangla",
    tags: [],
    tmdbId: "872906",
  },
  // Paste each future PHP-generated object here as a new comma-terminated
  // item. Keep every link stable and unique.
];

export function findLibraryItem(link: string): LoopstreamItem | undefined {
  return libraryItems.find((item) => item.link === link);
}

