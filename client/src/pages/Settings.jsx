"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Settings({ user, setUser }) {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        setMessage("Profile updated successfully!");
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage("Failed to update profile");
    }

    setLoading(false);
  };

  const handleDisableAccount = async (text) => {
    if (
      window.confirm(
        text === "Enable"
          ? "Are you sure you want to enable your account? Your resumes will become PUBLIC and accessible to anyone with the link."
          : "Are you sure you want to disable your account? Your resumes will be PRIVATE and no longer accessible."
      )
    ) {
      try {
        const response = await fetch(
          `/api/auth/disable-account?operation=${text}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const data = await response.json();
        if (data.success) {
          alert(data.message);
          window.location.href = "/dashboard";
        } else {
          alert(data.message);
        }
      } catch (error) {
        alert("Failed to disable account");
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted."
      )
    ) {
      if (
        window.confirm(
          "This will permanently delete all your resumes and data. Are you absolutely sure?"
        )
      ) {
        try {
          const response = await fetch("/api/auth/delete-account", {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });

          const data = await response.json();

          if (data.success) {
            alert("Account deleted successfully");
            localStorage.removeItem("token");
            setUser(null);
            navigate("/");
          } else {
            alert(data.message);
          }
        } catch (error) {
          alert("Failed to delete account");
        }
      }
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        </div>

        <div className="space-y-6">
          <div className="card">
            {message && (
              <div
                className={`mb-6 p-4 rounded-lg ${
                  message.includes("success")
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}
              >
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
              {(user.email !== formData.email ||
                user.name !== formData.name) && (
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Update Profile"}
                </button>
              )}
            </form>
          </div>

          <div className="card">
            <div className="space-y-4" id="disable">
              <div className="border border-yellow-200 rounded-lg p-6 bg-yellow-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-800 mb-2">
                      Disable Account
                    </h3>
                    <p className="text-sm text-yellow-700 mb-4">
                      Temporarily disable your account. Your resumes will be
                      private and cannot be accessed by others. You can
                      reactivate your account by signing in again.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleDisableAccount(
                        !user?.isActive ? "Enable" : "Disable"
                      )
                    }
                    className={`ml-4  text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors duration-200 whitespace-nowrap
                      ${!user?.isActive ? "bg-gray-600" : "bg-yellow-600"}
                      `}
                  >
                    {user && user?.isActive
                      ? "Disable Account"
                      : "Account Disabled"}
                  </button>
                </div>
              </div>

              <div className="border border-red-200 rounded-lg p-6 bg-red-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-800 mb-2">
                      Delete Account
                    </h3>
                    <p className="text-sm text-red-700 mb-4">
                      Permanently delete your account and all associated data
                      including resumes, analytics, and personal information.
                      This action cannot be undone.
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    className="ml-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 whitespace-nowrap"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
