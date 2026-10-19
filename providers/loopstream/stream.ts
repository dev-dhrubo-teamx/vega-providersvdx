import { ProviderContext, Stream } from "../types";
import { findLibraryItem } from "./shared";

export const getStream = async function ({
  link,
}: {
  link: string;
  type: string;
  signal?: AbortSignal;
  providerContext: ProviderContext;
  isDownload?: boolean;
}): Promise<Stream[]> {
  const item = findLibraryItem(link);
  if (!item || item.sourceType === "embed" || !/^https?:\/\//i.test(item.videoUrl)) {
    return [];
  }

  const quality = item.videoUrl.match(/(?:^|[._-])(2160|1080|720|480|360)p?(?:[._-]|$)/i)?.[1];
  return [
    {
      server: "Loopstream direct",
      link: item.videoUrl,
      type: item.sourceType,
      ...(quality ? { quality } : {}),
    },
  ];
};

