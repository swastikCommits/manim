import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";

import { setupBullQueue } from "./queue/producer";
import { setupWorker } from "./worker/worker";
import { setupSocket } from "./ws/socketHandler";
import authRoutes from "./api/auth"; // if using JWT route fallback
import jobRoutes from "./api/job";   // routes for enqueueing jobs

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
wss.on('connection', function connection(ws){
    ws.on('message', function message(data, isBinary){
        if (isBinary) return;

        const message = data.toString();
        console.log("Received:", message);
    
        ws.send(JSON.stringify({ type: "ack", message }));
    })
    ws.on('close', () => {
        console.log("WebSocket disconnected");
    })
})


app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/job", jobRoutes);


setupBullQueue();
setupWorker();



server.listen(PORT, () => {
  console.log(`Backend server(API+WS) listening on http://localhost:${PORT}`);
});
