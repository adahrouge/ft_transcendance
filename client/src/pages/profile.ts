import { profileService } from "../services/profile";
import { authService } from "../services/auth";
import { navigateTo } from "../router";
import { getAvatarUrl } from "../utils/home";
import { i18n } from "../services/i18n";
import { showNotification, showConfirm } from "../utils/notifications";
import type { ProfileUser } from "../types/profile";
import "../styles/profile.css";

export function renderProfilePage(): string {
  setTimeout(() => {
    loadProfile();
  }, 0);

  return `
    <div class="profile-container">
      <div class="profile-overlay"></div>
      <div class="profile-content">
        <div id="profile-root" class="w-full flex justify-center items-center min-h-[300px]">
          <svg style="color: #5db3d1; animation: spin 1s linear infinite;" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
          </svg>
          <style>@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }</style>
        </div>
      </div>
    </div>
  `;
}

async function loadProfile() {
  const root = document.getElementById("profile-root");
  if (!root) return;

  try {
    const profileResponse = await profileService.getProfile();
    const user: ProfileUser = profileResponse.user;

    root.innerHTML = `
      <div class="profile-box">
        <h2 class="profile-title">${i18n.t("my_profile")}</h2>
        
        <!-- Profile Header -->
        <div class="profile-header">
          <div class="profile-avatar-wrapper">
            <div class="profile-avatar-container" id="avatar-container">
              <img id="avatar-img" src="${getAvatarUrl(user)}" 
                   class="profile-avatar" alt="Profile Avatar">
              <div class="profile-avatar-overlay">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
                <span>${i18n.t("change")}</span>
              </div>
              <input type="file" id="avatar-input" accept="image/*" class="hidden">
            </div>
          </div>
          <div class="profile-header-info">
            <div class="profile-display-name">${
              user.display_name || user.username
            }</div>
            <div class="profile-username">@${user.username}</div>
          </div>
        </div>

        <!-- Profile Form -->
        <form id="profile-form" class="profile-form">
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

          <div class="profile-section">
            <h3 class="profile-section-title">${i18n.t("change_password")}</h3>
            <div class="profile-form-row">
              <div class="profile-form-group">
                <label class="profile-label">${i18n.t(
                  "current_password"
                )}</label>
                <div class="profile-password-wrapper">
                  <input type="password" id="current-password" placeholder="••••••••"
                          class="profile-input">
                  <button type="button" class="profile-password-toggle" data-target="current-password">
                    <svg class="eye-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <svg class="eye-off-icon hidden" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  </button>
                </div>
                <div id="current-password-error" class="profile-field-error"></div>
              </div>
              <div class="profile-form-group">
                <label class="profile-label">${i18n.t("new_password")}</label>
                <div class="profile-password-wrapper">
                  <input type="password" id="new-password" placeholder="••••••••"
                          class="profile-input">
                  <button type="button" class="profile-password-toggle" data-target="new-password">
                    <svg class="eye-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <svg class="eye-off-icon hidden" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  </button>
                </div>
                <div id="new-password-error" class="profile-field-error"></div>
              </div>
            </div>
          </div>

          <div id="profile-msg" class="profile-message"></div>

          <div class="profile-actions">
            <button type="button" id="btn-back" class="profile-back-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              ${i18n.t("back")}
            </button>
            <button type="submit" class="profile-save-btn">${i18n.t(
              "save_changes"
            )}</button>
            <button type="button" id="btn-logout" class="profile-logout-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              ${i18n.t("logout")}
            </button>
          </div>
        </form>

        <div class="profile-danger-zone">
          <h3 class="profile-danger-title">${i18n.t("danger_zone")}</h3>
          <p class="profile-danger-description">${i18n.t(
            "danger_zone_description"
          )}</p>
          <button type="button" id="btn-delete-account" class="profile-delete-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            ${i18n.t("delete_account")}
          </button>
        </div>
      </div>
    `;

    document
      .getElementById("btn-back")
      ?.addEventListener("click", () => navigateTo("/home"));
    document.getElementById("btn-logout")?.addEventListener("click", () => {
      authService.logout();
      navigateTo("/auth");
    });

    // Avatar Upload
    const avatarContainer = document.getElementById("avatar-container");
    const avatarInput = document.getElementById(
      "avatar-input"
    ) as HTMLInputElement;
    const avatarImg = document.getElementById("avatar-img") as HTMLImageElement;
    let avatarChanged = false;

    avatarContainer?.addEventListener("click", () => avatarInput?.click());

    avatarInput?.addEventListener("change", async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        showNotification(i18n.t("file_too_large"), { type: "error" });
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        showNotification(i18n.t("invalid_file_type"), { type: "error" });
        return;
      }

      try {
        const res = await profileService.uploadAvatar(file);
        if (res.user) {
          avatarImg.src = getAvatarUrl(res.user);
          avatarChanged = true;
          showNotification(i18n.t("avatar_updated"), { type: "success" });
        }
      } catch (err: any) {
        showNotification(err.message || i18n.t("failed_to_upload_avatar"), {
          type: "error",
        });
      }
    });

    document.querySelectorAll(".profile-lang-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".profile-lang-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });

    // Password visibility toggle
    document.querySelectorAll(".profile-password-toggle").forEach((button) => {
      button.addEventListener("click", () => {
        const targetId = button.getAttribute("data-target");
        const input = document.getElementById(targetId!) as HTMLInputElement;
        const eyeIcon = button.querySelector(".eye-icon");
        const eyeOffIcon = button.querySelector(".eye-off-icon");

        if (input.type === "password") {
          input.type = "text";
          eyeIcon?.classList.add("hidden");
          eyeOffIcon?.classList.remove("hidden");
        } else {
          input.type = "password";
          eyeIcon?.classList.remove("hidden");
          eyeOffIcon?.classList.add("hidden");
        }
      });
    });

    // Clear errors when user types
    const displayNameInput = document.getElementById(
      "display-name"
    ) as HTMLInputElement;
    const currentPasswordInput = document.getElementById(
      "current-password"
    ) as HTMLInputElement;
    const newPasswordInput = document.getElementById(
      "new-password"
    ) as HTMLInputElement;

    displayNameInput?.addEventListener("input", () => {
      document.getElementById("display-name-error")!.textContent = "";
    });

    currentPasswordInput?.addEventListener("input", () => {
      document.getElementById("current-password-error")!.textContent = "";
    });

    newPasswordInput?.addEventListener("input", () => {
      document.getElementById("new-password-error")!.textContent = "";
    });

    document
      .getElementById("profile-form")
      ?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const msgEl = document.getElementById("profile-msg");

        const displayName = displayNameInput.value.trim();
        const currentPass = currentPasswordInput.value;
        const newPass = newPasswordInput.value;
        const activeLangBtn = document.querySelector(
          ".profile-lang-btn.active"
        ) as HTMLElement;
        const newLang = activeLangBtn?.dataset.lang;

        // Clear all previous errors
        document.getElementById("display-name-error")!.textContent = "";
        document.getElementById("current-password-error")!.textContent = "";
        document.getElementById("new-password-error")!.textContent = "";
        if (msgEl) msgEl.textContent = "";

        // Validate password fields
        if (currentPass && !newPass) {
          document.getElementById("new-password-error")!.textContent = i18n.t(
            "new_password_required"
          );
          return;
        }
        if (newPass && !currentPass) {
          document.getElementById("current-password-error")!.textContent =
            i18n.t("current_password_required");
          return;
        }

        // Check if anything changed
        const hasProfileChanges =
          displayName !== (user.display_name || user.username) || newPass;
        const hasLangChange = newLang && newLang !== i18n.getLanguage();
        const hasAnyChanges =
          hasProfileChanges || hasLangChange || avatarChanged;

        if (!hasAnyChanges) {
          if (msgEl) {
            msgEl.textContent = i18n.t("no_changes");
            msgEl.className =
              "text-center font-['Pixel_Game'] text-sm h-5 text-[#5db3d1]";
            setTimeout(() => {
              if (msgEl) msgEl.textContent = "";
            }, 2000);
          }
          return;
        }

        const profileBox = document.querySelector(
          ".profile-box"
        ) as HTMLElement;

        // Show loading overlay with spinner
        const loadingOverlay = document.createElement("div");
        loadingOverlay.className = "profile-loading-overlay";
        loadingOverlay.innerHTML = `
        <svg class="profile-spinner" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
        </svg>
      `;
        profileBox?.appendChild(loadingOverlay);
        if (msgEl) msgEl.textContent = "";

        const updates: any = { display_name: displayName };
        if (newPass) {
          updates.password = newPass;
          updates.current_password = currentPass;
        }

        try {
          // Only call API if there are profile changes (not just avatar or language)
          if (hasProfileChanges) {
            await Promise.all([
              profileService.updateProfile(updates),
              new Promise((resolve) => setTimeout(resolve, 1500)),
            ]);
          } else {
            // Just show loading for consistency
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }

          // Reset avatar changed flag
          avatarChanged = false;

          if (hasLangChange) {
            i18n.setLanguage(newLang as any);
          } else {
            loadingOverlay.remove();
            if (msgEl) {
              msgEl.textContent = i18n.t("saved_successfully");
              msgEl.className =
                "text-center font-['Pixel_Game'] text-sm h-5 text-green-400";
            }
            setTimeout(() => {
              if (msgEl) msgEl.textContent = "";
            }, 2000);
          }
        } catch (err: any) {
          loadingOverlay.remove();
          const errorMessage = err.message || i18n.t("error_saving");

          // Show error in appropriate field or general message
          if (errorMessage.toLowerCase().includes("password")) {
            document.getElementById("current-password-error")!.textContent =
              errorMessage;
          } else {
            if (msgEl) {
              msgEl.textContent = errorMessage;
              msgEl.className =
                "text-center font-['Pixel_Game'] text-sm h-5 text-red-400";
            }
          }
        }
      });

    // Delete account handler
    document
      .getElementById("btn-delete-account")
      ?.addEventListener("click", async () => {
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
  } catch (err) {
    root.innerHTML = '<div class="text-red-500">Failed to load profile.</div>';
  }
}
