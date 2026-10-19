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
        title: item.sourceType === "embed" ? "Embed source" : "Video",
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

