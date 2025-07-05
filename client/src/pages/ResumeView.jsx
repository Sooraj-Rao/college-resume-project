"use client";

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

function ResumeView() {
  const { resumeId } = useParams();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchResume();
  }, [resumeId]);

  const fetchResume = async () => {
    try {
      const response = await fetch(`/api/resumes/public/${resumeId}`);
      const data = await response.json();

      if (data.success) {
        setResume(data.resume);
        // Track view
        trackAction("view");
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError("Failed to load resume");
    }
    setLoading(false);
  };

  const trackAction = async (action) => {
    try {
      await fetch(`/api/resumes/track/${resumeId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
    } catch (error) {
      console.error("Failed to track action:", error);
    }
  };

  const handleDownload = () => {
    trackAction("download");
    window.open(`/api/resumes/public/${resumeId}/download`, "_blank");
  };

  const handleContact = () => {
    trackAction("contact");
    if (resume?.user?.email) {
      window.location.href = `mailto:${resume.user.email}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading resume...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-600 mb-4">{error}</div>
          <p className="text-gray-600">
            The resume you're looking for might have been removed or is no
            longer available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg flex justify-center shadow-md overflow-hidden">
          <div className="p-6 w-full">
            <div className="pdf-viewer">
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                <Viewer fileUrl={`/api/resumes/public/${resumeId}/file`} />
              </Worker>
            </div>
          </div>
          <div className=" p-6 w-[30%]">
            <div>
              <div>
                <h1 className="text-2xl font-bold mb-2">{resume.name}</h1>
                <div className="text-gray-300">
                  <p>{resume.user.name}</p>
                  <p>{resume.user.email}</p>
                </div>
              </div>

              <div className="mt-4 md:mt-0 gap-3">
                <button
                  onClick={handleDownload}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-200"
                >
                  Download Resume
                </button>
                <button
                  onClick={handleContact}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition duration-200"
                >
                  Contact
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResumeView;
