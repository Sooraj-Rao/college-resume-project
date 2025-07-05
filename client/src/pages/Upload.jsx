"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { shortenText } from "../pages/Dashboard";

function Upload() {
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (selectedFile) => {
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        setError("Please select a PDF file");
        return;
      }
      if (selectedFile.size > 250 * 1024) {
        setError("File size must be less than 250KB");
        return;
      }
      setFile(selectedFile);
      setName(selectedFile.name.replace(".pdf", ""));
      setError("");
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !name) {
      setError("Please select a file and enter a name");
      return;
    }

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("name", name);

    try {
      const response = await fetch("/api/resumes/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        navigate("/dashboard");
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Upload failed. Please try again.");
    }

    setUploading(false);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upload Resume
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 ">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="card">
            {file && (
              <div className=" flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setName("");
                  }}
                  className="text-sm mb-4 text-center  text-red-600 hover:text-red-700"
                >
                  Remove file
                </button>
              </div>
            )}
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 ${
                dragActive
                  ? "border-blue-400 bg-blue-50"
                  : file
                  ? "border-green-400 bg-green-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => handleFileChange(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {file ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {shortenText(file.name,35)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {Math.round(file.size / 1024)} KB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
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
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      Drop your PDF here, or{" "}
                      <span className="text-blue-600">browse</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Maximum file size: 250KB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {file && (
            <div className="card">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Resume Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Enter a name for your resume"
                required
              />
            </div>
          )}
          {!file && (
            <div className="card bg-blue-50 border-blue-200">
              <ul className="text-sm text-blue-800 space-y-2">
                <li className="flex items-center">
                  <svg
                    className="w-4 h-4 text-blue-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  File must be in PDF format
                </li>
                <li className="flex items-center">
                  <svg
                    className="w-4 h-4 text-blue-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Maximum file size: 250KB
                </li>
              </ul>
            </div>
          )}

          <button
            type="submit"
            disabled={uploading || !file || !name}
            className="w-full btn-primary py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Uploading Resume...
              </div>
            ) : (
              "Upload Resume"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Upload;
