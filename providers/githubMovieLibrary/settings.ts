import { ProviderContext, SettingsField } from "../types";
import { DEFAULT_MOVIES_URL } from "./library";

export const getSettingsSchema = async function ({
  providerContext: _providerContext,
}: { providerContext: ProviderContext }): Promise<SettingsField[]> {
  return [{
    key: "moviesUrl",
    type: "text",
    label: "Movies JSON raw GitHub URL",
    description: "Public raw URL for your authorized movie library JSON file.",
    placeholder: DEFAULT_MOVIES_URL,
    defaultValue: DEFAULT_MOVIES_URL,
  }];
};
