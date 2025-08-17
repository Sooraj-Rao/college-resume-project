import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Create transporter using Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Email transporter error:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

export const sendOTPEmail = async (email, otp, name) => {
  const mailOptions = {
    from: `"ResumeHub" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Verify Your Email - ResumeHub",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 60px; height: 60px; background-color: #3b82f6; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <span style="color: white; font-size: 24px; font-weight: bold;">R</span>
            </div>
            <h1 style="color: #1f2937; margin: 0;">Welcome to ResumeHub!</h1>
          </div>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Hi ${name},
          </p>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Thank you for signing up! Please verify your email address by entering the following OTP code:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; display: inline-block;">
              <span style="font-size: 32px; font-weight: bold; color: #3b82f6; letter-spacing: 8px;">${otp}</span>
            </div>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            This OTP will expire in 10 minutes.
          </p>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            If you didn't create an account with ResumeHub, please ignore this email.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px;">
              © 2025 ResumeHub. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("OTP email sent successfully to:", email);
    return true;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return false;
  }
};

export const sendSessionAnalyticsEmail = async (
  userEmail,
  userName,
  resumeName,
  sessionData
) => {
  const formatTime = (seconds) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const mailOptions = {
    from: `"ResumeHub Analytics" <${process.env.GMAIL_USER}>`,
    to: userEmail,
    subject: `New Resume View: ${resumeName} - Analytics Report`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 60px; height: 60px; background-color: #10b981; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <span style="color: white; font-size: 20px;">📊</span>
            </div>
            <h1 style="color: #1f2937; margin: 0;">Resume View Analytics</h1>
          </div>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Hi ${userName},
          </p>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Someone just viewed your resume "<strong>${resumeName}</strong>". Here are the session details:
          </p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Session Summary</h3>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
              <div>
                <strong style="color: #374151;">Time Spent:</strong><br>
                <span style="color: #6b7280;">${formatTime(
                  sessionData.timeSpent
                )}</span>
              </div>
              <div>
                <strong style="color: #374151;">Device:</strong><br>
                <span style="color: #6b7280;">${
                  sessionData.deviceInfo.type
                }</span>
              </div>
              <div>
                <strong style="color: #374151;">Location:</strong><br>
                <span style="color: #6b7280;">${sessionData.location.city}, ${
      sessionData.location.country
    }</span>
              </div>
              <div>
                <strong style="color: #374151;">Browser:</strong><br>
                <span style="color: #6b7280;">${
                  sessionData.deviceInfo.browser
                }</span>
              </div>
            </div>
            
            ${
              sessionData.referrer.campaign
                ? `
              <div style="margin-top: 15px;">
                <strong style="color: #374151;">Referrer:</strong><br>
                <span style="color: #6b7280;">${
                  sessionData.referrer.campaign
                } (${sessionData.referrer.source})</span>
                ${
                  sessionData.referrer.customMessage
                    ? `<br><em style="color: #9ca3af;">"${sessionData.referrer.customMessage}"</em>`
                    : ""
                }
              </div>
            `
                : ""
            }
            
            <div style="margin-top: 15px;">
              <strong style="color: #374151;">Total Events:</strong><br>
              <span style="color: #6b7280;">${
                sessionData.events.length
              } interactions</span>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${
              process.env.CLIENT_URL || "http://localhost:3000"
            }/analytics" 
               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              View Full Analytics
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            Session ended at ${new Date(
              sessionData.lastActivity
            ).toLocaleString()}
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px;">
              © 2025 ResumeHub. All rights reserved.<br>
              <a href="${
                process.env.CLIENT_URL || "http://localhost:3000"
              }/settings" style="color: #9ca3af;">Unsubscribe from analytics emails</a>
            </p>
          </div>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Session analytics email sent successfully to:", userEmail);
    return true;
  } catch (error) {
    console.error("Error sending session analytics email:", error);
    return false;
  }
};

export default transporter;
