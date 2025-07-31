import express from "express";
import { videoRenderQueue } from "../queue/producer";
import { generateId } from "../utils/generateId"
import db from "@repo/db/client"

const router = express.Router();

router.post("/", async (req, res) => {
  const { prompt, socketId, projectId, userId, parentJobId } = req.body;

  if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
    return res.status(400).json({
      success: false,
      error: "Invalid or missing prompt",
    });
  }

  if (!socketId || typeof socketId !== "string") {
    return res.status(400).json({
      success: false,
      error: "Missing or invalid socketId",
    });
  }

  const sessionId = generateId();
  const trimmedPrompt = prompt.trim();

  try {
    console.log(
      `[${new Date().toISOString()}] Enqueuing job: "${trimmedPrompt.substring(0, 50)}${trimmedPrompt.length > 50 ? "..." : ""}" (Session: ${sessionId})`
    );

    const dbJob = await db.job.create({
      data: {
        prompt: trimmedPrompt,
        status: JobStatus.QUEUED,
        projectId: projectId || "default", // You may need to handle this differently
        userId,
        parentJobId,
      },
    });

    const job = await videoRenderQueue.add("render-video", {
      prompt: trimmedPrompt,
      socketId,
      sessionId,
      jobId: dbJob.id
    });

    res.status(200).json({
      success: true,
      jobId: dbJob.id,
      queueJobId: job.id,
      sessionId,
      message: "Video generation job enqueued",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}] Failed to enqueue job:`, err.message);

    res.status(500).json({
      success: false,
      error: "Failed to enqueue job",
      message: err.message,
    });
  }
});


/**
 * Get job status
 * GET /api/job/:id
 */

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const job = await db.job.findUnique({
      where: { id },
      include: {
        messages: true,
        children: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: "Job not found",
      });
    }

    res.status(200).json({
      success: true,
      job,
    });
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}] Failed to fetch job:`, err.message);
    
    res.status(500).json({
      success: false,
      error: "Failed to fetch job",
      message: err.message,
    });
  }
});


export default router;
