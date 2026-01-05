import { navigateTo } from "../../router";
import { setupTabSwitching } from "./tabs";
import { setupPongCustomization } from "./pongCustomization";
import { setupXoCustomization } from "./xoCustomization";

export async function setupCustomizeBoard() {
  setupTabSwitching();
  await setupPongCustomization();
  await setupXoCustomization();
  setupBackButtons();
}

function setupBackButtons() {
  document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/home"));
  document.getElementById("xo-btn-back")?.addEventListener("click", () => navigateTo("/home"));
}
