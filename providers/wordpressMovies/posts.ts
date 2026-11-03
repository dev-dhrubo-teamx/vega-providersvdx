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
  if (!Array.isArray(response.data)) throw new Error("WordPress posts response was not an array");
  return response.data.map((post: WordPressPost) => mapPost(post, providerContext.cheerio));
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
