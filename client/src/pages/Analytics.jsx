"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

function Analytics() {
  const [overview, setOverview] = useState(null);
  const [selectedResume, setSelectedResume] = useState("");
  const [resumeAnalytics, setResumeAnalytics] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resumeLoading, setResumeLoading] = useState(false);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      const response = await fetch("/api/analytics/overview", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setOverview(data.data);
      }
    } catch (error) {
      console.error("Error fetching analytics overview:", error);
    }
    setLoading(false);
  };

  const fetchResumeAnalytics = async (resumeId) => {
    setResumeLoading(true);
    try {
      const response = await fetch(`/api/analytics/resume/${resumeId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setResumeAnalytics(data.data);
      }
    } catch (error) {
      console.error("Error fetching resume analytics:", error);
    }
    setResumeLoading(false);
  };

  const handleResumeSelect = (resumeId) => {
    setSelectedResume(resumeId);
    if (resumeId) {
      fetchResumeAnalytics(resumeId);
    } else {
      setResumeAnalytics(null);
    }
  };

  const formatTime = (seconds) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Color schemes for charts
  const COLORS = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#14B8A6",
    "#F97316",
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const dailyStatsData =
    overview?.dailyStats?.map((stat) => ({
      date: new Date(stat.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      sessions: stat.sessions,
      uniqueVisitors: stat.uniqueVisitors,
    })) || [];

  const deviceData =
    resumeAnalytics?.deviceStats?.map((stat) => ({
      name: stat._id.charAt(0).toUpperCase() + stat._id.slice(1),
      value: stat.count,
      avgTime: stat.avgTimeSpent || 0,
    })) || [];

  const geoData =
    resumeAnalytics?.geoStats?.slice(0, 10).map((stat) => ({
      location: `${stat._id.city}, ${stat._id.country}`,
      sessions: stat.count,
      avgTime: stat.avgTimeSpent || 0,
    })) || [];
  const referrerData =
    resumeAnalytics?.referrerStats?.map((stat) => ({
      source: stat._id.campaign || "N/A",
      visits: stat.count,
      avgTime: stat.avgTimeSpent || 0,
    })) || [];

  let eventsArr = [];
  let views = 0;

  selectedSession?.events?.forEach((item) => {
    if (item?.type == "view") views++;
    if (views == 1 || item.type == "download") {
      eventsArr.push(item);
    }
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600">
            Track your resume performance and visitor insights
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {overview?.totalViews || 0}
            </p>
            <p className="text-sm text-gray-600">Total Views</p>
          </div>

          <div className="card text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {overview?.totalDownloads || 0}
            </p>
            <p className="text-sm text-gray-600">Downloads</p>
          </div>

          <div className="card text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {overview?.totalSessions || 0}
            </p>
            <p className="text-sm text-gray-600">Total Sessions</p>
          </div>

          <div className="card text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {overview?.topResumes?.length || 0}
            </p>
            <p className="text-sm text-gray-600">Active Resumes</p>
          </div>
        </div>

        {/* Daily Activity Chart */}
        {dailyStatsData.length > 0 && (
          <div className="card mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Activity Over Time (Last 30 Days)
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyStatsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="sessions"
                    stackId="1"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.6}
                    name="Sessions"
                  />
                  <Area
                    type="monotone"
                    dataKey="uniqueVisitors"
                    stackId="2"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.6}
                    name="Unique Visitors"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Top Performing Resumes */}
        {overview?.topResumes && overview.topResumes.length > 0 && (
          <div className="card mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Top Performing Resumes
            </h3>
            <div className="space-y-3">
              {overview.topResumes.map((resume, index) => (
                <div
                  key={resume._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{resume.name}</p>
                      <p className="text-sm text-gray-500">
                        {resume.analytics.views} views •{" "}
                        {resume.analytics.downloads} downloads
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleResumeSelect(resume._id)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resume Selection */}
        <div className="card mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Detailed Resume Analytics
          </h3>
          <select
            value={selectedResume}
            onChange={(e) => handleResumeSelect(e.target.value)}
            className="input-field max-w-md"
          >
            <option value="">Select a resume for detailed analytics...</option>
            {overview?.topResumes?.map((resume) => (
              <option key={resume._id} value={resume._id}>
                {resume.name}
              </option>
            ))}
          </select>
        </div>

        {/* Detailed Resume Analytics */}
        {resumeLoading && (
          <div className="card text-center py-8">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading detailed analytics...</p>
          </div>
        )}

        {resumeAnalytics && !resumeLoading && (
          <div className="space-y-8">
            {/* Resume Overview */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {resumeAnalytics.resume.name} - Overview
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {resumeAnalytics.resume.analytics.views}
                  </p>
                  <p className="text-sm text-blue-700">Views</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {resumeAnalytics.resume.analytics.downloads}
                  </p>
                  <p className="text-sm text-green-700">Downloads</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {resumeAnalytics.sessions.length}
                  </p>
                  <p className="text-sm text-purple-700">Sessions</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">
                    {formatTime(
                      resumeAnalytics.sessions.reduce(
                        (acc, s) => acc + s.timeSpent,
                        0
                      ) / resumeAnalytics.sessions.length || 0
                    )}
                  </p>
                  <p className="text-sm text-orange-700">Avg. Time</p>
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Device Distribution */}
              {deviceData.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Device Types
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={deviceData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {deviceData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Geographic Distribution */}
              {geoData.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Top Locations
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={geoData}
                        layout="horizontal"
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <YAxis type="number" dataKey="sessions" />
                        <XAxis dataKey="location" type="category" width={100} />
                        <Tooltip />
                        <Bar dataKey="sessions" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Referrer Performance */}
              {referrerData.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Traffic Sources
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={referrerData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="source" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="visits" fill="#F59E0B" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Referrer Statistics Table */}
            {referrerData.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Traffic Sources Details
                </h3>
                <div className="space-y-3">
                  {referrerData.map((stat, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {stat.source}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {stat.visits} visits
                        </p>
                        <p className="text-sm text-gray-500">
                          Avg: {formatTime(stat.avgTime)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Sessions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Sessions
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {resumeAnalytics.sessions.slice(0, 10).map((session) => (
                  <div
                    key={session.sessionId}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedSession(session)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {session.location.city}, {session.location.country}
                        </p>
                        <p className="text-sm text-gray-500">
                          {session.deviceInfo.type} •{" "}
                          {session.deviceInfo.browser}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(session.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatTime(session.timeSpent)}
                        </p>
                        <p className="text-sm text-gray-500"></p>
                        {session.referrer.campaign && (
                          <p className="text-xs text-blue-600">
                            From: {session.referrer.campaign}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Session Detail Modal */}
        {selectedSession && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Session Details
                  </h3>
                  <button
                    onClick={() => setSelectedSession(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Location
                      </p>
                      <p className="text-gray-900">
                        {selectedSession.location.city},{" "}
                        {selectedSession.location.country}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Device
                      </p>
                      <p className="text-gray-900">
                        {selectedSession.deviceInfo.type}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Browser
                      </p>
                      <p className="text-gray-900">
                        {selectedSession.deviceInfo.browser}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Time Spent
                      </p>
                      <p className="text-gray-900">
                        {formatTime(selectedSession.timeSpent)}
                      </p>
                    </div>
                  </div>

                  {selectedSession.referrer.campaign && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Referrer
                      </p>
                      <p className="text-blue-900 font-semibold">
                        {selectedSession.referrer.campaign}
                      </p>
                      {/* Removed customMessage */}
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Activity Timeline
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {eventsArr
                        .filter(
                          (event) => ["view", "download"].includes(event.type) // Filter to only show relevant events
                        )
                        .map((event, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <span className="text-sm text-gray-900 capitalize">
                              {event.type}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Analytics;
