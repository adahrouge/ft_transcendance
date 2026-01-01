import { i18n } from "../../services/i18n";
import type { ProfileUser } from "../../types/profile";

export function createAccountDetails(user: ProfileUser): string {
  return `
    <div class="profile-section">
      <h3 class="profile-section-title">${i18n.t("account_details")}</h3>
      <div class="profile-form-row">
        <div class="profile-form-group">
          <label class="profile-label">${i18n.t("display_name")}</label>
          <input type="text" id="display-name" value="${
            user.display_name || user.username
          }"
                  class="profile-input" placeholder="${i18n.t(
                    "display_name"
                  )}">
          <div id="display-name-error" class="profile-field-error"></div>
        </div>
        <div class="profile-form-group">
          <label class="profile-label">${i18n.t("email")}</label>
          <input type="email" id="email" value="${user.email}"
                  class="profile-input profile-input-disabled" disabled>
          <div class="profile-field-hint">${i18n.t(
            "email_cannot_be_changed"
          )}</div>
        </div>
      </div>
    </div>
  `;
}
