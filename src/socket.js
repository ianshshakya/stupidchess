// frontend/src/socket.js
import { io } from "socket.io-client";

const SERVER = "https://stupidchessbackend.onrender.com";

export const socket = io(SERVER, {
  transports: ["websocket", "polling"],
  autoConnect: true
});
