import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.DEV ? "http://localhost:5000" : window.location.origin);

export const connectSocket = (accessToken: string) => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token: accessToken },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    if (import.meta.env.DEV) console.log("[Socket] Connected:", socket?.id);
  });
  socket.on("disconnect", (reason) => {
    if (import.meta.env.DEV) console.log("[Socket] Disconnected:", reason);
  });
  socket.on("connect_error", (err) => {
    if (import.meta.env.DEV) console.error("[Socket] Error:", err.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const joinGroup = (groupId: string) =>
  socket?.emit("join_group", groupId);
export const leaveGroup = (groupId: string) =>
  socket?.emit("leave_group", groupId);
export const sendGroupMessage = (groupId: string, message: string) =>
  socket?.emit("group_message", { groupId, message });
