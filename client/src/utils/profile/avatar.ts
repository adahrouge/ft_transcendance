import { profileService } from "../../services/profile";
import { getAvatarUrl } from "../home";
import { i18n } from "../../services/i18n";
import { showNotification } from "../notifications";

export function setupAvatarUpload() {
  const avatarContainer = document.getElementById("avatar-container");
  const avatarInput = document.getElementById("avatar-input") as HTMLInputElement;
  const avatarImg = document.getElementById("avatar-img") as HTMLImageElement;

  avatarContainer?.addEventListener("click", () => avatarInput?.click());

  avatarInput?.addEventListener("change", async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showNotification(i18n.t("file_too_large"), { type: "error" });
      return;
    }

    if (!file.type.startsWith("image/")) {
      showNotification(i18n.t("invalid_file_type"), { type: "error" });
      return;
    }

    try {
      const res = await profileService.uploadAvatar(file);
      if (res.user) {
        avatarImg.src = getAvatarUrl(res.user);
        document.getElementById("profile-form")?.setAttribute("data-avatar-changed", "true");
        showNotification(i18n.t("avatar_updated"), { type: "success" });
      }
    } catch (err: any) {
      showNotification(err.message || i18n.t("failed_to_upload_avatar"), {
        type: "error",
      });
    }
  });
}
