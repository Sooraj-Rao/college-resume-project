import { Link } from "react-router-dom"

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Organize Your Resumes</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Upload, manage, share, and get AI feedback on your resumes. Keep all your professional documents organized
            in one place.
          </p>

          <div className="space-x-4">
            <Link
              to="/register"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition duration-200"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition duration-200"
            >
              Login
            </Link>
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Upload & Organize</h3>
            <p className="text-gray-600">
              Upload your PDF resumes and keep them organized with search and filter options.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Share Easily</h3>
            <p className="text-gray-600">Generate short URLs to share your resumes with employers and track views.</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">AI Feedback</h3>
            <p className="text-gray-600">Get personalized feedback on your resumes using AI for specific job roles.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
