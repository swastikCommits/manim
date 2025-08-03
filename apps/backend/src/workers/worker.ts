import { Worker } from "bullmq";
import { connection } from "../queue/redisClient";
import { sendJobUpdate } from "../ws/socketHandler";
import prisma from "@repo/db/client";
import { JobStatus } from "@prisma/client";
import { generateManimCode } from "../services/llm";
import { renderVideo, getScriptPath } from "../services/render";

export function setupWorker() {
  const worker = new Worker("video-render", async (job) => {
    const { prompt, socketId, jobId } = job.data;
    
    try {
      await prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.PROCESSING }
      });
      
      sendJobUpdate(socketId, jobId, JobStatus.PROCESSING);
      
      const code = await generateManimCode(prompt);
      
      // Save the script path to the database
      const sessionId = jobId; 
      const scriptPath = getScriptPath(sessionId);
      
      await prisma.job.update({
        where: { id: jobId },
        data: { scriptPath }
      });
      
      // Add a message to the job
      await prisma.message.create({
        data: {
          content: "Generated Manim code",
          jobId
        }
      });
      
      const videoUrl = await renderVideo(code, sessionId);
      
      await prisma.job.update({
        where: { id: jobId },
        data: { 
          videoUrl,
          status: JobStatus.COMPLETED
        }
      });
      
      sendJobUpdate(socketId, jobId, JobStatus.COMPLETED, { videoUrl });
      
      return { success: true, videoUrl };
    } catch (error: any) {
      console.error(`Job ${jobId} failed:`, error);
      
      await prisma.job.update({
        where: { id: jobId },
        data: { 
          status: JobStatus.FAILED,
          error: error.message
        }
      });
      
      // Notify client of failure
      sendJobUpdate(socketId, jobId, JobStatus.FAILED, { error: error.message });
      
      throw error;
    }
  }, { connection });

  worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed.`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed: ${err}`);
  });
}