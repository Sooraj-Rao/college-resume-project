import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema(
  {
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    events: [{
      type: {
        type: String,
        enum: ['view', 'download','time','exit'], // Simplified events
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      // Removed 'data' field
    }],
    deviceInfo: {
      type: {
        type: String,
        enum: ['desktop', 'mobile', 'tablet', 'unknown'],
        default: 'unknown',
      },
      browser: String,
      os: String,
      userAgent: String,
    },
    location: {
      ip: String,
      country: String,
      region: String,
      city: String,
      timezone: String,
      coordinates: {
        lat: Number,
        lng: Number,
      }
    },
    referrer: {
      source: String, // The referring website hostname
      campaign: String, // ref parameter value
      // Removed 'medium', 'customMessage'
    },
    timeSpent: {
      type: Number,
      default: 0, // in seconds
    },
    lastActivity: { // Keep this to calculate timeSpent
      type: Date,
      default: Date.now,
    }
    // Removed totalClicks, scrollDepth, isActive
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
analyticsSchema.index({ resume: 1, createdAt: -1 });
analyticsSchema.index({ sessionId: 1 });
analyticsSchema.index({ 'referrer.campaign': 1 });

export default mongoose.model("Analytics", analyticsSchema);
