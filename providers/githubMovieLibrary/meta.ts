import { Info, ProviderContext } from "../types";
import { DEFAULT_MOVIES_URL, movieIdFromLink, parseMovieLibrary } from "./library";

export const getMeta = async function ({ link, providerContext }: { link: string; providerContext: ProviderContext }): Promise<Info> {
  const configured = await providerContext.kvStore.get<string>("moviesUrl");
  const response = await providerContext.axios.get(configured?.trim() || DEFAULT_MOVIES_URL, { headers: providerContext.commonHeaders });
  const movie = parseMovieLibrary(response.data).movies.find((item) => item.id === movieIdFromLink(link));
  if (!movie) throw new Error(`GitHub Movie Library: movie not found (${link})`);
  return {
    title: movie.title, image: movie.poster || "", synopsis: movie.description || "", imdbId: "", type: "movie",
    tags: movie.genres, linkList: movie.qualities.map((quality) => ({
      title: quality.label || "Video", quality: quality.label || "", directLinks: [{ title: movie.title, link: quality.url!, type: "movie" }],
    })),
  };
};
