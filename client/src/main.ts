import "./style.css";
import "./styles/navbar.css";
import { setupRouter } from "./router";
import { notificationManager } from "./services/notificationManager";
import { getToken } from "./utils/auth";

// Connect if already logged in
const token = getToken();
if (token) {
  // Initialize global notification system after connection
  notificationManager.initialize();
}

setupRouter();
