const PRODUCTION_API = "http://188.137.183.73:4000/api";

export function resolveApiBase() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return PRODUCTION_API;
}

export const API_BASE = resolveApiBase();

export const SUPPORT_PHONE = "+250792445913";
export const SUPPORT_WHATSAPP = "https://wa.me/250792445913";
