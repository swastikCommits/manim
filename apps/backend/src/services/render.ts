import fs from "fs";
import path from "path";
import { promisify } from "util";
import { exec as execCallback } from "child_process";

const exec = promisify(execCallback);

// Directory setup
const SCRIPT_DIR = path.join(__dirname, "..", "..", "sessions");
const OUTPUT_DIR = path.join(__dirname, "..", "..", "public", "videos");

// Ensure directories exist
if (!fs.existsSync(SCRIPT_DIR)) fs.mkdirSync(SCRIPT_DIR, { recursive: true });
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

/**
 * Render video from Manim script
 * @param script Generated Manim Python code
 * @param sessionId Unique session identifier
 * @returns URL path to the rendered video
 */
export async function renderVideo(script: string, sessionId: string): Promise<string> {
  const scriptPath = path.join(SCRIPT_DIR, `scene_${sessionId}.py`);
  fs.writeFileSync(scriptPath, script, "utf-8");

  const cmd = `python -m manim ${scriptPath} -ql -o scene_${sessionId}.mp4`;

  try {
    const { stdout } = await exec(cmd, { timeout: 60000 });
    console.log("Render output:", stdout);
    
    const videoName = `scene_${sessionId}.mp4`;
    const videoUrl = `/videos/${videoName}`;
    
    return videoUrl;
  } catch (error: any) {
    console.error("Render error:", error.stderr || error.message);
    throw new Error(`Failed to render video: ${error.message}`);
  }
}

/**
 * Get the file path for a script
 * @param sessionId Unique session identifier
 * @returns Full path to the script file
 */
export function getScriptPath(sessionId: string): string {
  return path.join(SCRIPT_DIR, `scene_${sessionId}.py`);
}