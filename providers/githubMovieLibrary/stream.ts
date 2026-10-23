import { ProviderContext, Stream } from "../types";
import { DEFAULT_MOVIES_URL, parseMovieLibrary } from "./library";

export const getStream = async function ({ link, providerContext }: { link: string; type: string; signal?: AbortSignal; providerContext: ProviderContext; isDownload?: boolean }): Promise<Stream[]> {
  try {
    const url = new URL(link);
    if (!/^https?:$/.test(url.protocol) || !/\.(mp4|m3u8)$/i.test(url.pathname)) return [];

    let quality: string | undefined;
    try {
      const configured = await providerContext.kvStore.get<string>("moviesUrl");
      const jsonUrl = configured?.trim() || DEFAULT_MOVIES_URL;
      const response = await providerContext.axios.get(jsonUrl, { headers: providerContext.commonHeaders });
      const movies = parseMovieLibrary(response.data).movies;
      const match = movies.flatMap((movie) => movie.qualities.map((item) => ({ movie, item })))
        .find(({ item }) => item.url === url.href);
      quality = match?.item.label;
      console.log("GitHub Movie Library stream selection", {
        movieId: match?.movie.id || "unknown",
        quality: quality || "unknown",
        host: url.hostname,
      });
    } catch (error) {
      console.warn("GitHub Movie Library JSON diagnostics unavailable; continuing with direct stream", {
        host: url.hostname,
        errorType: error instanceof Error ? error.name : "unknown",
      });
    }

    const stream: Stream = {
      server: "GitHub Movie Library direct",
      link: url.href,
      type: /\.m3u8$/i.test(url.pathname) ? "m3u8" : "mp4",
      ...(quality ? { quality } : {}),
    };
    console.log("GitHub Movie Library direct stream", { host: url.hostname, type: stream.type, quality: stream.quality || "unknown" });
    return [stream];
  } catch {
    return [];
  }
};
