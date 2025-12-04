import { navigateTo } from "../router";

// Typing animation for "TRANSCENDENCE"
export function startTypingAnimation() {
  const text = "TRANSCENDENCE";
  const loadingTextEl = document.querySelector("#loading-text") as HTMLElement;
  const pressStartEl = document.querySelector("#press-start") as HTMLElement;

  if (!loadingTextEl || !pressStartEl) return;

  let index = 0;

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
      // Show "PRESS TO START" after typing is complete
      setTimeout(() => {
        pressStartEl.style.opacity = "1";
        pressStartEl.style.pointerEvents = "auto";
        pressStartEl.style.animation =
          "fade-in 1s ease-in, pulse-scale 2s ease-in-out infinite";
      }, 300);
    }
  };

  // Start typing animation after a brief delay
  setTimeout(typeWriter, 500);

  // Click handler to proceed to auth
  const handleClick = () => {
    // Mark that user has seen landing
    sessionStorage.setItem("hasSeenLanding", "true");

    // Navigate immediately (removed transition)
    navigateTo("/auth");
  };

  // Add click listener to the press start button
  setTimeout(() => {
    pressStartEl.addEventListener("click", handleClick);

    // Also allow clicking anywhere after text is loaded
    document
      .querySelector(".landing-container")
      ?.addEventListener("click", () => {
        if (index >= text.length && pressStartEl.style.opacity === "1") {
          handleClick();
        }
      });
  }, 0);
}
