import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";
import { fileURLToPath } from "url";
import Resume from "../models/Resume.js";
import { authenticateToken } from "../middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const uploadsDir = path.join(__dirname, "../public/resumes");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 250 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

router.get("/", authenticateToken, async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("user", "name email");

    res.json({ success: true, resumes });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post(
  "/upload",
  authenticateToken,
  upload.single("resume"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded" });
      }

      const { name } = req.body;
      if (!name) {
        return res
          .status(400)
          .json({ success: false, message: "Resume name is required" });
      }

      const shortId = nanoid(7);

      const resume = new Resume({
        name,
        filename: req.file.filename,
        originalName: req.file.originalname,
        shortId,
        user: req.user._id,
      });

      await resume.save();

      res.status(201).json({ success: true, resume });
    } catch (error) {
      if (req.file) {
        const filePath = path.join(uploadsDir, req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      res.status(500).json({ success: false, message: "Upload failed" });
    }
  }
);

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!resume) {
      return res
        .status(404)
        .json({ success: false, message: "Resume not found" });
    }

    const filePath = path.join(uploadsDir, resume.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Resume.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Resume deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/short-url", authenticateToken, async (req, res) => {
  try {
    const { resumeId } = req.body;

    const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
    if (!resume) {
      return res
        .status(404)
        .json({ success: false, message: "Resume not found" });
    }

    const shortUrl = `${req.protocol}://${req.get("host")}/r/${resume.shortId}`;

    res.json({ success: true, shortUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/public/:shortId", async (req, res) => {
  try {
    const resume = await Resume.findOne({
      shortId: req.params.shortId,
    }).populate("user", "name email isActive");

    if (!resume || !resume.user.isActive) {
      return res.status(404).json({
        success: false,
        message: "Resume not found or user account is disabled",
      });
    }

    res.json({ success: true, resume });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/public/:shortId/file", async (req, res) => {
  try {
    const resume = await Resume.findOne({
      shortId: req.params.shortId,
    }).populate("user", "isActive");

    if (!resume || !resume.user.isActive) {
      return res
        .status(404)
        .json({ success: false, message: "Resume not found" });
    }

    const filePath = path.join(uploadsDir, resume.filename);
    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ success: false, message: "File not found" });
    }

    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/public/:shortId/download", async (req, res) => {
  try {
    const resume = await Resume.findOne({
      shortId: req.params.shortId,
    }).populate("user", "isActive");

    if (!resume || !resume.user.isActive) {
      return res
        .status(404)
        .json({ success: false, message: "Resume not found" });
    }

    const filePath = path.join(uploadsDir, resume.filename);
    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ success: false, message: "File not found" });
    }

    res.download(filePath, resume.originalName);
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/track/:shortId", async (req, res) => {
  try {
    const { action } = req.body;
    const resume = await Resume.findOne({ shortId: req.params.shortId });

    if (!resume) {
      return res
        .status(404)
        .json({ success: false, message: "Resume not found" });
    }

    const updateField = `analytics.${action}s`;
    await Resume.findByIdAndUpdate(resume._id, {
      $inc: { [updateField]: 1 },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/:id/download", async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id });

    if (!resume) {
      return res
        .status(404)
        .json({ success: false, message: "Resume not found" });
    }

    const filePath = path.join(uploadsDir, resume.filename);
    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ success: false, message: "File not found" });
    }

    res.download(filePath, resume.originalName);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
