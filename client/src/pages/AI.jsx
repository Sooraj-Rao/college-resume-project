"use client";

import { useState, useEffect } from "react";
import jsPDF from "jspdf";

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        AI Resume Feedback
      </h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Resume
            </label>
            <select
              value={selectedResume}
              onChange={(e) => setSelectedResume(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a resume...</option>
              {resumes.map((resume) => (
                <option key={resume._id} value={resume._id}>
                  {resume.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Role or Query
            </label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Software Engineer at Google, Frontend Developer, Marketing Manager, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />

            <div className="mt-2">
              <p className="text-xs text-gray-600 mb-2">Example queries:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Software Engineer at FAANG companies",
                  "Frontend Developer position",
                  "Data Scientist role",
                  "Marketing Manager job",
                  "Product Manager position",
                  "General resume improvement",
                ].map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setQuery(example)}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={generateFeedback}
            disabled={generating || !selectedResume || !query}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? "Generating Feedback..." : "Get AI Feedback"}
          </button>

          {feedback && (
            <div className="space-y-4">
              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      AI Feedback
                    </h3>
                    <p className="text-sm text-gray-600">
                      Query: "{query}" | Resume:{" "}
                      {(() => {
                        const resume = resumes.find(
                          (r) => r._id === selectedResume
                        );
                        return resume ? resume.name : "Unknown";
                      })()}
                    </p>
                  </div>
                  <button
                    onClick={downloadFeedbackPDF}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    Download PDF
                  </button>
                </div>
                <div className="bg-gray-50 p-6 rounded-md border">
                  {HighlightedText(feedback)}
                </div>
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
            <>
              <span key={i} className="font-semibold   text-orange-800 ">
                <br />
                {part.slice(1, -1)}
              </span>
            </>
          );
        }

        if (isQuote) {
          return (
            <span key={i} className="font-semibold text-pink-600 ">
              {part.slice(1, -1)}
            </span>
          );
        }

        if (isHeading && part.length < 50) {
          return (
            <span key={i} className="font-semibold  text-blue-700">
              <br />
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
    .split(/(?=\d+\.\s+[A-Z][^:]*:)/)
    .filter((section) => section.trim())
    .map((section) => {
      return section
        .replace(/\s+\d+\.\s*$/, "")
        .replace(/^\s*\*\s*/, "")
        .trim();
    })
    .filter(Boolean);
  return (
    <div className="space-y-6">
      {sections.map((section, index) => {
        const trimmedSection = section.trim();
        if (!trimmedSection) return null;

        const titleMatch = trimmedSection.match(/^(\d+\.\s+[^:]+:)/);
        if (!titleMatch) {
          return (
            <div key={index} className="">
              {renderHighlighted(trimmedSection)}
            </div>
          );
        }

        const title = titleMatch[1];
        const content = trimmedSection.replace(title, "").trim();

        return (
          <div key={index} className="space-y-3">
            <h3 className="text-lg font-semibold  border-b border-gray-700 pb-1">
              {title}
            </h3>
            <div className=" leading-relaxed pl-2">
              {renderHighlighted(content)}
            </div>
          </div>
        );
      })}
    </div>
  );
};
