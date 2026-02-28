import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, Loader2, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const response = await login(formData);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      // Handle unverified user - 403 goes to catch block
      const responseData = error.response?.data;
      if (responseData?.needsVerification) {
        toast.error('Please verify your email first');
        navigate('/verify-otp', { state: { userId: responseData.userId } });
        return;
      }
      toast.error(responseData?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex transition-colors">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Back Button */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {/* Login Card */}
          <div className="card p-8">
            <div className="mb-8">
              <div className="w-12 h-12 bg-primary-600 rounded-sm flex items-center justify-center mb-6">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-2">
                Welcome back
              </h1>
              <p className="text-sm text-neutral-500">
                Enter your credentials to access your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="label">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input input-with-icon"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="label">
                  Password
                </label>
                <div className="relative">
                  <Lock className="input-icon" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="input input-with-icon"
                    placeholder="••••••••"
                  />
                </div>
                <div className="text-right mt-2">
                  <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors">
                    Forgot password?
                  </Link>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3 press-effect"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="divider" />
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 bg-white dark:bg-neutral-900 text-xs text-neutral-400">
                or
              </span>
            </div>

            {/* Register Link */}
            <p className="text-center text-sm text-neutral-500">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-600 to-primary-700 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-white rounded-sm flex items-center justify-center mx-auto mb-8">
            <Phone className="w-10 h-10 text-primary-600" />
          </div>
          <h2 className="text-3xl font-semibold text-white mb-4">
            Farmer Assistant
          </h2>
          <p className="text-primary-100 leading-relaxed">
            Your AI-powered agricultural companion. Get instant answers to farming queries through voice or text.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
