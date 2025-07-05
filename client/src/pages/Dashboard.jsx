"use client";

import { useState, useEffect } from "react";
import { CiEdit } from "react-icons/ci";
import { Link } from "react-router-dom";
import { IoClose } from "react-icons/io5";

function Dashboard() {
  const [resumes, setResumes] = useState([]);
  const [filteredResumes, setFilteredResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditResume, setisEditResume] = useState("");
  const [sortBy, setSortBy] = useState("date");

  useEffect(() => {
    fetchResumes();
  }, []);

  useEffect(() => {
    filterAndSortResumes();
  }, [resumes, searchTerm, sortBy]);

  const fetchResumes = async () => {
    try {
      const response = await fetch("/api/resumes", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setResumes(data.resumes);
      }
    } catch (error) {
      console.error("Error fetching resumes:", error);
    }
    setLoading(false);
  };

  const filterAndSortResumes = () => {
    const filtered = resumes.filter((resume) =>
      resume.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "name":
          return a.name.localeCompare(b.name);
        case "views":
          return b.analytics.views - a.analytics.views;
        default:
          return 0;
      }
    });

    setFilteredResumes(filtered);
  };

  const deleteResume = async (resumeId) => {
    if (window.confirm("Are you sure you want to delete this resume?")) {
      try {
        const response = await fetch(`/api/resumes/${resumeId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
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

  const updateResume = async (resumeId, updates) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/auth/resumes/${resumeId}`, {
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
        setisEditResume("");
      }
    } catch (error) {
      console.error("Error updating resume:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search resumes..."
                className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              className="px-4 py-3  border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="views">Sort by Views</option>
            </select>
            <Link
              to="/upload"
              className="btn-primary flex items-center whitespace-nowrap"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Resume
            </Link>
          </div>
        </div>
      </div>

      {filteredResumes.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {resumes.length === 0
              ? "No resumes yet"
              : "No resumes match your search"}
          </h3>
          <p className="text-gray-600 mb-6">
            {resumes.length === 0
              ? "Upload your first resume to get started with organizing your professional documents."
              : "Try adjusting your search terms or filters."}
          </p>
          {resumes.length === 0 && (
            <Link to="/upload" className="btn-primary">
              Upload Your First Resume
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResumes.map((resume) => (
            <div
              key={resume._id}
              className="card hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div>
                    {isEditResume === resume._id ? (
                      <>
                        <input
                          defaultValue={resume.name}
                          className="input-field mb-1"
                          type="text"
                          id={`resume-name-${resume._id}`}
                        />
                        <div className=" flex items-center justify-between">
                          <button
                            onClick={() => {
                              const name = document.getElementById(
                                `resume-name-${resume._id}`
                              ).value;
                              updateResume(resume._id, { name });
                            }}
                            className="btn-success mb-1 text-sm"
                          >
                            Save
                          </button>
                          <span
                            className=" cursor-pointer hover:bg-gray-100 p-1"
                            onClick={() => setisEditResume("")}
                          >
                            <IoClose className=" scale-125" />
                          </span>
                        </div>
                      </>
                    ) : (
                      <h3 className="text-lg flex items-center gap-2 font-semibold text-gray-900 mb-1 truncate">
                        {shortenText(resume.name, 20)}
                        <span
                          onClick={() => setisEditResume(resume._id)}
                          className=" cursor-pointer hover:bg-gray-100 p-1"
                        >
                          <CiEdit />
                        </span>
                      </h3>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(resume.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {isEditResume !== resume._id && (
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-blue-600"
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
                )}
              </div>

              {/* <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {resume.analytics.views}
                  </p>
                  <p className="text-xs text-gray-500">Views</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {resume.analytics.downloads}
                  </p>
                  <p className="text-xs text-gray-500">Downloads</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {resume.analytics.contacts}
                  </p>
                  <p className="text-xs text-gray-500">Contacts</p>
                </div>
              </div> */}

              <div className="flex gap-2">
                <a
                  href={`/r/${resume.shortId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 btn-secondary text-center text-sm py-2"
                >
                  View
                </a>
                <a
                  href={`/api/resumes/${resume._id}/download`}
                  className="flex-1 btn-primary text-center text-sm py-2"
                >
                  Download
                </a>
                <button
                  onClick={() => deleteResume(resume._id)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;

export function shortenText(text, number = 15) {
  return text.length > number ? text.slice(0, number) + "..." : text;
}
