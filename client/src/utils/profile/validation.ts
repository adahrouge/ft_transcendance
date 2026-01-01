import { i18n } from "../../services/i18n";

export function validatePasswordFields(currentPass: string, newPass: string): string | null {
  if (currentPass && !newPass) {
    return i18n.t("new_password_required");
  }
  if (newPass && !currentPass) {
    return i18n.t("current_password_required");
  }
  return null;
}

export function clearFormErrors() {
  ["display-name", "current-password", "new-password"].forEach(id => {
    const el = document.getElementById(`${id}-error`);
    if (el) el.textContent = "";
  });
  const msgEl = document.getElementById("profile-msg");
  if (msgEl) msgEl.textContent = "";
}

export function showFieldError(fieldId: string, message: string) {
  const errorEl = document.getElementById(`${fieldId}-error`);
  if (errorEl) errorEl.textContent = message;
}

export function showMessage(message: string, type: "success" | "error" | "info") {
  const msgEl = document.getElementById("profile-msg");
  if (!msgEl) return;

  msgEl.textContent = message;
  const colorClass = 
    type === "success" ? "text-green-400" :
    type === "error" ? "text-red-400" :
    "text-[#5db3d1]";
  msgEl.className = `text-center font-['Pixel_Game'] text-sm h-5 ${colorClass}`;
}

export function clearMessage() {
  const msgEl = document.getElementById("profile-msg");
  if (msgEl) msgEl.textContent = "";
}
