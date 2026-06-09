export const easyCloudIntegrationStatus = {
  enabled: false,
  mode: "mock/offline",
  credentialLocation: "Supabase Edge Function secret store only",
  frontendSecretAllowed: false,
  requiredFunctions: [
    "supabase/functions/easycloud-sync",
    "supabase/functions/easycloud-device-refresh",
    "supabase/functions/easycloud-alarm-webhook",
  ],
};

export async function fetchEasyCloudDevices() {
  return {
    ok: false,
    mode: "mock/offline",
    message: "EasyLog Cloud API credentials are not configured. Contact Lascar/EasyLog Cloud for documentation, access terms and authentication details.",
    devices: [],
  };
}

export async function syncEasyCloudReadings() {
  return {
    ok: false,
    mode: "mock/offline",
    message: "Real sync must run server-side through a Supabase Edge Function. Frontend credentials are not supported.",
  };
}
