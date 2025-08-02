import { Worker } from "bullmq";
import { connection } from "../queue/redisClient";
import { sendMessageToClient } from "../ws/socketHandler";

export function setupWorker() {
  const worker = new Worker("video-render", async (job) => {
    const { prompt, socketId } = job.data;

    sendMessageToClient(socketId, { type: "started", data: null });

    // Render logic here (e.g., Manim script generation + FFmpeg rendering)
    await new Promise((r) => setTimeout(r, 3000));

    // Notify client job is done
    sendMessageToClient(socketId, {
      type: "done",
      data: { videoUrl: `/videos/${job.id}.mp4` },
    });

    return true;
  }, { connection });

  worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed.`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed: ${err}`);
  });
}
