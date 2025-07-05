"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"

function Dashboard() {
  const [resumes, setResumes] = useState([])
  const [filteredResumes, setFilteredResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("date")

  useEffect(() => {
    fetchResumes()
  }, [])

  useEffect(() => {
    filterAndSortResumes()
  }, [resumes, searchTerm, sortBy])

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

  const filterAndSortResumes = () => {
    const filtered = resumes.filter((resume) => resume.name.toLowerCase().includes(searchTerm.toLowerCase()))

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.createdAt) - new Date(a.createdAt)
        case "name":
          return a.name.localeCompare(b.name)
        case "views":
          return b.analytics.views - a.analytics.views
        default:
          return 0
      }
    })

    setFilteredResumes(filtered)
  }

  const deleteResume = async (resumeId) => {
    if (window.confirm("Are you sure you want to delete this resume?")) {
      try {
        const response = await fetch(`/api/resumes/${resumeId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        const data = await response.json()
        if (data.success) {
          setResumes(resumes.filter((resume) => resume._id !== resumeId))
        }
      } catch (error) {
        console.error("Error deleting resume:", error)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Resumes</h1>
        <Link
          to="/upload"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
        >
          Add New Resume
        </Link>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search resumes..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="views">Sort by Views</option>
          </select>
        </div>
      </div>

      {filteredResumes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            {resumes.length === 0 ? "No resumes uploaded yet" : "No resumes match your search"}
          </div>
          {resumes.length === 0 && (
            <Link
              to="/upload"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
            >
              Upload Your First Resume
            </Link>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResumes.map((resume) => (
            <div key={resume._id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2 truncate">{resume.name}</h3>
              <div className="text-sm text-gray-600 mb-4">
                <p>Uploaded: {new Date(resume.createdAt).toLocaleDateString()}</p>
                <p>Views: {resume.analytics.views}</p>
                <p>Downloads: {resume.analytics.downloads}</p>
                <p>Contacted: {resume.analytics.contacts}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <a
                  href={`/r/${resume.shortId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                >
                  View
                </a>
                <a
                  href={`/api/resumes/${resume._id}/download`}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                >
                  Download
                </a>
                <button
                  onClick={() => deleteResume(resume._id)}
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dashboard
