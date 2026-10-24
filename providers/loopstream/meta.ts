import { Info, ProviderContext } from "../types";
import { findLibraryItem, isYouTubeUrl } from "./shared";

type DirectLink = NonNullable<Info["linkList"][number]["directLinks"]>[number];

export function buildLinkList(item: {
  title: string;
  episodes?: { episode: string | number; title?: string; quality?: string; sourceType?: string; videoUrl?: string }[];
  videoUrl?: string;
  audioType?: string;
  language?: string;
}): Info["linkList"] {
  const label = [item.audioType, item.language].filter(Boolean).join(" · ");
  const makeTitle = (title: string, quality?: string) =>
    [title, quality, label].filter(Boolean).join(" · ");
  const directLinks: DirectLink[] = item.episodes?.length
    ? []
    : item.videoUrl
      ? [{ title: makeTitle(item.title), link: item.videoUrl, type: "movie" }]
      : [];

  const episodeGroups = (item.episodes || []).reduce((groups, episode) => {
    const key = String(episode.episode);
    let group = groups.find((candidate) => candidate.title === `Episode ${key}`);
    if (!group) {
      group = { title: `Episode ${key}`, directLinks: [] as DirectLink[] };
      groups.push(group);
    }
    if (episode.videoUrl && (episode.sourceType === "mp4" || episode.sourceType === "m3u8")) {
      group.directLinks.push({
        title: makeTitle(episode.title || `Episode ${key}`, episode.quality),
        link: episode.videoUrl,
        type: "series",
      });
    }
    return groups;
  }, [] as { title: string; directLinks: DirectLink[] }[])
    .filter((group) => group.directLinks.length > 0);

  return episodeGroups.length
    ? episodeGroups
    : [{ title: label || "Video", directLinks }].filter((group) => group.directLinks.length > 0);
}

export const getMeta = async function ({
  link,
}: {
  link: string;
  providerContext: ProviderContext;
  providerValue?: string;
}): Promise<Info> {
  const item = findLibraryItem(link);
  if (!item) {
    throw new Error(`Loopstream item not found: ${link}`);
  }

  if (item.sourceType === "embed" && (!item.videoUrl || !isYouTubeUrl(item.videoUrl))) {
    throw new Error(
      `Loopstream embed source is unsupported: ${item.videoUrl}`,
    );
  }

  if (item.sourceType === "embed" && item.episodes?.length) {
    throw new Error(`Loopstream episode embeds are unsupported: ${item.title}`);
  }

  if (item.sourceType !== "embed" && item.sourceType !== "mp4" && item.sourceType !== "m3u8" && !item.episodes?.length) {
    throw new Error(`Loopstream source type is unsupported: ${item.sourceType}`);
  }

  const metadataTags = [
    ...(item.tags || []),
    item.audioType,
    item.language,
    item.mediaType,
    item.category,
    item.year,
  ].filter((value): value is string => Boolean(value?.trim()));
  const linkList = buildLinkList(item);

  return {
    title: item.title,
    image: item.image || "",
    synopsis: [item.synopsis, item.audioType, item.language].filter(Boolean).join(" · "),
    imdbId: "",
    tmdbId: item.tmdbId || "",
    type: item.episodes?.some((episode) => episode.videoUrl) ? "series" : "movie",
    tags: metadataTags,
    linkList,
  };
};

