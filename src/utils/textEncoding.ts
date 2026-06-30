const SUSPICIOUS_ENCODING_PATTERN = /[\u00c2\u00c3\u00e2\u00ef\ufffd]/g;

const suspiciousScore = (value: string): number => {
  return (value.match(SUSPICIOUS_ENCODING_PATTERN) || []).length;
};

const decodeLatin1AsUtf8 = (value: string): string => {
  const encoded = Array.from(
    value,
    (char) => `%${(char.charCodeAt(0) & 0xff).toString(16).padStart(2, "0")}`
  ).join("");

  try {
    return decodeURIComponent(encoded);
  } catch {
    const bytes = Uint8Array.from(value, (char) => char.charCodeAt(0) & 0xff);
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  }
};

export const normalizeUtf8Text = (value: string): string => {
  let current = value.replace(/\u00a0/g, " ");

  for (let i = 0; i < 2; i += 1) {
    if (!SUSPICIOUS_ENCODING_PATTERN.test(current)) {
      SUSPICIOUS_ENCODING_PATTERN.lastIndex = 0;
      break;
    }

    SUSPICIOUS_ENCODING_PATTERN.lastIndex = 0;

    const repaired = decodeLatin1AsUtf8(current).replace(/\u00a0/g, " ");
    if (suspiciousScore(repaired) >= suspiciousScore(current)) {
      break;
    }

    current = repaired;
  }

  return current;
};

export const normalizeApiData = <T>(value: T): T => {
  if (typeof value === "string") {
    return normalizeUtf8Text(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeApiData(item)) as T;
  }

  if (value && typeof value === "object") {
    const normalizedEntries = Object.entries(value).map(([key, item]) => [
      key,
      normalizeApiData(item),
    ]);

    return Object.fromEntries(normalizedEntries) as T;
  }

  return value;
};
