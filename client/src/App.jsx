"use client";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Share from "./pages/Share";
import AI from "./pages/AI";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import ResumeView from "./pages/ResumeView";
import ResumeBuilder from "./pages/ResumeBuilder"; // New import
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  const [user, setUser] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("/api/auth/verify", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setUser(data.user);
          } else {
            localStorage.removeItem("token");
          }
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem("token");
          setLoading(false);
        });
    } else {
      setLoading(false);
    }

    const adminToken = localStorage.getItem("adminToken");
    if (adminToken) {
      fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setAdminUser(true);
          } else {
            localStorage.removeItem("adminToken");
          }
        })
        .catch(() => {
          localStorage.removeItem("adminToken");
        });
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {user && user?.isActive == false && (
          <div className="bg-yellow-100 text-yellow-800 p-4 rounded-md shadow-sm">
            <p className="font-medium">Account Disabled</p>
            <p>
              Your resumes are currently private. Please enable your account to
              view them. Enable your account in
              <a href="/settings#disable" className="ml-1 underline">
                Settings
              </a>
            </p>
          </div>
        )}

        {user ? (
          <div className="flex h-screen">
            {!window.location.href.includes("builder") && (
              <Sidebar user={user} setUser={setUser} />
            )}
            <main className="flex-1 overflow-auto">
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/share" element={<Share />} />
                <Route path="/ai" element={<AI />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/builder" element={<ResumeBuilder />} />{" "}
                {/* New route */}
                <Route
                  path="/settings"
                  element={<Settings user={user} setUser={setUser} />}
                />
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="/login" element={<Navigate to="/dashboard" />} />
                <Route
                  path="/register"
                  element={<Navigate to="/dashboard" />}
                />
                <Route path="/r/:resumeId" element={<ResumeView />} />
              </Routes>
            </main>
          </div>
        ) : (
          <>
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login setUser={setUser} />} />
              <Route
                path="/register"
                element={<Register setUser={setUser} />}
              />
              <Route path="/r/:resumeId" element={<ResumeView />} />
              <Route
                path="/admin"
                element={
                  adminUser ? (
                    <Navigate to="/admin/dashboard" />
                  ) : (
                    <AdminLogin setAdminUser={setAdminUser} />
                  )
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  adminUser ? (
                    <AdminDashboard setAdminUser={setAdminUser} />
                  ) : (
                    <Navigate to="/admin" />
                  )
                }
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </>
        )}
      </div>
    </Router>
  );
}

export default App;
