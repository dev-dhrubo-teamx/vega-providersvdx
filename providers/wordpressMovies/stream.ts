import { ProviderContext, Stream } from "../types";
import { decodePlayback, extractMp4Urls, getPost, isSafeVideoUrl } from "./utils";

export const getStream = async function ({ link, signal, providerContext }: {
  link: string; type?: string; signal?: AbortSignal; providerContext: ProviderContext; isDownload?: boolean;
}): Promise<Stream[]> {
  try {
    const descriptor = decodePlayback(link);
    const post = await getPost(providerContext, descriptor.postId, signal);
    const sources = extractMp4Urls(post.content?.rendered || "", providerContext.cheerio)
      .filter(isSafeVideoUrl);
    if (!sources.length) return [];
    return sources.map((source, index) => ({
      server: `WordPress MP4 ${index + 1}`,
      link: source,
      type: "mp4",
    } satisfies Stream));
  } catch (error) {
    if (error instanceof Error && /Invalid WordPress post ID/i.test(error.message)) throw error;
    throw new Error(`WordPress Movies stream failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};
