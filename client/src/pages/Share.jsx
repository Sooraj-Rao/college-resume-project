"use client";

import { useState, useEffect } from "react";
import { shortenText } from "../pages/Dashboard";

function Share() {
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResumes();
  }, []);

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

  const handleResumeSelect = (resumeId) => {
    setSelectedResume(resumeId);
    const resume = resumes.find((r) => r._id === resumeId);
    if (resume) {
      const url = `${window.location.origin}/r/${resume.shortId}`;
      setShareUrl(url);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = "Copied!";
    button.classList.add("bg-green-600", "hover:bg-green-700");
    button.classList.remove("bg-blue-600", "hover:bg-blue-700");

    setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove("bg-green-600", "hover:bg-green-700");
      button.classList.add("bg-blue-600", "hover:bg-blue-700");
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading your resumes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Share Resume
          </h1>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
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
              <h2 className="text-lg font-semibold text-gray-900">
                Select Resume
              </h2>
            </div>

            <select
              value={selectedResume}
              onChange={(e) => handleResumeSelect(e.target.value)}
              className="input-field mb-4"
            >
              <option value="">Choose a resume to share...</option>
              {resumes.map((resume) => (
                <option key={resume._id} value={resume._id}>
                  {shortenText(resume.name, 40)}
                </option>
              ))}
            </select>
            {selectedResume && (
              <a
                href={`/api/resumes/${selectedResume}/download`}
                className="flex-1   btn-primary text-center text-sm py-2"
              >
                Download
              </a>
            )}
          </div>

          {selectedResume && shareUrl && (
            <>
              <div className="card">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Share URL
                  </h2>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                  />
                  <button
                    onClick={() => copyToClipboard(shareUrl)}
                    className="btn-primary whitespace-nowrap"
                  >
                    Copy Link
                  </button>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18 13V6a1 1 0 00-1-1H7a1 1 0 00-1 1v7m12 0a9 9 0 01-18 0m18 0H6"
                      />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Share via Social Media
                  </h2>
                </div>

                <div className="flex flex-wrap gap-4">
                  <a
                    href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
                      shareUrl
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-social bg-blue-700 hover:bg-blue-800"
                  >
                    Share on LinkedIn
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                      shareUrl
                    )}&text=Check%20out%20my%20resume!`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-social bg-blue-500 hover:bg-blue-600"
                  >
                    Share on Twitter
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-social bg-green-500 hover:bg-green-600"
                  >
                    Share on WhatsApp
                  </a>
                  <a
                    href={`mailto:?subject=Check%20out%20my%20resume&body=${encodeURIComponent(
                      shareUrl
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-social bg-gray-600 hover:bg-gray-700"
                  >
                    Share via Email
                  </a>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-orange-600"
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
                  <h2 className="text-lg font-semibold text-gray-900">
                    Analytics
                  </h2>
                </div>

                {(() => {
                  const resume = resumes.find((r) => r._id === selectedResume);
                  return resume ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-3xl font-bold text-blue-600">
                          {resume.analytics.views}
                        </p>
                        <p className="text-sm text-blue-700 font-medium">
                          Total Views
                        </p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-3xl font-bold text-green-600">
                          {resume.analytics.downloads}
                        </p>
                        <p className="text-sm text-green-700 font-medium">
                          Downloads
                        </p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-3xl font-bold text-purple-600">
                          {resume.analytics.contacts}
                        </p>
                        <p className="text-sm text-purple-700 font-medium">
                          Contact Clicks
                        </p>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Share;
