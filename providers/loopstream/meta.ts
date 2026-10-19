import { Info, ProviderContext } from "../types";
import { findLibraryItem } from "./shared";

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

  if (item.sourceType === "embed") {
    throw new Error(
      `Loopstream embed source is unsupported: ${item.videoUrl}`,
    );
  }

  if (item.sourceType !== "mp4" && item.sourceType !== "m3u8") {
    throw new Error(`Loopstream source type is unsupported: ${item.sourceType}`);
  }

  return {
    title: item.title,
    image: item.image || "",
    synopsis: item.synopsis || "",
    imdbId: "",
    tmdbId: item.tmdbId || "",
    type: "movie",
    tags: item.tags,
    linkList: [
      {
        title: "Video",
        directLinks: [
          {
            title: item.title,
            // The catalog link is only an internal lookup key. Expose the
            // actual media URL to Vega so playback never has to treat a
            // mylibrary:// URI as a playable video source.
            link: item.videoUrl,
            type: "movie",
          },
        ],
      },
    ],
  };
};

