import express from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import { nanoid } from "nanoid"
import { fileURLToPath } from "url"
import Resume from "../models/Resume.js"
import Analytics from "../models/Analytics.js"
import { authenticateToken } from "../middleware/auth.js"
import { parseDeviceInfo, parseLocation, getClientIP } from "../utils/analytics.js"
// Removed sendSessionAnalyticsEmail import

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

const uploadsDir = path.join(__dirname, "../public/resumes")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 250 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true)
    } else {
      cb(new Error("Only PDF files are allowed"))
    }
  },
})

router.get("/", authenticateToken, async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user._id }).sort({ createdAt: -1 }).populate("user", "name email")

    res.json({ success: true, resumes })
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" })
  }
})

router.post("/upload", authenticateToken, upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" })
    }

    const { name } = req.body
    if (!name) {
      return res.status(400).json({ success: false, message: "Resume name is required" })
    }

    const shortId = nanoid(7)

    const resume = new Resume({
      name,
      filename: req.file.filename,
      originalName: req.file.originalname,
      shortId,
      user: req.user._id,
    })

    await resume.save()

    res.status(201).json({ success: true, resume })
  } catch (error) {
    if (req.file) {
      const filePath = path.join(uploadsDir, req.file.filename)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }
    res.status(500).json({ success: false, message: "Upload failed" })
  }
})

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user._id,
    })

    if (!resume) {
      return res.status(404).json({ success: false, message: "Resume not found" })
    }

    const filePath = path.join(uploadsDir, resume.filename)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    // Delete associated analytics
    await Analytics.deleteMany({ resume: req.params.id })
    await Resume.findByIdAndDelete(req.params.id)

    res.json({ success: true, message: "Resume deleted successfully" })
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" })
  }
})

// Generate custom share URL
router.post("/generate-share-url", authenticateToken, async (req, res) => {
  try {
    const { resumeId, customUrl, referrer } = req.body // Removed message, requireReferrer

    const resume = await Resume.findOne({ _id: resumeId, user: req.user._id })
    if (!resume) {
      return res.status(404).json({ success: false, message: "Resume not found" })
    }

    // Check if custom URL is already taken
    if (customUrl) {
      const existingResume = await Resume.findOne({
        customUrl,
        _id: { $ne: resumeId },
      })
      if (existingResume) {
        return res.status(400).json({
          success: false,
          message: "Custom URL already taken",
        })
      }
    }

    // Update resume with custom settings (only customUrl is saved on resume model)
    resume.customUrl = customUrl || null
    // Removed resume.shareSettings update
    await resume.save()

    const baseUrl = `http://localhost:3000/r/`
    const shareUrl = customUrl ? `${baseUrl}${customUrl}` : `${baseUrl}${resume.shortId}`
    const trackingUrl = referrer
      ? `${shareUrl}?ref=${encodeURIComponent(referrer)}` // Removed message parameter
      : shareUrl

    res.json({
      success: true,
      shareUrl: trackingUrl,
      customUrl: customUrl || resume.shortId,
      referrer: referrer || "",
      // Removed message, requireReferrer from response
    })
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" })
  }
})

router.get("/public/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params

    // Find resume by either shortId or customUrl
    const resume = await Resume.findOne({
      $or: [{ shortId: identifier }, { customUrl: identifier }],
    }).populate("user", "name email isActive")

    if (!resume || !resume.user.isActive || !resume.isPublic) {
      return res.status(404).json({
        success: false,
        message: "Resume not found, user account is disabled, or resume is private",
      })
    }

    const authHeader = req.headers.authorization
    let isOwner = false

    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.substring(7)
        const jwt = await import("jsonwebtoken")
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET)
        isOwner = decoded.userId === resume.user._id.toString()
      } catch (error) {
        // Invalid token, continue as non-owner
      }
    }

    const clientIP = getClientIP(req)
    const userAgent = req.get("User-Agent") || ""
    const sessionKey = `${clientIP}-${userAgent}-${resume._id}`
    const crypto = await import("crypto")
    const sessionId = crypto.default.createHash("md5").update(sessionKey).digest("hex").substring(0, 12)

    let analytics = await Analytics.findOne({ sessionId, resume: resume._id })

    if (!analytics && !isOwner) {
      // Only create new session if not owner and session doesn't exist
      const deviceInfo = parseDeviceInfo(userAgent)
      const location = parseLocation(clientIP)

      const referrerHeader = req.get("referer")
      let campaignRef = ""
      let referrerSource = "direct"
      if (referrerHeader) {
        try {
          const url = new URL(referrerHeader)
          campaignRef = url.searchParams.get("ref") || ""
          referrerSource = url.hostname
        } catch (e) {
          // Ignore invalid URL
        }
      }

      analytics = new Analytics({
        resume: resume._id,
        sessionId,
        events: [
          {
            type: "view",
            timestamp: new Date(),
          },
        ],
        deviceInfo,
        location,
        referrer: {
          source: referrerSource,
          campaign: campaignRef,
        },
        timeSpent: 0,
        lastActivity: new Date(),
      })

      await analytics.save()

      // Update resume analytics only for new sessions
      await Resume.findByIdAndUpdate(resume._id, {
        $inc: {
          "analytics.views": 1,
          "analytics.totalSessions": 1,
        },
      })
    }

    res.json({
      success: true,
      resume,
      sessionId: analytics ? analytics.sessionId : null,
      isOwner, // Send owner status to client
    })
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" })
  }
})

router.get("/public/:identifier/file", async (req, res) => {
  try {
    const { identifier } = req.params

    const resume = await Resume.findOne({
      $or: [{ shortId: identifier }, { customUrl: identifier }],
    }).populate("user", "isActive")

    if (!resume || !resume.user.isActive || !resume.isPublic) {
      return res.status(404).json({
        success: false,
        message: "Resume not found or not accessible",
      })
    }

    const filePath = path.join(uploadsDir, resume.filename)
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      })
    }

    res.sendFile(filePath)
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" })
  }
})

router.get("/public/:identifier/download", async (req, res) => {
  try {
    const { identifier } = req.params

    const resume = await Resume.findOne({
      $or: [{ shortId: identifier }, { customUrl: identifier }],
    }).populate("user", "isActive")

    if (!resume || !resume.user.isActive || !resume.isPublic) {
      return res.status(404).json({
        success: false,
        message: "Resume not found or not accessible",
      })
    }

    const filePath = path.join(uploadsDir, resume.filename)
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      })
    }

    res.download(filePath, resume.originalName)
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" })
  }
})

// Track analytics events
router.post("/track/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params
    const { sessionId, event } = req.body // Removed 'data'

    if (!sessionId || !event) {
      return res.status(400).json({
        success: false,
        message: "Session ID and event type are required",
      })
    }

    const resume = await Resume.findOne({
      $or: [{ shortId: identifier }, { customUrl: identifier }],
    }).populate("user", "name email") // Keep populate for potential future use, though emailNotifications removed

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      })
    }

    const analytics = await Analytics.findOne({ sessionId, resume: resume._id })

    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: "Analytics session not found",
      })
    }

    // Calculate time spent since last activity
    const timeElapsed = (Date.now() - analytics.lastActivity.getTime()) / 1000 // in seconds
    analytics.timeSpent += timeElapsed
    analytics.lastActivity = new Date() // Update last activity timestamp

    // Add new event
    analytics.events.push({
      type: event,
      timestamp: new Date(),
    })

    // Update resume analytics based on event type
    if (event === "download") {
      await Resume.findByIdAndUpdate(resume._id, {
        $inc: { "analytics.downloads": 1 },
      })
    }
    // Removed contact, scroll, focus, blur, exit event handling

    await analytics.save()

    res.json({ success: true })
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: "Server error" })
  }
})

router.get("/:id/download", async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id })

    if (!resume) {
      return res.status(404).json({ success: false, message: "Resume not found" })
    }

    const filePath = path.join(uploadsDir, resume.filename)
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "File not found" })
    }

    res.download(filePath, resume.originalName)
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: "Server error" })
  }
})

// Toggle resume privacy
router.put("/:id/privacy", authenticateToken, async (req, res) => {
  try {
    const { isPublic } = req.body

    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isPublic },
      { new: true },
    ).populate("user", "name email")

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      })
    }

    res.json({ success: true, resume })
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" })
  }
})

// Replace resume file
router.put("/:id/replace", authenticateToken, upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      })
    }

    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user._id,
    })

    if (!resume) {
      // Clean up uploaded file if resume not found
      if (req.file) {
        const filePath = path.join(uploadsDir, req.file.filename)
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      }
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      })
    }

    // Delete old file
    const oldFilePath = path.join(uploadsDir, resume.filename)
    if (fs.existsSync(oldFilePath)) {
      fs.unlinkSync(oldFilePath)
    }

    // Update resume with new file info
    resume.filename = req.file.filename
    resume.originalName = req.file.originalname
    await resume.save()

    const updatedResume = await Resume.findById(resume._id).populate("user", "name email")

    res.json({ success: true, resume: updatedResume })
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      const filePath = path.join(uploadsDir, req.file.filename)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }
    res.status(500).json({ success: false, message: "Server error" })
  }
})

export default router
