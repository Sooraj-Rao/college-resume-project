import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Resume from "../models/Resume.js";
import { authenticateToken } from "../middleware/auth.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const user = new User({ name, email, password });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/verify", authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      isActive: req.user.isActive,
    },
  });
});

router.put("/update-profile", authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body;

    const existingUser = await User.findOne({
      email,
      _id: { $ne: req.user._id },
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already in use" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email },
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive:user.isActive
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.put("/disable-account", authenticateToken, async (req, res) => {
  try {
    const { operation } = await req.query;
    const newState = operation === "Enable" ? true : false;
    await User.findByIdAndUpdate(req.user._id, { isActive: newState });
    res.json({ success: true, message: `Account ${operation} successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.delete("/delete-account", authenticateToken, async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user._id });

    for (const resume of resumes) {
      const filePath = path.join(
        __dirname,
        "../public/resumes",
        resume.filename
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Resume.deleteMany({ user: req.user._id });
    await User.findByIdAndDelete(req.user._id);

    res.json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.put("/resumes/:id", authenticateToken, async (req, res) => {
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

export default router;
