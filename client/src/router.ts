import Navigo from "navigo";
import { isAuthenticated } from "./utils/auth";

const router = new Navigo("/");

export function setupRouter() {
  router
    .on("/", async () => {
      const module = await import("./pages/landingPage");
      const renderLandingPage = module.renderLandingPage;
      renderPage(renderLandingPage(), false);
    })
    .on("/auth", async () => {
      const module = await import("./pages/auth");
      const renderAuthPage = module.renderAuthPage;
      renderPage(renderAuthPage(), false);
    })
    .on("/home", async () => {
      const module = await import("./pages/home");
      const renderHomePage = module.renderHomePage;
      renderPage(renderHomePage());
    })
    .on("/pong", async () => {
      const module = await import("./pages/pong");
      const renderGamePage = module.renderGamePage;
      renderPage(renderGamePage());
    })
    .on("/pong-ai", async () => {
      const module = await import("./pages/pongAi");
      const renderPongAiPage = module.renderPongAiPage;
      renderPage(renderPongAiPage());
    })
    .on("/pong-friend", async () => {
      const module = await import("./pages/pongFriendGame");
      const renderFriendGamePage = module.renderFriendGamePage;
      renderPage(renderFriendGamePage());
    })
    .on("/tournament", async () => {
      const module = await import("./pages/pongTournament");
      const renderTournamentPage = module.renderTournamentPage;
      renderPage(renderTournamentPage());
    })
    .on("/local-tournament", async () => {
      const module = await import("./pages/pongLocalTournament");
      const renderLocalTournamentPage = module.renderLocalTournamentPage;
      renderPage(renderLocalTournamentPage());
    })
    .on("/tictactoe", async () => {
      const module = await import("./pages/tictactoe");
      const renderTicTacToePage = module.renderTicTacToePage;
      renderPage(renderTicTacToePage());
    })
    .on("/tictactoe-ai", async () => {
      const module = await import("./pages/tictactoeAi");
      const renderTicTacToeAiPage = module.renderTicTacToeAiPage;
      renderPage(renderTicTacToeAiPage());
    })
    .on("/tictactoe-friend", async () => {
      const module = await import("./pages/tictactoeFriend");
      const renderTicTacToeFriendPage = module.renderTicTacToeFriendPage;
      renderPage(renderTicTacToeFriendPage());
    })
    .on("/tictactoe-online", async () => {
      const module = await import("./pages/tictactoeOnline");
      const renderTicTacToeOnlinePage = module.renderTicTacToeOnlinePage;
      renderPage(renderTicTacToeOnlinePage());
    })
    .on("/profile", async () => {
      const module = await import("./pages/profile");
      const renderProfilePage = module.renderProfilePage;
      renderPage(renderProfilePage());
    })
    .on("/friend", async () => {
      const module = await import("./pages/friend");
      const renderFriendPage = module.renderFriendPage;
      renderPage(renderFriendPage());
    })
    .on("/stats", async () => {
      const module = await import("./pages/stats");
      const renderStatsPage = module.renderStatsPage;
      renderPage(renderStatsPage());
    })
    .on("/customize-board", async () => {
      const module = await import("./pages/customizeBoard");
      const renderCustomizeBoardPage = module.renderCustomizeBoardPage;
      renderPage(renderCustomizeBoardPage());
    })
    .notFound(async () => {
      navigateTo("/auth");
    });

  router.resolve();
}


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

export function navigateTo(path: string) {
  router.navigate(path);
}

export default router;
