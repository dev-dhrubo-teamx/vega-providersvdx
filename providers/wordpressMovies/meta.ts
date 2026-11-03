import { Info, ProviderContext } from "../types";
import { decodeHtml, encodePlayback, extractMp4Urls, getFeaturedImage, getPost, WordPressPost } from "./utils";

function categories(post: WordPressPost): string[] {
  return (post._embedded?.["wp:term"] || []).flatMap((groups: any[]) => groups || [])
    .filter((term: any) => term?.taxonomy === "category" && term?.name)
    .map((term: any) => String(term.name));
}

export const getMeta = async function ({ link, providerContext, signal }: {
  link: string; providerContext: ProviderContext; signal?: AbortSignal;
}): Promise<Info> {
  const postId = Number(link);
  if (!Number.isInteger(postId) || postId < 1) throw new Error("WordPress Movies: invalid post ID");
  const post = await getPost(providerContext, postId, signal);
  const title = decodeHtml(post.title?.rendered || post.slug || `Post ${post.id}`, providerContext.cheerio);
  const description = decodeHtml(post.content?.rendered || post.excerpt?.rendered || "", providerContext.cheerio);
  const sources = extractMp4Urls(post.content?.rendered || "", providerContext.cheerio);
  const descriptor = encodePlayback({ postId, sources });
  return {
    title,
    synopsis: description,
    image: getFeaturedImage(post),
    poster: getFeaturedImage(post),
    imdbId: "",
    type: "movie",
    tags: [...categories(post), post.date ? new Date(post.date).getFullYear().toString() : ""].filter(Boolean),
    linkList: [{ title: "Movie", directLinks: [{ title: "Movie", link: descriptor, type: "movie" }] }],
    webUrl: post.link,
  };
};
