import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { WebSocketServer } from "ws";
import { setupSocket } from "./ws/socketHandler";

import { setupBullQueue } from "./queue/producer";
import { setupWorker } from "./workers/worker";
import jobRoutes from "./job/jobRoutes";   

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
setupSocket(wss);

app.use(cors());
app.use(express.json());

app.use("/api/job", jobRoutes);

setupBullQueue();
setupWorker();

server.listen(PORT, () => {
  console.log(`Backend server(API+WS) listening on http://localhost:${PORT}`);
});
