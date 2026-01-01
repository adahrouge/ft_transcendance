export function setupTabSwitching() {
  const tabPong = document.getElementById("tab-pong");
  const tabXo = document.getElementById("tab-xo");
  const panelPong = document.getElementById("panel-pong");
  const panelXo = document.getElementById("panel-xo");

  tabPong?.addEventListener("click", () => {
    tabPong.classList.add("active");
    tabXo?.classList.remove("active");
    panelPong?.classList.remove("hidden");
    panelXo?.classList.add("hidden");
  });

  tabXo?.addEventListener("click", () => {
    tabXo.classList.add("active");
    tabPong?.classList.remove("active");
    panelXo?.classList.remove("hidden");
    panelPong?.classList.add("hidden");
  });
}
