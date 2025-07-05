"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Upload() {
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
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
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Upload Resume</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PDF File (Max 250KB)
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {file && (
              <div className="mt-2 text-sm text-gray-600">
                Selected: {file.name} ({Math.round(file.size / 1024)}KB)
              </div>
            )}
          </div>
          {file && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resume Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter resume name"
                required
              />
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-md">
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• File must be in PDF format</li>
              <li>• Maximum file size: 250KB</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={uploading || !file}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Uploading..." : "Upload Resume"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Upload;
