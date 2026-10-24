export type LoopstreamCategory = "Movies" | "TV Series" | "Anime" | "My Videos";
export type LoopstreamSourceType = "mp4" | "m3u8" | "embed";

export interface LoopstreamEpisode {
  episode: string | number;
  title?: string;
  quality?: string;
  sourceType?: LoopstreamSourceType;
  videoUrl?: string;
}

export interface LoopstreamItem {
  title: string;
  link: string;
  image: string;
  category: LoopstreamCategory;
  mediaType?: string;
  year?: string;
  synopsis?: string;
  audioType?: string;
  language?: string;
  tags?: string[];
  tmdbId?: string;
  sourceType?: LoopstreamSourceType;
  videoUrl?: string;
  episodes?: LoopstreamEpisode[];
}

/*
 * Workflow:
 * 1. Generate an item in the existing PHP panel.
 * 2. Copy the generated object.
 * 3. Paste it as a new item inside the generatedLibraryItems array below.
 * 4. Run the build.
 * 5. Open Vega and select "loopstream".
 *
 * Keep each object followed by a comma so more generated objects can be
 * pasted without editing catalog.ts, posts.ts, meta.ts, or stream.ts.
 */
const generatedLibraryItems: LoopstreamItem[] = [
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
      "https://fsldownload.com/d/kw49ShFiN4WxRU3Y.cNIXJyM-pH2CX6gyRV2gZpLxkrj-4dHHmhZd5K2fcqBRk8Elj8ekUwVaRjutYkbiIwWaUt5AVCVuupqHIw1ZIEW2oj61zYdDZqQy__N9wg3y_sszdZCcsRFvWoj3scFWdsRojpMNZxV8OHjhslMLe4O-o-eu_9p731337w_sbdqpA_WgiYfI86Tn1yE-6ewck1TjAI4eTHM.nbH7_orxwXB6Za8cHqwSGQ",
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
  {
    title: "Adultery Alumni Association 2",
    link: "mylibrary://adultery-alumni-association-2",
    image: "https://image.tmdb.org/t/p/w500/wJHAEuL4ObSAp33T2iADrti0fAM.jpg",
    category: "Movies",
    mediaType: "movie",
    year: "2019",
    synopsis:
      "Hye Jin, Hee Kyung, and Han Hee who are among the high school alumni. They met at the alumni meeting and heard that the male alumni who did not have a chance to study during their school days were greatly successful as an investment company. And after seeing the settlement a few days later, I am happy to share my memories, but in fact, their purpose (?) Is separate. They are difficult to afford, and they want to get help from Zhengzhou. Since then, Zhengzhou has been enjoying the love of female alumni.",
    audioType: "Original",
    language: "Japanese",
    tags: [],
    tmdbId: "853033",
    sourceType: "mp4",
    videoUrl:
      "https://archive.org/download/upload-67642d96/Daemons-of-the-Shadow-Realm-S01E06-720p-HEVC-%5BHIN-ENG-JAP%5D.mp4",
  },
  // Paste each future PHP-generated object here as a new comma-terminated
  // item. Keep every link stable and unique.
];

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    return /^https?:$/i.test(new URL(value).protocol);
  } catch {
    return false;
  }
}

function normalizeEpisode(episode: LoopstreamEpisode): LoopstreamEpisode | null {
  const number = String(episode.episode ?? "").trim();
  const url = episode.videoUrl?.trim();
  if (!number || !isHttpUrl(url)) return null;
  const sourceType = episode.sourceType || "mp4";
  if (sourceType !== "mp4" && sourceType !== "m3u8") return null;
  return { ...episode, episode: number, videoUrl: url, sourceType };
}

function normalizeItem(item: LoopstreamItem): LoopstreamItem | null {
  if (!item || typeof item.title !== "string" || !item.title.trim()) return null;
  if (typeof item.link !== "string" || !item.link.trim()) return null;
  const episodes = (item.episodes || [])
    .map(normalizeEpisode)
    .filter((episode): episode is LoopstreamEpisode => episode !== null)
    .filter((episode, index, all) =>
      all.findIndex((candidate) =>
        String(candidate.episode) === String(episode.episode) &&
        candidate.quality === episode.quality &&
        candidate.videoUrl === episode.videoUrl,
      ) === index,
    );
  const sourceType = item.sourceType || (episodes.length ? undefined : "mp4");
  if (sourceType && sourceType !== "mp4" && sourceType !== "m3u8" && sourceType !== "embed") return null;
  if (!episodes.length && sourceType !== "embed" && !isHttpUrl(item.videoUrl)) return null;
  if (sourceType === "embed" && !item.videoUrl) return null;
  return { ...item, episodes, sourceType, videoUrl: item.videoUrl?.trim() };
}

// Duplicate slugs/links are ignored after the first entry so a pasted admin
// object cannot shadow an existing movie or create duplicate catalog cards.
export function normalizeLibraryItems(items: LoopstreamItem[]): LoopstreamItem[] {
  const seen = new Set<string>();
  return items.flatMap((item) => {
    const normalized = normalizeItem(item);
    if (!normalized || seen.has(normalized.link)) return [];
    seen.add(normalized.link);
    return [normalized];
  });
}

export const libraryItems = normalizeLibraryItems(generatedLibraryItems);

export function findLibraryItem(link: string): LoopstreamItem | undefined {
  return libraryItems.find((item) => item.link === link);
}

export function findLibraryMedia(link: string): {
  item: LoopstreamItem;
  sourceType: LoopstreamSourceType;
  quality?: string;
} | undefined {
  for (const item of libraryItems) {
    if (item.videoUrl === link && item.sourceType) {
      return { item, sourceType: item.sourceType };
    }
    const episode = item.episodes?.find((candidate) => candidate.videoUrl === link);
    if (episode?.videoUrl && episode.sourceType) {
      return { item, sourceType: episode.sourceType, quality: episode.quality };
    }
  }
  return undefined;
}

export function isYouTubeUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === "youtu.be" || host === "youtube.com" || host.endsWith(".youtube.com");
  } catch {
    return false;
  }
}

