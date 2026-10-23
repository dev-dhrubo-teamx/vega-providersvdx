export const DEFAULT_MOVIES_URL =
  "https://raw.githubusercontent.com/dev-dhrubo-teamx/vega-providersvdx/refs/heads/main/movies.json";

export interface MovieQuality {
  label?: string;
  url?: string;
  type?: string;
}

export interface Movie {
  id: string;
  title: string;
  poster?: string;
  description?: string;
  year?: number | string;
  genres?: string[];
  qualities: MovieQuality[];
}

export interface MovieLibrary {
  movies: Movie[];
}

export function parseMovieLibrary(value: unknown): MovieLibrary {
  const rawMovies = (value && typeof value === "object" && "movies" in value)
    ? (value as { movies?: unknown }).movies
    : [];

  if (!Array.isArray(rawMovies)) return { movies: [] };

  const movies = rawMovies.flatMap((raw): Movie[] => {
    if (!raw || typeof raw !== "object") return [];
    const item = raw as Record<string, unknown>;
    const id = typeof item.id === "string" ? item.id.trim() : "";
    const title = typeof item.title === "string" ? item.title.trim() : "";
    if (!id || !title) return [];
    const qualities = Array.isArray(item.qualities)
      ? item.qualities.filter((quality): quality is MovieQuality => {
          if (!quality || typeof quality !== "object") return false;
          const q = quality as MovieQuality;
          return typeof q.url === "string" && /^https?:\/\//i.test(q.url);
        })
      : [];
    return [{
      id,
      title,
      poster: typeof item.poster === "string" ? item.poster : "",
      description: typeof item.description === "string" ? item.description : "",
      year: typeof item.year === "number" || typeof item.year === "string" ? item.year : undefined,
      genres: Array.isArray(item.genres) ? item.genres.filter((g): g is string => typeof g === "string") : [],
      qualities,
    }];
  });

  return { movies };
}

export function movieLink(id: string): string {
  return `github-library://${encodeURIComponent(id)}`;
}

export function movieIdFromLink(link: string): string {
  return decodeURIComponent(link.replace(/^github-library:\/\//, ""));
}
