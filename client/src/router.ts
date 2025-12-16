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
      console.log("Route: Landing Page");
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
      console.log("Route: Home Page");
      const app = getAppContainer();
      app.innerHTML = renderHomePage();
    })
    .on("/pong", () => {
      console.log("Route: Pong Game Page");
      const app = getAppContainer();
      app.innerHTML = renderGamePage();
    })
    .on("/tictactoe", () => {
      console.log("Route: Tic-Tac-Toe Page");
      const app = getAppContainer();
      app.innerHTML = renderTicTacToePage();
    })
    .on("/profile", () => {
      console.log("Route: Profile Page");
      const app = getAppContainer();
      app.innerHTML = renderProfilePage();
    })
    .on("/friend", () => {
      console.log("Route: Friend Page");
      const app = getAppContainer();
      app.innerHTML = renderFriendPage();
    })
    .on("/stats", () => {
      console.log("Route: Stats Page");
      const app = getAppContainer();
      app.innerHTML = renderStatsPage();
    })
    .on("/tournament", () => {
      console.log("Route: Tournament Page");
      const app = getAppContainer();
      app.innerHTML = renderTournamentPage();
    })
    .on("/tournament/:id", (match) => {
      console.log("Route: Tournament Detail Page");
      const app = getAppContainer();
      app.innerHTML = renderTournamentPage(match?.data ?? undefined);
    })
    .on("/customize-board", () => {
      console.log("Route: Customize Board Page");
      const app = getAppContainer();
      app.innerHTML = renderCustomizeBoardPage();
    })
    .notFound(() => {
      console.log("Route: 404 Not Found");
      const app = getAppContainer();
      app.innerHTML = renderNotFoundPage();
    });

  router.resolve();
}

export function navigateTo(path: string) {
  router.navigate(path);
}

export default router;
