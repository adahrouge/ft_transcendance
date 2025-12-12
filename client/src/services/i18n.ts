import en from '../languages/en.json';
import fr from '../languages/fr.json';
import ar from '../languages/ar.json';

type Language = 'en' | 'fr' | 'ar';
type Translations = typeof en;

class I18nService {
  private currentLang: Language = 'en';
  private translations: Record<Language, Translations> = {
    en,
    fr,
    ar
  };

  constructor() {
    const saved = localStorage.getItem('language') as Language;
    if (saved && ['en', 'fr', 'ar'].includes(saved)) {
      this.currentLang = saved;
    }
    this.updateDirection();
  }

  setLanguage(lang: Language) {
    this.currentLang = lang;
    localStorage.setItem('language', lang);
    this.updateDirection();
    window.location.reload(); // Simple reload to apply changes across the app
  }

  getLanguage(): Language {
    return this.currentLang;
  }

  t(key: keyof Translations): string {
    return this.translations[this.currentLang][key] || key;
  }

  private updateDirection() {
    if (this.currentLang === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = this.currentLang;
    }
  }
}

export const i18n = new I18nService();
