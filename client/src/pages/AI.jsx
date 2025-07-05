"use client";

import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import { shortenText } from "../pages/Dashboard";

function AI() {
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState("");
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

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

  const generateFeedback = async () => {
    if (!selectedResume || !query.trim()) {
      alert("Please select a resume and enter a query");
      return;
    }

    setGenerating(true);
    setFeedback("");

    try {
      const response = await fetch("/api/ai/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          resumeId: selectedResume,
          query: query.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setFeedback(data.feedback);
      } else {
        alert("Failed to generate feedback: " + data.message);
      }
    } catch (error) {
      console.error("Error generating feedback:", error);
      alert("Network error. Please check your connection and try again.");
    }

    setGenerating(false);
  };

  const downloadFeedbackPDF = () => {
    if (!feedback) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;

    doc.setFontSize(16);
    doc.text("Resume AI Feedback", margin, 20);

    doc.setFontSize(12);
    doc.text(`Query: ${query}`, margin, 35);

    doc.setFontSize(10);
    const lines = doc.splitTextToSize(feedback, maxWidth);
    doc.text(lines, margin, 50);

    doc.save("resume-feedback.pdf");
  };

  const exampleQueries = [
    "Software Engineer at MNC companies",
    "Frontend Developer position",
    "Data Scientist role",
    "Marketing Manager job",
    "Product Manager position",
    "General resume improvement",
  ];

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
            AI Resume Feedback
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
              onChange={(e) => setSelectedResume(e.target.value)}
              className="input-field"
            >
              <option value="">Choose a resume for analysis...</option>
              {resumes.map((resume) => (
                <option key={resume._id} value={resume._id}>
                  {shortenText(resume.name, 40)}
                </option>
              ))}
            </select>
          </div>

          <div className="card">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Job Role or Query
              </h2>
            </div>

            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Software Engineer at Google, Frontend Developer, Marketing Manager, etc."
              className="input-field resize-none"
              rows={3}
            />

            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Quick examples:
              </p>
              <div className="flex flex-wrap gap-2">
                {exampleQueries.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setQuery(example)}
                    className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors duration-200"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={generateFeedback}
              disabled={generating || !selectedResume || !query}
              className="btn-primary px-8 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Analyzing Resume...
                </div>
              ) : (
                <div className="flex items-center">
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
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  Get AI Feedback
                </div>
              )}
            </button>
          </div>

          {feedback && (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      AI Feedback
                    </h2>
                    <p className="text-sm text-gray-600">
                      Analysis for: "{query}" • Resume:{" "}
                      {(() => {
                        const resume = resumes.find(
                          (r) => r._id === selectedResume
                        );
                        return resume ? resume.name : "Unknown";
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                {HighlightedText(feedback)}
              </div>
              <div className=" mt-5">
                <button
                  onClick={downloadFeedbackPDF}
                  className="btn-success flex items-center mb-1"
                >
                  <svg
                    className="w-4 h-4 mr-2"
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
                  Download as PDF
                </button>
                <p className="text-sm text-gray-700">
                  We don't save resume feedback. If you need it in the future,
                  please download it now.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AI;

const HighlightedText = (text) => {
  const renderHighlighted = (segment) => {
    const cleanedSegment = segment.replace(/\*\*/g, "*");
    const parts = cleanedSegment.split(/(\*[^*]+\*|"[^"]+"|[^:]+:(?=\s))/g);

    return parts
      .map((part, i) => {
        if (!part.trim()) return null;

        const isAsterisk =
          part.startsWith("*") && part.endsWith("*") && part.length > 2;
        const isQuote = part.startsWith('"') && part.endsWith('"');
        const isHeading = part.endsWith(":") && !part.includes("\n");

        if (isAsterisk) {
          return (
            <span key={i} className="font-semibold text-orange-700 block mt-2">
              {part.slice(1, -1)}
            </span>
          );
        }

        if (isQuote) {
          return (
            <span key={i} className="font-semibold text-pink-600">
              {part.slice(1, -1)}
            </span>
          );
        }

        if (isHeading && part.length < 50) {
          return (
            <span
              key={i}
              className="font-semibold text-blue-700 block mt-3 mb-1"
            >
              {part}
            </span>
          );
        }

        return <span key={i}>{part}</span>;
      })
      .filter(Boolean);
  };

  const cleanText = text
    .replace(/\*\*([^*]+)\*\*/g, "*$1*")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .replace(/\s+6\.\s*$/, "")
    .replace(/^\s*\*\s*/, "")
    .trim();

  const scoreMatch = cleanText.match(/(Resume Score: \d+\/\d+[\s\S]*)/);
  const scoreSection = scoreMatch?.[1] || "";
  const mainContent = scoreSection
    ? cleanText.replace(scoreSection, "").trim()
    : cleanText;

  const sections = mainContent
    .split(/(?=\n?\d+\.\s+\*\*[^*]+:\*\*)/)
    .filter((section) => section.trim());

  return (
    <div className="space-y-6 text-gray-800 leading-relaxed">
      {sections.map((section, index) => {
        const trimmedSection = section.trim();
        if (!trimmedSection) return null;

        const titleMatch = trimmedSection.match(/^(\d+\.\s+[^:]+:)/);
        if (!titleMatch) {
          return (
            <div key={index} className="text-gray-700">
              {renderHighlighted(trimmedSection)}
            </div>
          );
        }

        const title = titleMatch[1];
        const content = trimmedSection.replace(title, "").trim();

        return (
          <div key={index} className="border-l-4 border-blue-200 pl-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            <div className="text-gray-700 leading-relaxed">
              {renderHighlighted(content)}
            </div>
          </div>
        );
      })}
    </div>
  );
};
