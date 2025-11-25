import { WebSocketServer, WebSocket } from "ws";
import type { Server as HttpServer } from "http";

// 방마다 클라이언트 모아두기
const rooms = new Map<string, Set<WebSocket & { roomId?: string; userId?: string }>>();

export function setupWebSocket(server: HttpServer) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    (ws as any).roomId = undefined;
    (ws as any).userId = undefined;

    console.log("Client connected");

    ws.on("message", (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch (e) {
        console.warn("Invalid JSON message");
        return;
      }

      // (1) 방 입장
      if (msg.type === "join") {
        const roomId = msg.roomId;
        const userId = msg.userId;

        (ws as any).roomId = roomId;
        (ws as any).userId = userId;

        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Set());
        }
        rooms.get(roomId)!.add(ws);

        console.log(`Joined room: ${roomId}, user: ${userId}`);
        return;
      }

      // (2) 메시지 브로드캐스트
      if (msg.type === "message") {
        const roomId = (ws as any).roomId;
        const userId = (ws as any).userId;

        if (!roomId || !rooms.has(roomId)) return;

        const payload = {
          type: "message",
          roomId,
          userId,
          text: msg.text,
          ts: Date.now(),
        };

        // 같은 방에 속한 사용자들에게만 전송
        for (const client of rooms.get(roomId)!) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(payload));
          }
        }
        return;
      }
    });

    ws.on("close", () => {
      const roomId = (ws as any).roomId;

      if (roomId && rooms.has(roomId)) {
        rooms.get(roomId)!.delete(ws);

        if (rooms.get(roomId)!.size === 0) {
          rooms.delete(roomId);
          console.log(`Room deleted: ${roomId}`);
        }
      }

      console.log("Client disconnected");
    });
  });

  console.log("WebSocket with room support ready");
}
