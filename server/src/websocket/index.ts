import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';

// This map stores active WebSocket clients mapped by userId
export const clients = new Map<string, WebSocket>();

export const setupWebSocket = (server: ReturnType<typeof createServer>) => {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket, req: any) => {
    const userId = new URLSearchParams(req.url?.split('?')[1]).get('userId');
    if (!userId) {
      ws.close();
      return;
    }

    clients.set(userId, ws);
    console.log(`✅ WebSocket connected: ${userId}`);

    ws.on('close', () => {
      clients.delete(userId);
      console.log(`❌ WebSocket disconnected: ${userId}`);
    });
  });
};

/**
 * Send a notification directly to a connected WebSocket client.
 * Call this from your controller/service when an event occurs.
 */
export const sendNotification = (userId: string, payload: any) => {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(payload));
    console.log(`📨 Notification sent to ${userId}`);
  } else {
    console.log(`⚠️ Client not connected: ${userId}`);
  }
};
