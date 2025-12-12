import "./style.css";
import { setupRouter } from "./router";
import { onlineGameService } from "./services/onlineGame";
import { getToken } from "./utils/auth";

// Connect if already logged in
const token = getToken();
if (token) {
  onlineGameService.connect(token);
}

setupRouter();
