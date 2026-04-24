/**
 * i18n.js — Simple two-language system (ru / en)
 *
 * Priority:
 *  1. localStorage key 'app_language'
 *  2. Telegram initData language_code
 *  3. Fallback → 'ru'
 */
import { create } from 'zustand';
import ru from './locales/ru';
import en from './locales/en';

const LOCALES = { ru, en };
const STORAGE_KEY = 'app_language';
const SUPPORTED   = ['ru', 'en'];

function resolveInitialLang() {
  // 1. Persisted user choice
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && SUPPORTED.includes(saved)) return saved;

  // 2. Telegram language_code (set by the store after auth — we read it here lazily)
  // We also check window.Telegram.WebApp for immediate access
  try {
    const tgLang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
    if (tgLang === 'en') return 'en';
  } catch {}

  // 3. Fallback
  return 'ru';
}

// ─── Zustand language store ────────────────────────────────────────────────────
export const useLanguageStore = create((set, get) => ({
  lang: resolveInitialLang(),

  setLang: (lang) => {
    if (!SUPPORTED.includes(lang)) return;
    localStorage.setItem(STORAGE_KEY, lang);
    set({ lang });
  },

  /** Sync from Telegram user.language_code if no saved preference. */
  syncFromTelegram: (langCode) => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return; // user already chose manually — respect their choice
    const lang = langCode === 'en' ? 'en' : 'ru';
    set({ lang });
  },

  /** Get the translation for a key, with optional {{var}} interpolation. */
  t: (key, vars) => {
    const { lang } = get();
    const dict = LOCALES[lang] ?? LOCALES.ru;
    let str = dict[key] ?? LOCALES.ru[key] ?? key; // fallback chain: current → ru → key
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{{${k}}}`, String(v));
      });
    }
    return str;
  },
}));

// ─── Convenience hook ──────────────────────────────────────────────────────────
export function useTranslation() {
  const lang   = useLanguageStore((s) => s.lang);
  const setLang = useLanguageStore((s) => s.setLang);
  const _t      = useLanguageStore((s) => s.t);

  /** t('key') or t('key', { name: 'Ivan' }) */
  const t = (key, vars) => _t(key, vars);

  return { t, lang, setLang };
}
