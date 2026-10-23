import { ProviderContext, Stream } from "../types";

export const getStream = async function ({ link }: { link: string; type: string; signal?: AbortSignal; providerContext: ProviderContext; isDownload?: boolean }): Promise<Stream[]> {
  try {
    const url = new URL(link);
    if (!/^https?:$/.test(url.protocol) || !/\.mp4$/i.test(url.pathname)) return [];
    return [{ server: "GitHub Movie Library direct", link: url.href, type: "mp4" }];
  } catch {
    return [];
  }
};
