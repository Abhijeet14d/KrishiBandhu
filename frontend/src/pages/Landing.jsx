import { Link } from 'react-router-dom';
import { Phone, CheckCircle, Shield, Headphones } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                Farmer Assistant
              </span>
            </div>
            <div className="flex space-x-4">
              <Link
                to="/login"
                className="px-4 py-2 text-green-600 hover:text-green-700 font-medium"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Your Agricultural Assistant
            <br />
            <span className="text-green-600">Available 24/7</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Get instant answers to all your farming queries through voice calls powered by AI. 
            No more waiting, no more confusion - just ask and get expert guidance.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg"
          >
            Start Free Trial
            <Phone className="ml-2 w-5 h-5" />
          </Link>
        </div>

        {/* Features */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Headphones className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Voice-Based Queries
            </h3>
            <p className="text-gray-600">
              Simply speak your questions in your preferred language and get instant voice responses.
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              AI-Powered Answers
            </h3>
            <p className="text-gray-600">
              Get accurate agricultural advice powered by advanced AI trained on farming knowledge.
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Secure & Private
            </h3>
            <p className="text-gray-600">
              Your conversations are encrypted and secure. Your privacy is our top priority.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-24 bg-white rounded-2xl p-12 shadow-lg">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">1</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Register</h4>
              <p className="text-gray-600 text-sm">Create your free account in seconds</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Call</h4>
              <p className="text-gray-600 text-sm">Start a voice call from dashboard</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Ask</h4>
              <p className="text-gray-600 text-sm">Speak your farming questions</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">4</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Get Answers</h4>
              <p className="text-gray-600 text-sm">Receive expert guidance instantly</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-24 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2025 Farmer Assistant. Empowering farmers with technology.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
