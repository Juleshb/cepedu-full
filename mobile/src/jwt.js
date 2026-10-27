function decodeBase64(input) {
  if (typeof globalThis.atob === "function") return globalThis.atob(input);

  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const cleaned = input.replace(/=+$/, "");
  let output = "";

  for (let index = 0; index < cleaned.length; index += 4) {
    const a = alphabet.indexOf(cleaned[index]);
    const b = alphabet.indexOf(cleaned[index + 1]);
    const c = alphabet.indexOf(cleaned[index + 2]);
    const d = alphabet.indexOf(cleaned[index + 3]);
    const bits =
      (a << 18) |
      (b << 12) |
      ((c < 0 ? 0 : c) << 6) |
      (d < 0 ? 0 : d);

    output += String.fromCharCode((bits >> 16) & 255);
    if (cleaned[index + 2] !== undefined) {
      output += String.fromCharCode((bits >> 8) & 255);
    }
    if (cleaned[index + 3] !== undefined) {
      output += String.fromCharCode(bits & 255);
    }
  }

  return output;
}

export function decodeJwt(token) {
  try {
    const segment = String(token || "").split(".")[1];
    if (!segment) return null;

    const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );
    const binary = decodeBase64(padded);
    const json = decodeURIComponent(
      Array.from(binary, (char) =>
        `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`
      ).join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}
