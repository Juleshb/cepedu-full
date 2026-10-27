import Constants from "expo-constants";
import { Platform } from "react-native";

function debuggerHost() {
  const hostUri =
    Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost || "";
  return hostUri.split(":")[0];
}

export function resolveApiBase() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const host = debuggerHost();
  if (host) return `http://${host}:4000/api`;

  const fallback = Platform.OS === "android" ? "10.0.2.2" : "localhost";
  return `http://${fallback}:4000/api`;
}

export const API_BASE = resolveApiBase();

export const SUPPORT_PHONE = "+250792445913";
export const SUPPORT_WHATSAPP = "https://wa.me/250792445913";
