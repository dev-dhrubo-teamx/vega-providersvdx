import { ProviderContext, Stream } from "../types";
import { findLibraryItem, findLibraryMedia, isYouTubeUrl, LoopstreamItem } from "./shared";
import { getStream as getYouTubeStream } from "../youtube/stream";

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

  const item = findLibraryItem(link);
  if (!item) {
    const knownMedia = findLibraryMedia(link);
    if (knownMedia) {
      if (knownMedia.sourceType === "embed") return [];
      const streamType = mapMediaType(knownMedia.sourceType);
      if (!streamType) return [];
      return [{
        server: "Loopstream direct",
        link,
        type: streamType,
        ...(knownMedia.quality ? { quality: knownMedia.quality } : {}),
      }];
    }
    if (isYouTubeUrl(link)) {
      return getYouTubeStream({
        link,
        type,
        signal: signal || new AbortController().signal,
        providerContext,
      });
    }

    const directStream = createDirectStream(link);
    if (directStream) {
      console.log("[loopstream] accepted normalized direct media URL", directStream);
      return [directStream];
    }

    console.log("[loopstream] no library item for stream link", link);
    return [];
  }

  if (item.sourceType === "embed") {
    const embedUrl = item.videoUrl;
    if (embedUrl && isYouTubeUrl(embedUrl)) {
      return getYouTubeStream({
        link: embedUrl,
        type,
        signal: signal || new AbortController().signal,
        providerContext,
      });
    }

    console.log("[loopstream] embed source requires an extractor", { link, title: item.title });
    return [];
  }

  const mediaType = mapMediaType(item.sourceType);
  if (!mediaType) {
    console.log("[loopstream] unsupported source type", { sourceType: item.sourceType, title: item.title });
    return [];
  }

  if (!item.videoUrl) return [];
  let mediaUrl: string;
  try {
    // videoUrl is already a final media URL. Validate it, but preserve the
    // exact generator-supplied string in the returned Stream.
    new URL(item.videoUrl);
    if (!/^https?:$/i.test(new URL(item.videoUrl).protocol)) throw new Error("unsupported protocol");
    mediaUrl = item.videoUrl;
  } catch {
    console.log("[loopstream] invalid video URL", { title: item.title, videoUrl: item.videoUrl });
    return [];
  }

  const urlType = getMediaTypeFromUrl(mediaUrl);
  if (urlType && urlType !== mediaType) {
    console.log("[loopstream] source type does not match URL", {
      title: item.title,
      sourceType: mediaType,
      videoUrl: mediaUrl,
      urlType,
    });
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

function mapMediaType(sourceType: LoopstreamItem["sourceType"]): "mp4" | "m3u8" | null {
  if (sourceType === "mp4" || sourceType === "m3u8") return sourceType;
  return null;
}

function createDirectStream(link: string): Stream | null {
  try {
    const parsed = new URL(link);
    if (!/^https?:$/i.test(parsed.protocol)) return null;
    const mediaUrl = link;

    const pathname = new URL(mediaUrl).pathname;
    const extension = getMediaTypeFromUrl(mediaUrl);
    if (!extension) return null;

    return {
      server: "Loopstream direct",
      link: mediaUrl,
      type: extension,
      ...(extension === "mp4" && /(?:^|[._-])(2160|1080|720|480|360)p?(?:[._-]|$)/i.test(mediaUrl)
        ? { quality: mediaUrl.match(/(?:^|[._-])(2160|1080|720|480|360)p?(?:[._-]|$)/i)?.[1] }
        : {}),
    };
  } catch {
    return null;
  }
}

function getMediaTypeFromUrl(mediaUrl: string): "mp4" | "m3u8" | null {
  const pathname = new URL(mediaUrl).pathname;
  return pathname.match(/\.(mp4|m3u8)$/i)?.[1]?.toLowerCase() as
    | "mp4"
    | "m3u8"
    | undefined || null;
}

