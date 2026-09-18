/**
 * Language Detection & Script Utilities for OmniAI Multilingual Engine
 */

export interface LanguageMeta {
  code: string; // ISO 639-1 or composite (e.g. 'hi', 'hi-Latn', 'ar', 'es')
  name: string; // English name e.g. "Hindi", "Hinglish"
  nativeName: string; // Native script name e.g. "हिन्दी", "العربية"
  region: "Indian" | "Middle Eastern" | "European" | "Asian" | "Global";
  isRTL: boolean;
  family: "indo-aryan" | "rtl" | "cjk" | "latin" | "other";
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  // Global / Default
  { code: "auto", name: "Auto (Customer Native)", nativeName: "Auto", region: "Global", isRTL: false, family: "other" },
  { code: "en", name: "English", nativeName: "English", region: "Global", isRTL: false, family: "latin" },

  // Indian Languages & Hinglish
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", region: "Indian", isRTL: false, family: "indo-aryan" },
  { code: "hi-Latn", name: "Hinglish", nativeName: "Hinglish (Hindi in Roman)", region: "Indian", isRTL: false, family: "indo-aryan" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", region: "Indian", isRTL: false, family: "indo-aryan" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", region: "Indian", isRTL: false, family: "indo-aryan" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", region: "Indian", isRTL: false, family: "indo-aryan" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", region: "Indian", isRTL: false, family: "indo-aryan" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", region: "Indian", isRTL: false, family: "indo-aryan" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", region: "Indian", isRTL: false, family: "indo-aryan" },

  // Middle Eastern (RTL)
  { code: "ar", name: "Arabic", nativeName: "العربية", region: "Middle Eastern", isRTL: true, family: "rtl" },
  { code: "ur", name: "Urdu", nativeName: "اردو", region: "Middle Eastern", isRTL: true, family: "rtl" },
  { code: "fa", name: "Persian (Farsi)", nativeName: "فارسی", region: "Middle Eastern", isRTL: true, family: "rtl" },
  { code: "he", name: "Hebrew", nativeName: "עברית", region: "Middle Eastern", isRTL: true, family: "rtl" },

  // European
  { code: "es", name: "Spanish", nativeName: "Español", region: "European", isRTL: false, family: "latin" },
  { code: "fr", name: "French", nativeName: "Français", region: "European", isRTL: false, family: "latin" },
  { code: "de", name: "German", nativeName: "Deutsch", region: "European", isRTL: false, family: "latin" },
  { code: "it", name: "Italian", nativeName: "Italiano", region: "European", isRTL: false, family: "latin" },
  { code: "pt", name: "Portuguese", nativeName: "Português", region: "European", isRTL: false, family: "latin" },
  { code: "ru", name: "Russian", nativeName: "Русский", region: "European", isRTL: false, family: "latin" },

  // Asian (CJK & East Asian)
  { code: "zh", name: "Mandarin Chinese", nativeName: "中文 (简体)", region: "Asian", isRTL: false, family: "cjk" },
  { code: "ja", name: "Japanese", nativeName: "日本語", region: "Asian", isRTL: false, family: "cjk" },
  { code: "ko", name: "Korean", nativeName: "한국어", region: "Asian", isRTL: false, family: "cjk" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", region: "Asian", isRTL: false, family: "latin" },
];

// RTL detection based on script regex
const RTL_REGEX = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;

// Devanagari regex (Hindi, Marathi, Sanskrit, Nepali)
const DEVANAGARI_REGEX = /[\u0900-\u097F]/;

// Bengali regex
const BENGALI_REGEX = /[\u0980-\u09FF]/;

// Tamil regex
const TAMIL_REGEX = /[\u0B80-\u0BFF]/;

// Telugu regex
const TELUGU_REGEX = /[\u0C00-\u0C7F]/;

// Arabic script regex (Arabic, Urdu, Persian)
const ARABIC_SCRIPT_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

// CJK regex (Chinese, Japanese Kanji)
const CJK_REGEX = /[\u4E00-\u9FFF\u3400-\u4DBF]/;

// Japanese Hiragana & Katakana
const JAPANESE_KANA_REGEX = /[\u3040-\u309F\u30A0-\u30FF]/;

// Korean Hangul
const KOREAN_HANGUL_REGEX = /[\uAC00-\uD7AF\u1100-\u11FF]/;

// Hinglish vocabulary markers in Roman Latin script
const HINGLISH_MARKERS = [
  /\b(?:kya|kyun|kaise|kab|kahan|hai|hain|ho|tha|the|thi|hoga|hogi|honge)\b/i,
  /\b(?:nahi|nahin|mat|bhi|aur|ya|lekin|par|magar|toh|agar)\b/i,
  /\b(?:mera|meri|mere|aap|aapka|aapki|aapke|tum|tumhara|hum|hamaara)\b/i,
  /\b(?:bhai|yaar|karo|kardo|kijiye|bhejo|batao|dekh|dekho|chahiye)\b/i,
  /\b(?:paise|rupaye|paisa|khata|jaldi|turant|shukriya|dhanyawad)\b/i,
];

/**
 * Checks if a language code or string content is Right-to-Left (RTL)
 */
export function isRTL(langCodeOrText?: string | null): boolean {
  if (!langCodeOrText) return false;
  const lower = langCodeOrText.toLowerCase().trim();
  if (lower === "ar" || lower === "ur" || lower === "fa" || lower === "he" || lower === "arabic" || lower === "urdu" || lower === "hebrew" || lower === "persian" || lower === "farsi") {
    return true;
  }
  return RTL_REGEX.test(langCodeOrText);
}

/**
 * Gets language family for styling badges (Saffron for Indic, Blue for RTL, Green for CJK, White for Latin)
 */
export function getLanguageFamily(langCodeOrName?: string | null): "indo-aryan" | "rtl" | "cjk" | "latin" | "other" {
  if (!langCodeOrName) return "other";
  const lower = langCodeOrName.toLowerCase().trim();

  // Check supported list
  const found = SUPPORTED_LANGUAGES.find(
    (l) => l.code.toLowerCase() === lower || l.name.toLowerCase() === lower || l.nativeName.toLowerCase() === lower
  );
  if (found && found.family) return found.family;

  if (isRTL(lower)) return "rtl";
  if (DEVANAGARI_REGEX.test(langCodeOrName) || lower.includes("hindi") || lower.includes("hinglish") || lower.includes("bengali") || lower.includes("tamil")) {
    return "indo-aryan";
  }
  if (CJK_REGEX.test(langCodeOrName) || JAPANESE_KANA_REGEX.test(langCodeOrName) || KOREAN_HANGUL_REGEX.test(langCodeOrName)) {
    return "cjk";
  }
  return "latin";
}

/**
 * Fast client-side / heuristic language detector for quick preview & fallbacks
 */
export function detectLanguageHeuristic(text: string): { name: string; iso: string; isRTL: boolean; family: "indo-aryan" | "rtl" | "cjk" | "latin" | "other" } {
  if (!text || !text.trim()) {
    return { name: "English", iso: "en", isRTL: false, family: "latin" };
  }

  // 1. Devanagari script (Hindi)
  if (DEVANAGARI_REGEX.test(text)) {
    return { name: "Hindi", iso: "hi", isRTL: false, family: "indo-aryan" };
  }

  // 2. Bengali script
  if (BENGALI_REGEX.test(text)) {
    return { name: "Bengali", iso: "bn", isRTL: false, family: "indo-aryan" };
  }

  // 3. Tamil script
  if (TAMIL_REGEX.test(text)) {
    return { name: "Tamil", iso: "ta", isRTL: false, family: "indo-aryan" };
  }

  // 4. Telugu script
  if (TELUGU_REGEX.test(text)) {
    return { name: "Telugu", iso: "te", isRTL: false, family: "indo-aryan" };
  }

  // 5. Arabic / Urdu / Farsi
  if (ARABIC_SCRIPT_REGEX.test(text)) {
    return { name: "Arabic", iso: "ar", isRTL: true, family: "rtl" };
  }

  // 6. Japanese
  if (JAPANESE_KANA_REGEX.test(text)) {
    return { name: "Japanese", iso: "ja", isRTL: false, family: "cjk" };
  }

  // 7. Korean
  if (KOREAN_HANGUL_REGEX.test(text)) {
    return { name: "Korean", iso: "ko", isRTL: false, family: "cjk" };
  }

  // 8. Chinese (CJK without Kana/Hangul)
  if (CJK_REGEX.test(text)) {
    return { name: "Mandarin Chinese", iso: "zh", isRTL: false, family: "cjk" };
  }

  // 9. Hinglish (Latin letters + Hindi colloquial words)
  let hinglishScore = 0;
  for (const marker of HINGLISH_MARKERS) {
    if (marker.test(text)) hinglishScore++;
  }
  if (hinglishScore >= 2) {
    return { name: "Hinglish", iso: "hi-Latn", isRTL: false, family: "indo-aryan" };
  }

  // 10. Spanish keywords
  if (/\b(?:hola|por favor|gracias|reembolso|ayuda|pedido|dinero|cuenta|factura|urgente)\b/i.test(text)) {
    return { name: "Spanish", iso: "es", isRTL: false, family: "latin" };
  }

  // 11. French keywords
  if (/\b(?:bonjour|s'il vous plaît|merci|remboursement|aide|commande|argent|compte|urgent)\b/i.test(text)) {
    return { name: "French", iso: "fr", isRTL: false, family: "latin" };
  }

  // 12. German keywords
  if (/\b(?:hallo|bitte|danke|rückerstattung|hilfe|bestellung|geld|konto|rechnung|dringend)\b/i.test(text)) {
    return { name: "German", iso: "de", isRTL: false, family: "latin" };
  }

  // Default: English
  return { name: "English", iso: "en", isRTL: false, family: "latin" };
}
