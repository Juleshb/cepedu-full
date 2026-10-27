import * as SecureStore from "expo-secure-store";

const KEY = "cepedhu.member.session";

export async function loadSession() {
  const raw = await SecureStore.getItemAsync(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    await SecureStore.deleteItemAsync(KEY);
    return null;
  }
}

export async function saveSession(session) {
  await SecureStore.setItemAsync(KEY, JSON.stringify(session));
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(KEY);
}
