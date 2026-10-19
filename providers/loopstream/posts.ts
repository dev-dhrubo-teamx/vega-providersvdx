import { Post, ProviderContext } from "../types";
import { libraryItems } from "./shared";

const PAGE_SIZE = 20;

export const getPosts = async function ({
  filter,
  page,
}: {
  filter: string;
  page: number;
  providerValue: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Post[]> {
  const categoryItems = libraryItems.filter((item) => item.category === filter);
  return toPosts(categoryItems, page);
};

export const getSearchPosts = async function ({
  searchQuery,
  page,
}: {
  searchQuery: string;
  page: number;
  providerValue: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Post[]> {
  const query = searchQuery.trim().toLowerCase();
  const matches = libraryItems.filter((item) => {
    const haystack = [item.title, item.year, item.language, ...(item.tags ?? [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
  return toPosts(matches, page);
};

function toPosts(items: typeof libraryItems, page: number): Post[] {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  return items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE).map((item) => ({
    title: item.title,
    link: item.link,
    image: item.image || "",
  }));
}

