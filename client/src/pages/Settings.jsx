"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"

function Settings({ user, setUser }) {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/auth/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setUser(data.user)
        setMessage("Profile updated successfully!")
      } else {
        setMessage(data.message)
      }
    } catch (error) {
      setMessage("Failed to update profile")
    }

    setLoading(false)
  }

  const handleDisableAccount = async () => {
    if (
      window.confirm(
        "Are you sure you want to disable your account? Your resumes will be private and cannot be accessed.",
      )
    ) {
      try {
        const response = await fetch("/api/auth/disable-account", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        const data = await response.json()

        if (data.success) {
          alert("Account disabled successfully")
          localStorage.removeItem("token")
          setUser(null)
          navigate("/")
        } else {
          alert(data.message)
        }
      } catch (error) {
        alert("Failed to disable account")
      }
    }
  }

  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.",
      )
    ) {
      if (window.confirm("This will permanently delete all your resumes and data. Are you absolutely sure?")) {
        try {
          const response = await fetch("/api/auth/delete-account", {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          })

          const data = await response.json()

          if (data.success) {
            alert("Account deleted successfully")
            localStorage.removeItem("token")
            setUser(null)
            navigate("/")
          } else {
            alert(data.message)
          }
        } catch (error) {
          alert("Failed to delete account")
        }
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      <div className="space-y-6">
        {/* Profile Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>

          {message && (
            <div
              className={`mb-4 p-3 rounded ${message.includes("success") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Profile"}
            </button>
          </form>
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Account Actions</h2>

          <div className="space-y-4">
            <div className="border border-yellow-200 rounded-md p-4 bg-yellow-50">
              <h3 className="font-medium text-yellow-800 mb-2">Disable Account</h3>
              <p className="text-sm text-yellow-700 mb-3">
                Temporarily disable your account. Your resumes will be private and cannot be accessed by others.
              </p>
              <button
                onClick={handleDisableAccount}
                className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700"
              >
                Disable Account
              </button>
            </div>

            <div className="border border-red-200 rounded-md p-4 bg-red-50">
              <h3 className="font-medium text-red-800 mb-2">Delete Account</h3>
              <p className="text-sm text-red-700 mb-3">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                onClick={handleDeleteAccount}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
