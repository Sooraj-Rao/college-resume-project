"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { Viewer, Worker } from "@react-pdf-viewer/core"
import "@react-pdf-viewer/core/lib/styles/index.css"
import "@react-pdf-viewer/default-layout/lib/styles/index.css"

function ResumeView() {
  const [searchParams] = useSearchParams()

  const [isDemo, setisDemo] = useState(searchParams.get("ref"))
  const { resumeId } = useParams()
  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [sessionId, setSessionId] = useState(null)
  const [isOwner, setIsOwner] = useState(false) // Track if user is owner

  // Fetch resume data
  useEffect(() => {
    const fetchResume = async () => {
      try {
        const headers = {}
        const token = localStorage.getItem("token")
        if (token) {
          headers.Authorization = `Bearer ${token}`
        }

        const response = await fetch(`/api/resumes/public/${resumeId}`, { headers })
        const data = await response.json()

        if (data.success) {
          setResume(data.resume)
          setSessionId(data.sessionId)
          setIsOwner(data.isOwner || false) // Set owner status
        } else {
          setError(data.message)
        }
      } catch (error) {
        setError("Failed to load resume")
      }
      setLoading(false)
    }

    fetchResume()
  }, [resumeId]) // Only re-run if resumeId changes

  // Handle tracking logic
  useEffect(() => {
    if (!sessionId || isOwner) return

    const sessionKey = `session_${sessionId}`
    const sessionData = JSON.parse(localStorage.getItem(sessionKey) || "{}")

    // Track 'view' event on component mount only if not already tracked for this session
    if (!sessionData.viewTracked) {
      trackEvent("view")
      sessionData.viewTracked = true
      localStorage.setItem(sessionKey, JSON.stringify(sessionData))
    }

    // Set up interval to track 'time' event every 15 seconds
    const intervalId = setInterval(() => {
      trackEvent("time")
    }, 15000)

    // Track 'exit' event on tab/browser close
    const handleBeforeUnload = () => {
      const data = JSON.stringify({
        sessionId,
        event: "exit",
      })
      navigator.sendBeacon(`/api/resumes/track/${resumeId}`, data)
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    // Cleanup on unmount
    return () => {
      clearInterval(intervalId)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      trackEvent("exit")
    }
  }, [sessionId, resumeId, isOwner]) // Added isOwner dependency

  const trackEvent = async (eventType) => {
    try {
      if (isDemo=='demo' || isOwner || !sessionId) return

      const res = await fetch(`/api/resumes/track/${resumeId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          event: eventType,
        }),
      })

      if (res.ok && eventType === "download") {
        const sessionKey = `session_${sessionId}`
        const sessionData = JSON.parse(localStorage.getItem(sessionKey) || "{}")
        sessionData.downloadTracked = true
        localStorage.setItem(sessionKey, JSON.stringify(sessionData))
      }
    } catch (error) {
      console.error("Failed to track event:", error)
    }
  }

  const handleDownload = () => {
    if (!isOwner && sessionId) {
      const sessionKey = `session_${sessionId}`
      const sessionData = JSON.parse(localStorage.getItem(sessionKey) || "{}")

      if (!sessionData.downloadTracked) {
        trackEvent("download")
      }
    }

    window.open(`/api/resumes/public/${resumeId}/download`, "_blank")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading resume...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Resume Not Found</h2>
          <p className="text-gray-600 mb-6">
            The resume you're looking for might have been removed or is no longer available.
          </p>
          <a href="/" className="btn-primary">
            Go to Homepage
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex justify-center bg-gray-50">
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="pdf-viewer">
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
              <Viewer fileUrl={`/api/resumes/public/${resumeId}/file`} />
            </Worker>
          </div>
        </div>
      </div>
      <div className="bg-white border-b w-[30%] border-gray-200">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 text-wrap">{resume.user.name}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-5">
                  <a className="hover:underline" href={`mailto:${resume.user.email}`}>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      {resume.user.email}
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col mt-10 gap-3">
            <button onClick={handleDownload} className="btn-primary flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download Resume
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResumeView
