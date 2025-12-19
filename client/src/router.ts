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
import { renderNavbar, initializeNavbar, clearNavbarCache } from "./components/navbar";

const router = new Navigo("/");

const getAppContainer = (): HTMLElement => {
  const app = document.querySelector("#app");
  if (!app) {
    throw new Error("App container #app not found");
  }
  return app as HTMLElement;
};

// Helper to render page with navbar for authenticated users
function renderWithNavbar(pageContent: string, needsAuth: boolean = true): void {
  const app = getAppContainer();
  
  if (needsAuth && !isAuthenticated()) {
    router.navigate("/auth");
    return;
  }
  
  if (isAuthenticated()) {
    document.body.classList.add('has-navbar');
    app.innerHTML = renderNavbar() + pageContent;
    // Initialize navbar after DOM is ready
    setTimeout(() => initializeNavbar(), 0);
  } else {
    document.body.classList.remove('has-navbar');
    app.innerHTML = pageContent;
  }
}

// Helper to render page without navbar (landing, auth)
function renderWithoutNavbar(pageContent: string): void {
  const app = getAppContainer();
  document.body.classList.remove('has-navbar');
  app.innerHTML = pageContent;
}

export function setupRouter() {
  router
    .on("/", () => {
      renderWithoutNavbar(renderLandingPage());
    })
    .on("/auth", () => {
      // Clear navbar cache on auth page
      clearNavbarCache();
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
      document.body.classList.add('has-navbar');
      app.innerHTML = renderNavbar() + renderTournamentPage(match?.data ?? undefined);
      setTimeout(() => initializeNavbar(), 0);
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
