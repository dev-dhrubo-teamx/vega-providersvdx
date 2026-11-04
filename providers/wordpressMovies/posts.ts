import { Post, ProviderContext } from "../types";
import { apiUrl, decodeHtml, getFeaturedImage, pageSize, WordPressPost } from "./utils";

function mapPost(post: WordPressPost, cheerio: ProviderContext["cheerio"]): Post {
  return {
    title: decodeHtml(post.title?.rendered || post.slug || `Post ${post.id}`, cheerio),
    link: String(post.id),
    image: getFeaturedImage(post),
    tag: post.date ? new Date(post.date).getFullYear().toString() : undefined,
  };
}

async function requestPosts(providerContext: ProviderContext, page: number, search?: string, category?: number, signal?: AbortSignal): Promise<Post[]> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const params: Record<string, string | number> = { _embed: "1", page: safePage, per_page: pageSize, status: "publish" };
  if (search?.trim()) params.search = search.trim();
  if (category) params.categories = category;
  const response = await providerContext.axios.get(apiUrl("/wp-json/wp/v2/posts"), {
    headers: providerContext.commonHeaders,
    params,
    signal,
  });
  const data = normalizePostsResponse(response);
  return data.map((post: WordPressPost) => mapPost(post, providerContext.cheerio));
}

function normalizePostsResponse(response: { data?: unknown; status?: number; headers?: unknown }): WordPressPost[] {
  let data = response.data;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      throw responseError(response, "response data was not valid JSON text");
    }
  }
  if (Array.isArray(data)) return data as WordPressPost[];

  const wpError = data && typeof data === "object" ? data as Record<string, unknown> : undefined;
  const code = typeof wpError?.code === "string" ? wpError.code : "none";
  const message = typeof wpError?.message === "string" ? wpError.message : "none";
  throw responseError(response, `expected a root JSON array; received ${describeType(data)} (WordPress code: ${code}, message: ${message})`);
}

function describeType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function responseError(response: { data?: unknown; status?: number; headers?: unknown }, detail: string): Error {
  const headers = response.headers && typeof response.headers === "object" ? response.headers as Record<string, unknown> : {};
  const contentType = String(headers["content-type"] || headers["Content-Type"] || "unknown");
  return new Error(`WordPress Movies posts stage failed: HTTP ${response.status ?? "unknown"}; content-type ${contentType}; ${detail}`);
}

export const getPosts = async function ({ filter, page, signal, providerContext }: {
  filter: string; page: number; providerValue: string; signal: AbortSignal; providerContext: ProviderContext;
}): Promise<Post[]> {
  const match = /^category:(\d+)$/.exec(filter || "");
  return requestPosts(providerContext, page, undefined, match ? Number(match[1]) : undefined, signal);
};

export const getSearchPosts = async function ({ searchQuery, page, signal, providerContext }: {
  searchQuery: string; page: number; providerValue: string; signal: AbortSignal; providerContext: ProviderContext;
}): Promise<Post[]> {
  return requestPosts(providerContext, page, searchQuery, undefined, signal);
};
