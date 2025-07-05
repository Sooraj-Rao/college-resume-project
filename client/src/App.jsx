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
import Settings from "./pages/Settings";
import ResumeView from "./pages/ResumeView";
import Navbar from "./components/Navbar";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Verify token with backend
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} setUser={setUser} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={
              !user ? <Login setUser={setUser} /> : <Navigate to="/dashboard" />
            }
          />
          <Route
            path="/register"
            element={
              !user ? (
                <Register setUser={setUser} />
              ) : (
                <Navigate to="/dashboard" />
              )
            }
          />
          <Route
            path="/dashboard"
            element={user ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/upload"
            element={user ? <Upload /> : <Navigate to="/login" />}
          />
          <Route
            path="/share"
            element={user ? <Share /> : <Navigate to="/login" />}
          />
          <Route
            path="/ai"
            element={user ? <AI /> : <Navigate to="/login" />}
          />
          <Route
            path="/settings"
            element={
              user ? (
                <Settings user={user} setUser={setUser} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route path="/r/:resumeId" element={<ResumeView />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
