"use client"

import { useState, useEffect } from "react"

function Share() {
  const [resumes, setResumes] = useState([])
  const [selectedResume, setSelectedResume] = useState("")
  const [shareUrl, setShareUrl] = useState("")
  const [shortUrl, setShortUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchResumes()
  }, [])

  const fetchResumes = async () => {
    try {
      const response = await fetch("/api/resumes", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setResumes(data.resumes)
      }
    } catch (error) {
      console.error("Error fetching resumes:", error)
    }
    setLoading(false)
  }

  const handleResumeSelect = (resumeId) => {
    setSelectedResume(resumeId)
    const resume = resumes.find((r) => r._id === resumeId)
    if (resume) {
      const url = `${window.location.origin}/r/${resume.shortId}`
      setShareUrl(url)
      setShortUrl("")
    }
  }

  const generateShortUrl = async () => {
    if (!selectedResume) return

    setGenerating(true)
    try {
      const response = await fetch("/api/resumes/short-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ resumeId: selectedResume }),
      })

      const data = await response.json()
      if (data.success) {
        setShortUrl(data.shortUrl)
      }
    } catch (error) {
      console.error("Error generating short URL:", error)
    }
    setGenerating(false)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert("URL copied to clipboard!")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Share Resume</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Resume to Share</label>
            <select
              value={selectedResume}
              onChange={(e) => handleResumeSelect(e.target.value)}
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

          {shareUrl && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Share URL</label>
                <div className="flex">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50"
                  />
                  <button
                    onClick={() => copyToClipboard(shareUrl)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <button
                  onClick={generateShortUrl}
                  disabled={generating}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {generating ? "Generating..." : "Generate Short URL"}
                </button>
              </div>

              {shortUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Short URL</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={shortUrl}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50"
                    />
                    <button
                      onClick={() => copyToClipboard(shortUrl)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-900 mb-2">Analytics Preview</h3>
                {(() => {
                  const resume = resumes.find((r) => r._id === selectedResume)
                  return resume ? (
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Views: {resume.analytics.views}</p>
                      <p>Downloads: {resume.analytics.downloads}</p>
                      <p>Contact Clicks: {resume.analytics.contacts}</p>
                    </div>
                  ) : null
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Share
