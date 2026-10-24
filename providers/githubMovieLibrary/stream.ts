import { ProviderContext, Stream } from "../types";
import { DEFAULT_MOVIES_URL, parseMovieLibrary } from "./library";

export const getStream = async function ({ link, providerContext }: { link: string; type: string; signal?: AbortSignal; providerContext: ProviderContext; isDownload?: boolean }): Promise<Stream[]> {
  try {
    // The link from meta is already the final media URL. Do not fetch it as a
    // page or replace it with a normalized/encoded variant before playback.
    const parsedUrl = new URL(link);
    if (!/^https?:$/.test(parsedUrl.protocol) || !/\.mp4$/i.test(parsedUrl.pathname)) return [];
    const mediaUrl = link;

    let quality: string | undefined;
    try {
      const configured = await providerContext.kvStore.get<string>("moviesUrl");
      const jsonUrl = configured?.trim() || DEFAULT_MOVIES_URL;
      const response = await providerContext.axios.get(jsonUrl, { headers: providerContext.commonHeaders });
      const movies = parseMovieLibrary(response.data).movies;
      const matches = movies.flatMap((movie) => movie.qualities.map((item) => ({ movie, item })))
        .filter(({ item }) => item.url === mediaUrl);
      // A URL can be listed under multiple labels. In that case the stream
      // boundary has no quality information, so never report a guessed label.
      const match = matches.length === 1 ? matches[0] : undefined;
      quality = match?.item.label;
      console.log("GitHub Movie Library stream selection", {
        movieId: match?.movie.id || (matches[0]?.movie.id || "unknown"),
        quality: quality || "unknown",
        host: parsedUrl.hostname,
      });
    } catch (error) {
      console.warn("GitHub Movie Library JSON diagnostics unavailable; continuing with direct stream", {
        host: parsedUrl.hostname,
        errorType: error instanceof Error ? error.name : "unknown",
      });
    }

    const stream: Stream = {
      server: "GitHub Movie Library direct",
      link: mediaUrl,
      type: "mp4",
      ...(quality ? { quality } : {}),
    };
    console.log("GitHub Movie Library direct stream", { host: parsedUrl.hostname, type: stream.type, quality: stream.quality || "unknown" });
    return [stream];
  } catch {
    return [];
  }
};
