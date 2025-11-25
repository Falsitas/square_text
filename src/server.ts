import express from "express";
import http from "http";
import { setupWebSocket } from "./websocket";

const app = express();
const server = http.createServer(app);

// WebSocket 붙이기
setupWebSocket(server);

app.get("/", (req, res) => {
  res.send("WebSocket Text Server is running");
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
