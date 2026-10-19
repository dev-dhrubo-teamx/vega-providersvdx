import { ProviderContext, Stream } from "../types";
import { findLibraryItem, libraryItems, LoopstreamItem } from "./shared";

export const getStream = async function ({
  link,
  type,
  signal,
  providerContext,
}: {
  link: string;
  type: string;
  signal?: AbortSignal;
  providerContext: ProviderContext;
  isDownload?: boolean;
}): Promise<Stream[]> {
  if (signal?.aborted) {
    console.log("[loopstream] stream request aborted", { link, type });
    return [];
  }

  const item = findLibraryItem(link) || findItemByVideoUrl(link);
  if (!item) {
    console.log("[loopstream] no library item for stream link", link);
    return [];
  }

  if (item.sourceType === "embed") {
    console.log("[loopstream] embed source requires an extractor", { link, title: item.title });
    return [];
  }

  const mediaType = mapMediaType(item.sourceType);
  if (!mediaType) {
    console.log("[loopstream] unsupported source type", { sourceType: item.sourceType, title: item.title });
    return [];
  }

  let mediaUrl: string;
  try {
    mediaUrl = new URL(item.videoUrl).href;
  } catch {
    console.log("[loopstream] invalid video URL", { title: item.title, videoUrl: item.videoUrl });
    return [];
  }

  const quality = mediaUrl.match(/(?:^|[._-])(2160|1080|720|480|360)p?(?:[._-]|$)/i)?.[1];
  const stream: Stream = {
    server: "Loopstream direct",
    link: mediaUrl,
    type: mediaType,
    ...(quality ? { quality } : {}),
  };
  console.log("[loopstream] resolved direct stream", {
    title: item.title,
    sourceLink: link,
    mediaType,
    mediaUrl,
  });

  return [stream];
};

function findItemByVideoUrl(videoUrl: string) {
  return libraryItems.find((item) => item.videoUrl === videoUrl);
}

function mapMediaType(sourceType: LoopstreamItem["sourceType"]): "mp4" | "m3u8" | null {
  if (sourceType === "mp4" || sourceType === "m3u8") return sourceType;
  return null;
}

