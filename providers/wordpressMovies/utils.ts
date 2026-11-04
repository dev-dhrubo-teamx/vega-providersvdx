import { ProviderContext } from "../types";

export const providerValue = "wordpressMovies";
export const defaultBaseUrl = "https://procloudstream.ifree.page";
export const pageSize = 20;

export type WordPressPost = {
  id: number;
  slug: string;
  date?: string;
  link?: string;
  title?: { rendered?: string };
  content?: { rendered?: string };
  excerpt?: { rendered?: string };
  categories?: number[];
  _embedded?: {
    [key: string]: any;
  };
};

export type PlaybackDescriptor = {
  postId: number;
  sources?: string[];
};

export function apiUrl(path: string): string {
  return new URL(path.replace(/^\//, ""), `${defaultBaseUrl}/`).toString();
}

export function decodeHtml(value: string, cheerio: ProviderContext["cheerio"]): string {
  return cheerio.load(`<div>${value}</div>`)("div").text().trim();
}

/** Extract readable post copy while excluding media, navigation, and video-link labels. */
export function extractDescription(value: string, cheerio: ProviderContext["cheerio"]): string {
  const $ = cheerio.load(value || "");
  $("img, picture, figure, video, audio, source, script, style, nav, header, footer, a").remove();
  return $("body").text().replace(/\s+/g, " ").trim();
}

export function getFeaturedImage(post: WordPressPost): string {
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  return String(media?.source_url || media?.media_details?.sizes?.full?.source_url || "");
}

function trimUrl(value: string): string {
  return value.replace(/[),.;!?\]}>'"]+$/g, "");
}

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  return parts[0] === 10 || parts[0] === 127 || (parts[0] === 192 && parts[1] === 168) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || parts[0] === 0;
}

export function isSafeVideoUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    if (!/^https?:$/.test(parsed.protocol) || parsed.username || parsed.password) return false;
    const hostname = parsed.hostname.toLowerCase();
    if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost") || hostname === "::1" || isPrivateIpv4(hostname)) return false;
    return /\.mp4$/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

export function extractMp4Urls(html: string, cheerio: ProviderContext["cheerio"]): string[] {
  const $ = cheerio.load(html || "");
  const candidates: string[] = [];
  $("a[href]").each((_, element) => candidates.push($(element).attr("href") || ""));
  // Keep boundaries between HTML nodes so a URL is not joined to adjacent link text.
  const text = (html || "").replace(/<[^>]*>/g, " ");
  candidates.push(...text.match(/https?:\/\/[^\s<>"']+\.mp4(?:\?[^\s<>"']*)?/gi) || []);
  return [...new Set(candidates.map(trimUrl).filter(isSafeVideoUrl))];
}

export function encodePlayback(descriptor: PlaybackDescriptor): string {
  return JSON.stringify(descriptor);
}

export function decodePlayback(value: string): PlaybackDescriptor {
  const parsed = JSON.parse(value) as PlaybackDescriptor;
  if (!Number.isInteger(parsed.postId) || parsed.postId < 1) throw new Error("Invalid WordPress post ID");
  return parsed;
}

export async function getPost(providerContext: ProviderContext, postId: number, signal?: AbortSignal): Promise<WordPressPost> {
  const response = await providerContext.axios.get(apiUrl(`/wp-json/wp/v2/posts/${postId}`), {
    headers: providerContext.commonHeaders,
    params: { _embed: "1" },
    signal,
  });
  return response.data as WordPressPost;
}
