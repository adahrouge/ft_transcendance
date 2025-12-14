import "./style.css";
import { setupRouter } from "./router";
import { onlineGameService } from "./services/onlineGame";
import { notificationManager } from "./services/notificationManager";
import { getToken } from "./utils/auth";

// Connect if already logged in
const token = getToken();
if (token) {
  onlineGameService.connect(token);
  // Initialize global notification system after connection
  notificationManager.initialize();
}

setupRouter();
