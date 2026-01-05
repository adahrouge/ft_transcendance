import { profileService } from "../../services/profile";
import { authService } from "../../services/auth";
import { navigateTo } from "../../router";
import { i18n } from "../../services/i18n";
import { showNotification, showConfirm } from "../notifications";
import type { ProfileUser } from "../../types/profile";
import { validatePasswordFields, clearFormErrors, showFieldError, showMessage, clearMessage } from "./validation";

export function setupNavigationButtons() {
  document
    .getElementById("btn-back")
    ?.addEventListener("click", () => navigateTo("/home"));
  
  document.getElementById("btn-logout")?.addEventListener("click", () => {
    authService.logout();
    navigateTo("/auth");
  });
}

export function setupFormSubmission(user: ProfileUser) {
  document.getElementById("profile-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;

    const displayNameInput = document.getElementById("display-name") as HTMLInputElement;
    const currentPasswordInput = document.getElementById("current-password") as HTMLInputElement;
    const newPasswordInput = document.getElementById("new-password") as HTMLInputElement;

    const displayName = displayNameInput.value.trim();
    const currentPass = currentPasswordInput ? currentPasswordInput.value : '';
    const newPass = newPasswordInput ? newPasswordInput.value : '';
    const activeLangBtn = document.querySelector(".profile-lang-btn.active") as HTMLElement;
    const newLang = activeLangBtn?.dataset.lang;

    clearFormErrors();

    const passwordError = validatePasswordFields(currentPass, newPass);
    if (passwordError) {
      if (currentPass && !newPass) {
        showFieldError("new-password", passwordError);
      } else {
        showFieldError("current-password", passwordError);
      }
      return;
    }

    const avatarChanged = form.getAttribute("data-avatar-changed") === "true";
    const hasProfileChanges = displayName !== (user.display_name || user.username) || newPass;
    const hasLangChange = newLang && newLang !== i18n.getLanguage();
    const hasAnyChanges = hasProfileChanges || hasLangChange || avatarChanged;

    if (!hasAnyChanges) {
      showMessage(i18n.t("no_changes"), "info");
      setTimeout(() => clearMessage(), 2000);
      return;
    }

    const profileBox = document.querySelector(".profile-box") as HTMLElement;
    const loadingOverlay = createLoadingOverlay();
    profileBox?.appendChild(loadingOverlay);

    const updates: any = { display_name: displayName };
    if (newPass) {
      updates.password = newPass;
      updates.current_password = currentPass;
    }

    try {
      if (hasProfileChanges) {
        await Promise.all([
          profileService.updateProfile(updates),
          new Promise((resolve) => setTimeout(resolve, 1500)),
        ]);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      form.removeAttribute("data-avatar-changed");

      if (hasLangChange) {
        i18n.setLanguage(newLang as any);
      } else {
        loadingOverlay.remove();
        showMessage(i18n.t("saved_successfully"), "success");
        setTimeout(() => clearMessage(), 2000);
      }
    } catch (err: any) {
      loadingOverlay.remove();
      const errorMessage = err.message || i18n.t("error_saving");

      if (errorMessage.toLowerCase().includes("password")) {
        showFieldError("current-password", errorMessage);
      } else {
        showMessage(errorMessage, "error");
      }
    }
  });
}

export function setupDeleteAccount() {
  document.getElementById("btn-delete-account")?.addEventListener("click", async () => {
    const confirmed = await showConfirm({
      title: i18n.t("danger_zone"),
      message: i18n.t("confirm_delete_account"),
      confirmText: i18n.t("delete"),
      cancelText: i18n.t("back"),
      confirmColor: "#991b1b",
    });
    if (!confirmed) return;

    const doubleConfirm = await showConfirm({
      title: "⚠️ " + i18n.t("danger_zone"),
      message: i18n.t("confirm_delete_account_final"),
      confirmText: i18n.t("delete_account"),
      cancelText: i18n.t("back"),
      confirmColor: "#7f1d1d",
    });
    if (!doubleConfirm) return;

    try {
      await profileService.deleteAccount();
      showNotification(i18n.t("account_deleted"), { type: "success" });
      authService.logout();
      navigateTo("/auth");
    } catch (err: any) {
      showNotification(err.message || i18n.t("failed_to_delete_account"), {
        type: "error",
      });
    }
  });
}

function createLoadingOverlay(): HTMLElement {
  const loadingOverlay = document.createElement("div");
  loadingOverlay.className = "profile-loading-overlay";
  loadingOverlay.innerHTML = `
    <svg class="profile-spinner" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
    </svg>
  `;
  return loadingOverlay;
}
