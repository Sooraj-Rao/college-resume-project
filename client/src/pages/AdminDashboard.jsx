"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function AdminDashboard({ setAdminUser }) {
  const [users, setUsers] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [activeTab, setActiveTab] = useState("users");
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [editingResume, setEditingResume] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("adminToken");

      const [usersRes, resumesRes] = await Promise.all([
        fetch("/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/resumes", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const usersData = await usersRes.json();
      const resumesData = await resumesRes.json();

      if (usersData.success) setUsers(usersData.users);
      if (resumesData.success) setResumes(resumesData.resumes);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setAdminUser(false);
    window.location.href = "/admin";
  };

  const updateUser = async (userId, updates) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      if (data.success) {
        setUsers(users.map((user) => (user._id === userId ? data.user : user)));
        setEditingUser(null);
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const updateResume = async (resumeId, updates) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`/api/admin/resumes/${resumeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      if (data.success) {
        setResumes(
          resumes.map((resume) =>
            resume._id === resumeId ? data.resume : resume
          )
        );
        setEditingResume(null);
      }
    } catch (error) {
      console.error("Error updating resume:", error);
    }
  };

  const deleteUser = async (userId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this user? This will also delete all their resumes."
      )
    ) {
      try {
        const token = localStorage.getItem("adminToken");
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        if (data.success) {
          setUsers(users.filter((user) => user._id !== userId));
          setResumes(resumes.filter((resume) => resume.user._id !== userId));
        }
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const deleteResume = async (resumeId) => {
    if (window.confirm("Are you sure you want to delete this resume?")) {
      try {
        const token = localStorage.getItem("adminToken");
        const response = await fetch(`/api/admin/resumes/${resumeId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        if (data.success) {
          setResumes(resumes.filter((resume) => resume._id !== resumeId));
        }
      } catch (error) {
        console.error("Error deleting resume:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">
                Admin Dashboard
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
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
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {users.length}
                </p>
                <p className="text-gray-600">Total Users</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {resumes.length}
                </p>
                <p className="text-gray-600">Total Resumes</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("users")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "users"
                    ? "border-red-500 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Users ({users.length})
              </button>
              <button
                onClick={() => setActiveTab("resumes")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "resumes"
                    ? "border-red-500 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Resumes ({resumes.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "users" && (
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user._id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    {editingUser === user._id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input
                            type="text"
                            defaultValue={user.name}
                            className="input-field"
                            placeholder="Name"
                            id={`name-${user._id}`}
                          />
                          <input
                            type="email"
                            defaultValue={user.email}
                            className="input-field"
                            placeholder="Email"
                            id={`email-${user._id}`}
                          />
                        </div>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              defaultChecked={user.isActive}
                              className="mr-2"
                              id={`active-${user._id}`}
                            />
                            Active Account
                          </label>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              const name = document.getElementById(
                                `name-${user._id}`
                              ).value;
                              const email = document.getElementById(
                                `email-${user._id}`
                              ).value;
                              const isActive = document.getElementById(
                                `active-${user._id}`
                              ).checked;
                              updateUser(user._id, { name, email, isActive });
                            }}
                            className="btn-success text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="btn-secondary text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {user.name}
                          </h3>
                          <p className="text-gray-600">{user.email}</p>
                          <p className="text-sm text-gray-500">
                            Status: {user.isActive ? "Active" : "Disabled"} •
                            Joined:{" "}
                            {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingUser(user._id)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteUser(user._id)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "resumes" && (
              <div className="space-y-4">
                {resumes.map((resume) => (
                  <div
                    key={resume._id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    {editingResume === resume._id ? (
                      <div className="space-y-4">
                        <input
                          type="text"
                          defaultValue={resume.name}
                          className="input-field"
                          placeholder="Resume Name"
                          id={`resume-name-${resume._id}`}
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              const name = document.getElementById(
                                `resume-name-${resume._id}`
                              ).value;
                              updateResume(resume._id, { name });
                            }}
                            className="btn-success text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingResume(null)}
                            className="btn-secondary text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {resume.name}
                          </h3>
                          <p className="text-gray-600">
                            Owner: {resume.user.name} ({resume.user.email})
                          </p>
                          <p className="text-sm text-gray-500">
                            Views: {resume.analytics.views} • Downloads:{" "}
                            {resume.analytics.downloads} • Uploaded:{" "}
                            {new Date(resume.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <a
                            href={`/r/${resume.shortId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-700 text-sm font-medium"
                          >
                            View
                          </a>
                          <button
                            onClick={() => setEditingResume(resume._id)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteResume(resume._id)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
