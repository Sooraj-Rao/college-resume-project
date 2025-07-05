import express from "express"
import jwt from "jsonwebtoken"
import User from "../models/User.js"
import Resume from "../models/Resume.js"
import { authenticateToken } from "../middleware/auth.js"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" })
    }

    // Create new user
    const user = new User({ name, email, password })
    await user.save()

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" })

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" })
  }
})

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid credentials" })
    }

    if (!user.isActive) {
      return res.status(400).json({ success: false, message: "Account is disabled" })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" })
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" })

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" })
  }
})

// Verify token
router.get("/verify", authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
    },
  })
})

// Update profile
router.put("/update-profile", authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } })
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already in use" })
    }

    const user = await User.findByIdAndUpdate(req.user._id, { name, email }, { new: true }).select("-password")

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" })
  }
})

// Disable account
router.put("/disable-account", authenticateToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isActive: false })
    res.json({ success: true, message: "Account disabled successfully" })
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" })
  }
})

// Delete account
router.delete("/delete-account", authenticateToken, async (req, res) => {
  try {
    // Delete all user's resumes and files
    const resumes = await Resume.find({ user: req.user._id })

    for (const resume of resumes) {
      const filePath = path.join(__dirname, "../public/resumes", resume.filename)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    await Resume.deleteMany({ user: req.user._id })
    await User.findByIdAndDelete(req.user._id)

    res.json({ success: true, message: "Account deleted successfully" })
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" })
  }
})

export default router
