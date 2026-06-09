export const NICE_SOURCE_MODE = {
  enabled: import.meta.env?.VITE_NICE_API_ENABLED === "true",
  mode: import.meta.env?.VITE_NICE_API_ENABLED === "true" ? "backend-required" : "mock/offline",
  frontendApiKeyAllowed: false,
  edgeFunctions: ["nice-search", "nice-sync-guidance", "clinical-source-refresh"],
};

export async function searchNiceSources(query) {
  return {
    ok: false,
    mode: NICE_SOURCE_MODE.mode,
    query,
    message: "NICE API search is disabled in the frontend. Use Supabase Edge Functions after NICE syndication access and licence terms are confirmed.",
    results: [],
  };
}

export function buildClinicalSourceMetadata({ title, url, organisation = "NICE", contentType = "Guidance metadata" }) {
  return {
    id: `source-${Date.now()}`,
    title,
    url,
    organisation,
    contentType,
    retrievedAt: new Date().toISOString(),
    licenceStatus: "Requires NICE syndication/licence confirmation",
    aiUseAllowed: false,
  };
}
