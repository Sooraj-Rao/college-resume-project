"use client";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Share from "./pages/Share";
import AI from "./pages/AI";
import Settings from "./pages/Settings";
import ResumeView from "./pages/ResumeView";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

function App() {
  const [user, setUser] = useState(null);
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
        {user && !user?.isActive && (
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
            <Sidebar user={user} setUser={setUser} />
            <main className="flex-1 overflow-auto">
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/share" element={<Share />} />
                <Route path="/ai" element={<AI />} />
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
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </>
        )}
      </div>
    </Router>
  );
}

export default App;
