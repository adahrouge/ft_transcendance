import Navigo from "navigo";
import { renderAuthPage } from "./pages/auth";
import { renderLandingPage } from "./pages/landingPage";
import { renderHomePage } from "./pages/home";
import { renderGamePage } from "./pages/pong";
import { renderProfilePage } from "./pages/profile";
import { renderFriendPage } from "./pages/friend";
import { renderTournamentPage } from "./pages/tournament";
import { renderStatsPage } from "./pages/stats";
import { renderCustomizeBoardPage } from "./pages/customizeBoard";
import { renderNotFoundPage } from "./pages/notFound";
import { isAuthenticated } from "./utils/auth";
import { renderTicTacToePage } from "./pages/tictactoe";

const router = new Navigo("/");

const getAppContainer = (): HTMLElement => {
  const app = document.querySelector("#app");
  if (!app) {
    throw new Error("App container #app not found");
  }
  return app as HTMLElement;
};

export function setupRouter() {
  router
    .on("/", () => {
      const app = getAppContainer();
      app.innerHTML = renderLandingPage();
    })
    .on("/auth", () => {
      const app = getAppContainer();
      app.innerHTML = renderAuthPage();
    })
    .on("/home", () => {
      if (!isAuthenticated()) {
        router.navigate("/auth");
        return;
      }
      const app = getAppContainer();
      app.innerHTML = renderHomePage();
    })
    .on("/pong", () => {
      const app = getAppContainer();
      app.innerHTML = renderGamePage();
    })
    .on("/tictactoe", () => {
      const app = getAppContainer();
      app.innerHTML = renderTicTacToePage();
    })
    .on("/profile", () => {
      const app = getAppContainer();
      app.innerHTML = renderProfilePage();
    })
    .on("/friend", () => {
      const app = getAppContainer();
      app.innerHTML = renderFriendPage();
    })
    .on("/stats", () => {
      const app = getAppContainer();
      app.innerHTML = renderStatsPage();
    })
    .on("/tournament", () => {
      const app = getAppContainer();
      app.innerHTML = renderTournamentPage();
    })
    .on("/tournament/:id", (match) => {
      const app = getAppContainer();
      app.innerHTML = renderTournamentPage(match?.data ?? undefined);
    })
    .on("/customize-board", () => {
      const app = getAppContainer();
      app.innerHTML = renderCustomizeBoardPage();
    })
    .notFound(() => {
      const app = getAppContainer();
      app.innerHTML = renderNotFoundPage();
    });

  router.resolve();
}

export function navigateTo(path: string) {
  router.navigate(path);
}

export default router;
