import { navigateTo } from "../router";

export function startTypingAnimation() {
  const text = "TRANSCENDENCE";
  const loadingTextEl = document.querySelector("#loading-text") as HTMLElement;
  const container = document.querySelector(".landing-container") as HTMLElement;

  if (!loadingTextEl || !container) return;

  let index = 0;
  container.style.cursor = "pointer";


  container.addEventListener("click", () => {
    navigateTo("/auth");
  });
  const typeWriter = () => {
    if (index < text.length) {
      const span = document.createElement("span");
      span.textContent = text.charAt(index);
      span.setAttribute("data-text", text.charAt(index));
      loadingTextEl.appendChild(span);
      index++;
      setTimeout(typeWriter, 100);
    }
  };

  setTimeout(typeWriter, 500);

}
