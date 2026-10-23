import { Post, ProviderContext } from "../types";
import { DEFAULT_MOVIES_URL, movieLink, parseMovieLibrary } from "./library";

async function loadMovies(providerContext: ProviderContext) {
  const configured = await providerContext.kvStore.get<string>("moviesUrl");
  const url = configured?.trim() || DEFAULT_MOVIES_URL;
  const response = await providerContext.axios.get(url, { headers: providerContext.commonHeaders });
  return parseMovieLibrary(response.data).movies;
}

export const getPosts = async function ({ providerContext }: {
  filter: string; page: number; providerValue: string; signal: AbortSignal; providerContext: ProviderContext;
}): Promise<Post[]> {
  try {
    return (await loadMovies(providerContext)).map((movie) => ({ title: movie.title, link: movieLink(movie.id), image: movie.poster || "" }));
  } catch (error) {
    console.warn("GitHub Movie Library: unable to load movies", error);
    return [];
  }
};

export const getSearchPosts = async function ({ searchQuery, providerContext }: {
  searchQuery: string; page: number; providerValue: string; signal: AbortSignal; providerContext: ProviderContext;
}): Promise<Post[]> {
  const query = searchQuery.trim().toLowerCase();
  const posts = await getPosts({ filter: "all", page: 1, providerValue: "", signal: new AbortController().signal, providerContext });
  return query ? posts.filter((post) => post.title.toLowerCase().includes(query)) : posts;
};
