import { Queue } from "bullmq";
import { connection } from "./redisClient"; 

export const videoRenderQueue = new Queue("video-render", { connection });

export function setupBullQueue() {
  console.log("BullMQ Producer ready");
}