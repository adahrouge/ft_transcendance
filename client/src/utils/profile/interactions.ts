export function setupLanguageButtons() {
  document.querySelectorAll(".profile-lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".profile-lang-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

export function setupPasswordToggles() {
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
}

export function setupInputClearing() {
  const inputs = ["display-name", "current-password", "new-password"];
  inputs.forEach(id => {
    document.getElementById(id)?.addEventListener("input", () => {
      const errorEl = document.getElementById(`${id}-error`);
      if (errorEl) errorEl.textContent = "";
    });
  });
}
