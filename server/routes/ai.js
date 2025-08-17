import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Resume from "../models/Resume.js";
import { authenticateToken } from "../middleware/auth.js";
import fs from "fs";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import path from "path";
import { fileURLToPath } from "url";
import PDFParser from "pdf2json";
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/feedback", authenticateToken, async (req, res) => {
  try {
    const { resumeId, query } = req.body;

    if (!resumeId || !query) {
      return res
        .status(400)
        .json({ success: false, message: "Resume ID and query are required" });
    }

    const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
    if (!resume) {
      return res
        .status(404)
        .json({ success: false, message: "Resume not found" });
    }

    const filePath = path.join(__dirname, "../public/resumes", resume.filename);
    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ success: false, message: "Resume file not found" });
    }

    const resumeText = await parsePdf(fs.readFileSync(filePath));
    if (!resumeText || resumeText.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Unable to extract resume content" });
    }

    const prompt = createPrompt(resumeText, query);

    const result = await genAI
      .getGenerativeModel({ model: "gemini-1.5-flash" })
      .generateContent(prompt);

    const feedback = result.response.text();
    res.json({ success: true, feedback });
  } catch (error) {
    console.error("AI feedback error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to generate AI feedback" });
  }
});

export default router;

function parsePdf2(buffer) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();
    pdfParser.on("pdfParser_dataError", (err) => reject(err.parserError));
    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      try {
        const text = pdfData.Pages.map((page) =>
          page.Texts.map((t) => decodeURIComponent(t.R[0]?.T || "")).join(" ")
        ).join("\n");
        resolve(text);
      } catch (err) {
        reject(err);
      }
    });
    pdfParser.parseBuffer(buffer);
  });
}

async function parsePdf(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (err) {
    throw new Error("PDF parsing failed: " + err.message);
  }
}

function createPrompt(resumeText, userQuery) {
  return `
You are a resume expert. Below is the extracted text from a real resume. This is users query on resume: "${userQuery}".

Resume Text:
${resumeText}

Your task:
- Give **personalized feedback** based on this actual resume.
- Include suggestions for:
  1. Content improvements
  2. Skills to highlight
  3. Experience to emphasize
  4. Format suggestions
  5. Keywords to include
  6. Rate the resume out of 100
  7. Overall recommendations
- Keep it professional, actionable, and under 250 words.
Avoid typical AI-style intros and conclusions. Only output clean, structured feedback.
`;
}
