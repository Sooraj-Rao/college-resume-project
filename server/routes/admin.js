import express from "express"
import jwt from "jsonwebtoken"
import User from "../models/User.js"
import Resume from "../models/Resume.js"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

const authenticateAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]

    if (!token) {
      return res.status(401).json({ success: false, message: "Access token required" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (decoded.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" })
    }

    next()
  } catch (error) {
    return res.status(403).json({ success: false, message: "Invalid token" })
  }
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminEmail || !adminPassword) {
      return res.status(500).json({
        success: false,
        message: "Admin credentials not configured",
      })
    }

    if (email !== adminEmail || password !== adminPassword) {
      return res.status(400).json({
        success: false,
        message: "Invalid admin credentials",
      })
    }

    const token = jwt.sign({ role: "admin", email: adminEmail }, process.env.JWT_SECRET, { expiresIn: "24h" })

    res.json({
      success: true,
      token,
      message: "Admin login successful",
    })
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" })
  }
})

router.get("/users", authenticateAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 })
    res.json({ success: true, users })
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" })
  }
})

router.get("/resumes", authenticateAdmin, async (req, res) => {
  try {
    const resumes = await Resume.find({}).populate("user", "name email").sort({ createdAt: -1 })
    res.json({ success: true, resumes })
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" })
  }
})

router.put("/users/:id", authenticateAdmin, async (req, res) => {
  try {
    const { name, email, isActive } = req.body

    const existingUser = await User.findOne({
      email,
      _id: { $ne: req.params.id },
    })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already in use",
      })
    }

    const user = await User.findByIdAndUpdate(req.params.id, { name, email, isActive }, { new: true }).select(
      "-password",
    )

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.json({ success: true, user })
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" })
  }
})

router.put("/resumes/:id", authenticateAdmin, async (req, res) => {
  try {
    const { name } = req.body

    const resume = await Resume.findByIdAndUpdate(req.params.id, { name }, { new: true }).populate("user", "name email")

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

router.delete("/users/:id", authenticateAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    const resumes = await Resume.find({ user: req.params.id })
    const uploadsDir = path.join(__dirname, "../public/resumes")

    for (const resume of resumes) {
      const filePath = path.join(uploadsDir, resume.filename)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    await Resume.deleteMany({ user: req.params.id })
    await User.findByIdAndDelete(req.params.id)

    res.json({ success: true, message: "User deleted successfully" })
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" })
  }
})

router.delete("/resumes/:id", authenticateAdmin, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id)
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      })
    }

    const uploadsDir = path.join(__dirname, "../public/resumes")
    const filePath = path.join(uploadsDir, resume.filename)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    await Resume.findByIdAndDelete(req.params.id)

    res.json({ success: true, message: "Resume deleted successfully" })
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" })
  }
})

export default router
