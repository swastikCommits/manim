import { WebSocketServer, WebSocket } from "ws";
import { generateId } from "../utils/generateId";
import { JobStatus } from "@prisma/client"

// Store connected clients with their IDs
const clients = new Map<string, WebSocket>();

// Message types for type safety
type WebSocketMessage = {
  type: string;
  data: any;
};

// Job update message type
type JobUpdateMessage = {
  type: "job_update";
  data: {
    jobId: string;
    status: JobStatus;
    progress?: number;
    videoUrl?: string;
    error?: string;
  };
};

export function setupSocket(wss: WebSocketServer) {
  wss.on("connection", (ws: WebSocket) => {
    const socketId = generateId();
    clients.set(socketId, ws);
    console.log(`WebSocket client connected: ${socketId}`);

    ws.send(JSON.stringify({ 
      type: "connection_established", 
      data: { 
        socketId,
        timestamp: new Date().toISOString()
      } 
    }));

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage;
        console.log(`Received message from ${socketId}:`, message.type);
        
        switch (message.type) {
          case "ping":
            ws.send(JSON.stringify({ 
              type: "pong", 
              data: { timestamp: Date.now() } 
            }));
            break;
          
          default:
            console.log(`Unknown message type: ${message.type}`);
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    });

    ws.on("close", () => {
      clients.delete(socketId);
      console.log(`WebSocket client disconnected: ${socketId}`);
    });
    
    ws.on("error", (error) => {
      console.error(`WebSocket error for client ${socketId}:`, error);
      clients.delete(socketId);
    });
  });
}

/**
 * Send a message to a specific client by socketId
 */
export function sendMessageToClient(socketId: string, message: any) {
  const client = clients.get(socketId);
  
  if (!client) {
    console.warn(`Client ${socketId} not found or disconnected`);
    return false;
  }
  
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
    return true;
  } else {
    console.warn(`Client ${socketId} connection not open (state: ${client.readyState})`);
    return false;
  }
}

/**
 * Send job status update to a client
 */
export function sendJobUpdate(socketId: string, jobId: string, status: JobStatus, data: any = {}) {
  return sendMessageToClient(socketId, {
    type: "job_update",
    data: {
      jobId,
      status,
      ...data,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Broadcast a message to all connected clients
 */
export function broadcastMessage(message: any) {
  let successCount = 0;
  
  clients.forEach((client, id) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
      successCount++;
    }
  });
  
  return successCount;
}