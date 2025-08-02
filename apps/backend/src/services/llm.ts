import axios from "axios";

/**
 * Generate Manim code using Gemini API
 * @param prompt User prompt for animation generation
 * @returns Generated Manim Python code
 */
export async function generateManimCode(prompt: string): Promise<string> {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `"${prompt}"
                Generate valid and executable Python code for a Manim animation based strictly on the official Manim documentation (https://docs.manim.community). 

                  Instructions:
                  - Start with all required imports (e.g., 'from manim import *').
                  - Define a class named 'Animation' that inherits from 'Scene' or a relevant Scene subclass.
                  - Implement a 'construct' method containing the animation logic.
                  - Python code can contain explanations, if specified by user (as part of the animation itself, but should be non intrusive and non-overlapping)
                  - Do not assume any external assets (e.g., SVGs, images, audio). Everything must be created using Manim primitives, objects, and methods.
                  - The code must be fully self-contained, syntactically correct, and ready to run.
                  - Do not include explanations, comments, or markdown—only return the raw Python code`
              }
            ]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    let code = response.data.candidates[0].content.parts[0].text;
    
    // Remove markdown code block delimiters if present
    code = code.replace(/```python\n/g, '').replace(/```\n?/g, '').replace(/```/g, '');
    
    // Clean up any extra whitespace
    code = code.trim();
    
    // Check if code has proper class definition, if not wrap it
    if (!code.includes("class") || !code.includes("Scene")) {
      code = `from manim import *\n\nclass GeneratedScene(Scene):\n    def construct(self):\n        ${code}`;
    }

    // Ensure imports are present
    if (!code.includes("from manim import")) {
      code = `from manim import *\n\n${code}`;
    }

    return code;
  } catch (error: any) {
    console.error("Gemini API error:", error.response?.data || error.message);
    throw new Error(`Failed to generate Manim code: ${error.message}`);
  }
}