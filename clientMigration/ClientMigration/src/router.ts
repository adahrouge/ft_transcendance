import Navigo from "navigo";
import { renderAuthPage } from "./pages/auth";
import { renderLandingPage } from "./pages/landingPage";
import { renderNotFoundPage } from "./pages/notFound";

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
