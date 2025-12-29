import Navigo from "navigo";
import { renderAuthPage } from "./pages/auth";
import { renderLandingPage } from "./pages/landingPage";
import { renderHomePage } from "./pages/home";
import { renderGamePage } from "./pages/pong";
import { renderTournamentPage } from "./pages/pongTournament";
import { renderFriendGamePage } from "./pages/pongFriendGame";
import { renderProfilePage } from "./pages/profile";
import { renderFriendPage } from "./pages/friend";
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

function renderPage(pageContent: string, needsAuth: boolean = true): void {
  if (needsAuth && !isAuthenticated()) {
    router.navigate("/auth");
    return;
  }
  getAppContainer().innerHTML = pageContent;
}

export function setupRouter() {
  router
    .on("/", () => {
      renderPage(renderLandingPage(), false);
    })
    .on("/auth", () => {
      renderPage(renderAuthPage(), false);
    })
    .on("/home", () => {
      renderPage(renderHomePage());
    })
    .on("/pong", () => {
      renderPage(renderGamePage());
    })
    .on("/tictactoe", () => {
      renderPage(renderTicTacToePage());
    })
    .on("/profile", () => {
      renderPage(renderProfilePage());
    })
    .on("/friend", () => {
      renderPage(renderFriendPage());
    })
    .on("/stats", () => {
      renderPage(renderStatsPage());
    })
    .on("/tournament", () => {
      renderPage(renderTournamentPage());
    })
    .on("/pong-friend", () => {
      renderPage(renderFriendGamePage());
    })
    .on("/customize-board", () => {
      renderPage(renderCustomizeBoardPage());
    })
    .notFound(() => {
      renderPage(renderNotFoundPage(), false);
    });

  router.resolve();
}

export function navigateTo(path: string) {
  router.navigate(path);
}

export default router;
