import { i18n } from "../../services/i18n";

export function createLanguageSection(): string {
  return `
    <div class="profile-section">
      <h3 class="profile-section-title">${i18n.t("language")}</h3>
      <div class="profile-language-buttons">
        <button type="button" class="profile-lang-btn ${
          i18n.getLanguage() === "en" ? "active" : ""
        }" data-lang="en">English</button>
        <button type="button" class="profile-lang-btn ${
          i18n.getLanguage() === "fr" ? "active" : ""
        }" data-lang="fr">Français</button>
        <button type="button" class="profile-lang-btn ${
          i18n.getLanguage() === "ar" ? "active" : ""
        }" data-lang="ar">العربية</button>
      </div>
    </div>
  `;
}
