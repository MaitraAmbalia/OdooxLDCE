import { io } from "socket.io-client";

let socketInstance = null;

export function getSocket() {
  if (!socketInstance) {
    socketInstance = io({
      autoConnect: true,
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socketInstance;
}
