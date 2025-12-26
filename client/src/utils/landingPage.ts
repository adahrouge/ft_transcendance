import { navigateTo } from "../router";

export function startTypingAnimation() {
  const text = "TRANSCENDENCE";
  const loadingTextEl = document.querySelector("#loading-text") as HTMLElement;
  const pressStartEl = document.querySelector("#press-start") as HTMLElement;
  const container = document.querySelector(".landing-container") as HTMLElement;

  if (!loadingTextEl || !pressStartEl || !container) return;

  let index = 0;
  let animationComplete = false;

  const typeWriter = () => {
    if (index < text.length) {
      const span = document.createElement("span");
      span.textContent = text.charAt(index);
      span.setAttribute("data-text", text.charAt(index));
      span.className = `letter-${index}`;
      loadingTextEl.appendChild(span);
      index++;
      setTimeout(typeWriter, 100);
    } else {
      setTimeout(() => {
        pressStartEl.style.opacity = "1";
        animationComplete = true;
        container.style.cursor = "pointer";
      }, 300);
    }
  };

  setTimeout(typeWriter, 500);

  container.addEventListener("click", () => {
    if (animationComplete) {
      navigateTo("/auth");
    }
  });
}
