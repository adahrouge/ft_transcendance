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

// Helper to render page for authenticated users
function renderWithNavbar(pageContent: string, needsAuth: boolean = true): void {
  const app = getAppContainer();
  
  if (needsAuth && !isAuthenticated()) {
    router.navigate("/auth");
    return;
  }
  
  app.innerHTML = pageContent;
}

// Helper to render page without navbar (landing, auth)
function renderWithoutNavbar(pageContent: string): void {
  const app = getAppContainer();
  app.innerHTML = pageContent;
}

export function setupRouter() {
  router
    .on("/", () => {
      renderWithoutNavbar(renderLandingPage());
    })
    .on("/auth", () => {
      renderWithoutNavbar(renderAuthPage());
    })
    .on("/home", () => {
      renderWithNavbar(renderHomePage());
    })
    .on("/pong", () => {
      renderWithNavbar(renderGamePage());
    })
    .on("/tictactoe", () => {
      renderWithNavbar(renderTicTacToePage());
    })
    .on("/profile", () => {
      renderWithNavbar(renderProfilePage());
    })
    .on("/friend", () => {
      renderWithNavbar(renderFriendPage());
    })
    .on("/stats", () => {
      renderWithNavbar(renderStatsPage());
    })
    .on("/tournament", () => {
      renderWithNavbar(renderTournamentPage());
    })
    .on("/tournament/:id", (match) => {
      if (!isAuthenticated()) {
        router.navigate("/auth");
        return;
      }
      const app = getAppContainer();
      app.innerHTML = renderTournamentPage(match?.data ?? undefined);
    })
    .on("/customize-board", () => {
      renderWithNavbar(renderCustomizeBoardPage());
    })
    .notFound(() => {
      renderWithNavbar(renderNotFoundPage(), false);
    });

  router.resolve();
}

export function navigateTo(path: string) {
  router.navigate(path);
}

export default router;
