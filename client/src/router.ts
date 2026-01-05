import Navigo from "navigo";
import { isAuthenticated } from "./utils/auth";

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
    .on("/", async () => {
      const { renderLandingPage } = await import("./pages/landingPage");
      renderPage(renderLandingPage(), false);
    })
    .on("/auth", async () => {
      const { renderAuthPage } = await import("./pages/auth");
      renderPage(renderAuthPage(), false);
    })
    .on("/home", async () => {
      const { renderHomePage } = await import("./pages/home");
      renderPage(renderHomePage());
    })
    .on("/pong", async () => {
      const { renderGamePage } = await import("./pages/pong");
      renderPage(renderGamePage());
    })
    .on("/pong-ai", async () => {
      const { renderPongAiPage } = await import("./pages/pongAi");
      renderPage(renderPongAiPage());
    })
    .on("/pong-friend", async () => {
      const { renderFriendGamePage } = await import("./pages/pongFriendGame");
      renderPage(renderFriendGamePage());
    })
    .on("/tournament", async () => {
      const { renderTournamentPage } = await import("./pages/pongTournament");
      renderPage(renderTournamentPage());
    })
    .on("/tictactoe", async () => {
      const { renderTicTacToePage } = await import("./pages/tictactoe");
      renderPage(renderTicTacToePage());
    })
    .on("/tictactoe-ai", async () => {
      const { renderTicTacToeAiPage } = await import("./pages/tictactoeAi");
      renderPage(renderTicTacToeAiPage());
    })
    .on("/tictactoe-friend", async () => {
      const { renderTicTacToeFriendPage } = await import("./pages/tictactoeFriend");
      renderPage(renderTicTacToeFriendPage());
    })
    .on("/tictactoe-online", async () => {
      const { renderTicTacToeOnlinePage } = await import("./pages/tictactoeOnline");
      renderPage(renderTicTacToeOnlinePage());
    })
    .on("/profile", async () => {
      const { renderProfilePage } = await import("./pages/profile");
      renderPage(renderProfilePage());
    })
    .on("/friend", async () => {
      const { renderFriendPage } = await import("./pages/friend");
      renderPage(renderFriendPage());
    })
    .on("/stats", async () => {
      const { renderStatsPage } = await import("./pages/stats");
      renderPage(renderStatsPage());
    })
    .on("/customize-board", async () => {
      const { renderCustomizeBoardPage } = await import("./pages/customizeBoard");
      renderPage(renderCustomizeBoardPage());
    })
    .notFound(async () => {
      navigateTo("/auth");
    });

  router.resolve();
}

export function navigateTo(path: string) {
  router.navigate(path);
}

export default router;
