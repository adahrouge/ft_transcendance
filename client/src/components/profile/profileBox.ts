import { i18n } from "../../services/i18n";
import type { ProfileUser } from "../../types/profile";
import { createProfileHeader } from "./profileHeader";
import { createAccountDetails } from "./accountDetails";
import { createLanguageSection } from "./languageSection";
import { createPasswordSection } from "./passwordSection";
import { createActionButtons } from "./actionButtons";
import { createDangerZone } from "./dangerZone";

export function createProfileBox(user: ProfileUser): string {
  return `
    <div class="profile-box">
      <h2 class="profile-title">${i18n.t("my_profile")}</h2>
      
      ${createProfileHeader(user)}

      <form id="profile-form" class="profile-form">
        ${createAccountDetails(user)}
        ${createLanguageSection()}
        ${createPasswordSection()}
        ${createActionButtons()}
      </form>

      ${createDangerZone()}
    </div>
  `;
}
