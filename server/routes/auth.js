import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import OTP from "../models/OTP.js";
import Resume from "../models/Resume.js";
import { authenticateToken } from "../middleware/auth.js";
import { sendOTPEmail } from "../utils/emailService.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP for registration
router.post("/send-otp", async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: "Email and name are required"
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists"
      });
    }

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email });

    // Generate new OTP
    const otp = generateOTP();

    // Save OTP to database
    const otpDoc = new OTP({
      email,
      otp,
      purpose: 'registration'
    });
    await otpDoc.save();

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp, name);

    if (emailSent) {
      res.json({
        success: true,
        message: "OTP sent successfully to your email"
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to send OTP email"
      });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Verify OTP and complete registration
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp, name, password } = req.body;

    if (!email || !otp || !name || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({
      email,
      purpose: 'registration',
      verified: false
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP not found or already used"
      });
    }

    // Check if OTP is expired
    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: "OTP has expired"
      });
    }

    // Check attempts
    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: "Too many failed attempts. Please request a new OTP"
      });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining`
      });
    }

    // Check if user already exists (double check)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists"
      });
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      isEmailVerified: true
    });
    await user.save();

    // Mark OTP as verified and delete it
    await OTP.deleteOne({ _id: otpRecord._id });

    // Generate JWT token
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
        isEmailVerified: user.isEmailVerified
      },
      message: "Registration successful!"
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

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
        isEmailVerified: user.isEmailVerified
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
      isEmailVerified: req.user.isEmailVerified,
      // Removed emailNotifications
    },
  });
});

router.put("/update-profile", authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body; // Removed emailNotifications

    const existingUser = await User.findOne({
      email,
      _id: { $ne: req.user._id },
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already in use" });
    }

    const updateData = { name, email };
    // Removed emailNotifications update logic

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        // Removed emailNotifications
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
  }
  catch (error) {
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
