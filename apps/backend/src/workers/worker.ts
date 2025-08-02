import { Worker } from "bullmq";
import { connection } from "../queue/redisClient";
import { sendJobUpdate } from "../ws/SocketHandler";
import prisma from "@repo/db/client";
import { JobStatus } from "@prisma/client";
import { generateManimCode } from "../services/llm";
import { renderVideo, getScriptPath } from "../services/render";

export function setupWorker() {
  const worker = new Worker("video-render", async (job) => {
    const { prompt, socketId, jobId } = job.data;
    
    try {
      // Update job status to PROCESSING
      await prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.PROCESSING }
      });
      
      // Notify client that processing has started
      sendJobUpdate(socketId, jobId, JobStatus.PROCESSING);
      
      // Generate Manim code
      const code = await generateManimCode(prompt);
      
      // Save the script path to the database
      const sessionId = job.id.toString();
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
      
      // Render the video
      const videoUrl = await renderVideo(code, sessionId);
      
      // Update job with video URL and status
      await prisma.job.update({
        where: { id: jobId },
        data: { 
          videoUrl,
          status: JobStatus.COMPLETED
        }
      });
      
      // Notify client that job is complete
      sendJobUpdate(socketId, jobId, JobStatus.COMPLETED, { videoUrl });
      
      return { success: true, videoUrl };
    } catch (error: any) {
      console.error(`Job ${jobId} failed:`, error);
      
      // Update job with error status
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