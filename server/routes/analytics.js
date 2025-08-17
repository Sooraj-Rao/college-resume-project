import express from "express";
import Analytics from "../models/Analytics.js";
import Resume from "../models/Resume.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get analytics overview for user's resumes
router.get("/overview", authenticateToken, async (req, res) => {
  try {
    const userResumes = await Resume.find({ user: req.user._id }).select('_id name');
    const resumeIds = userResumes.map(r => r._id);

    // Get total stats
    const totalSessions = await Analytics.countDocuments({ resume: { $in: resumeIds } });
    const totalViews = await Resume.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: null, total: { $sum: '$analytics.views' } } }
    ]);
    const totalDownloads = await Resume.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: null, total: { $sum: '$analytics.downloads' } } }
    ]);

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSessions = await Analytics.find({
      resume: { $in: resumeIds },
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: -1 }).limit(10).populate('resume', 'name');

    // Get top performing resumes
    const topResumes = await Resume.find({ user: req.user._id })
      .sort({ 'analytics.views': -1 })
      .limit(5)
      .select('name analytics');

    // Get analytics by date (last 30 days)
    const dailyStats = await Analytics.aggregate([
      {
        $match: {
          resume: { $in: resumeIds },
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          sessions: { $sum: 1 },
          uniqueVisitors: { $addToSet: "$sessionId" }
        }
      },
      {
        $project: {
          date: "$_id",
          sessions: 1,
          uniqueVisitors: { $size: "$uniqueVisitors" }
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalSessions,
        totalViews: totalViews[0]?.total || 0,
        totalDownloads: totalDownloads[0]?.total || 0,
        recentSessions,
        topResumes,
        dailyStats
      }
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get detailed analytics for a specific resume
router.get("/resume/:resumeId", authenticateToken, async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.resumeId,
      user: req.user._id
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found"
      });
    }

    // Get all sessions for this resume
    const sessions = await Analytics.find({ resume: req.params.resumeId })
      .sort({ createdAt: -1 });

    // Get geographic distribution
    const geoStats = await Analytics.aggregate([
      { $match: { resume: resume._id } },
      {
        $group: {
          _id: {
            country: "$location.country",
            city: "$location.city"
          },
          count: { $sum: 1 },
          avgTimeSpent: { $avg: "$timeSpent" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get device type distribution
    const deviceStats = await Analytics.aggregate([
      { $match: { resume: resume._id } },
      {
        $group: {
          _id: "$deviceInfo.type",
          count: { $sum: 1 },
          avgTimeSpent: { $avg: "$timeSpent" }
        }
      }
    ]);

    // Get referrer statistics
    const referrerStats = await Analytics.aggregate([
      { $match: { resume: resume._id } },
      {
        $group: {
          _id: {
            source: "$referrer.source",
            campaign: "$referrer.campaign",
            // Removed medium, customMessage
          },
          count: { $sum: 1 },
          avgTimeSpent: { $avg: "$timeSpent" }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get time-based analytics (hourly distribution)
    const timeStats = await Analytics.aggregate([
      { $match: { resume: resume._id } },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Removed eventStats aggregation

    res.json({
      success: true,
      data: {
        resume: {
          name: resume.name,
          analytics: resume.analytics
        },
        sessions: sessions.map(session => ({
          sessionId: session.sessionId,
          createdAt: session.createdAt,
          timeSpent: session.timeSpent,
          // Removed totalClicks, scrollDepth
          deviceInfo: session.deviceInfo,
          location: session.location,
          referrer: session.referrer,
          events: session.events // Keep events for now, but filter types on client
        })),
        geoStats,
        deviceStats,
        referrerStats,
        timeStats,
        // Removed eventStats
      }
    });
  } catch (error) {
    console.error('Resume analytics error:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get session details
router.get("/session/:sessionId", authenticateToken, async (req, res) => {
  try {
    const session = await Analytics.findOne({ sessionId: req.params.sessionId })
      .populate('resume', 'name user');

    if (!session || session.resume.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Session details error:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get analytics comparison between resumes
router.get("/compare", authenticateToken, async (req, res) => {
  try {
    const { resumeIds } = req.query;
    
    if (!resumeIds) {
      return res.status(400).json({
        success: false,
        message: "Resume IDs are required"
      });
    }

    const ids = resumeIds.split(',');
    
    // Verify all resumes belong to the user
    const resumes = await Resume.find({
      _id: { $in: ids },
      user: req.user._id
    });

    if (resumes.length !== ids.length) {
      return res.status(404).json({
        success: false,
        message: "One or more resumes not found"
      });
    }

    const comparison = await Promise.all(
      resumes.map(async (resume) => {
        const sessions = await Analytics.countDocuments({ resume: resume._id });
        const avgTimeSpent = await Analytics.aggregate([
          { $match: { resume: resume._id } },
          { $group: { _id: null, avg: { $avg: "$timeSpent" } } }
        ]);

        return {
          resumeId: resume._id,
          name: resume.name,
          analytics: resume.analytics,
          sessions,
          avgTimeSpent: avgTimeSpent[0]?.avg || 0
        };
      })
    );

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('Analytics comparison error:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
