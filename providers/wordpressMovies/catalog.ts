import { Catalog, ProviderContext } from "../types";
import { apiUrl } from "./utils";

export const catalog: Catalog[] = [{ title: "Latest Movies", filter: "latest" }];

export const genres = async function ({ providerContext }: { providerContext?: ProviderContext } = {}): Promise<Catalog[]> {
  if (!providerContext) return [];
  try {
    const response = await providerContext.axios.get(apiUrl("/wp-json/wp/v2/categories"), {
      headers: providerContext.commonHeaders,
      params: { per_page: 100, hide_empty: true },
    });
    return (Array.isArray(response.data) ? response.data : []).map((category: any) => ({
      title: String(category.name || "Category"),
      filter: `category:${Number(category.id)}`,
    }));
  } catch {
    return [];
  }
};
