import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const Register = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (!/^[0-9]{10}$/.test(formData.phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
      const response = await register(registerData);
      
      toast.success(response.message);
      navigate('/verify-otp', { state: { userId: response.userId, email: formData.email } });
    } catch (error) {
      const errData = error.response?.data;
      const msg = errData?.errors?.length ? errData.errors.join(', ') : errData?.message || 'Registration failed';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex transition-colors">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-600 to-primary-700 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-white rounded-sm flex items-center justify-center mx-auto mb-8">
            <Phone className="w-10 h-10 text-primary-600" />
          </div>
          <h2 className="text-3xl font-semibold text-white mb-4">
            Join Farmer Assistant
          </h2>
          <p className="text-primary-100 leading-relaxed">
            Create your account and start getting AI-powered agricultural assistance for all your farming needs.
          </p>
          
          {/* Feature list */}
          <div className="mt-10 space-y-4 text-left">
            {[
              'Voice & text-based queries',
              'Instant AI-powered responses',
              'Personalized recommendations',
              'Access to scheme information'
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3 text-white">
                <div className="w-5 h-5 bg-white/20 rounded-xs flex items-center justify-center">
                  <span className="text-xs">✓</span>
                </div>
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Form */}
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

          {/* Register Card */}
          <div className="card p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-2">
                Create account
              </h1>
              <p className="text-sm text-neutral-500">
                Fill in your details to get started
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="label">Full Name</label>
                <div className="relative">
                  <User className="input-icon" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input input-with-icon"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="label">Email Address</label>
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

              {/* Phone */}
              <div>
                <label className="label">Phone Number</label>
                <div className="relative">
                  <Phone className="input-icon" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input input-with-icon"
                    placeholder="9876543210"
                    maxLength="10"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="label">Password</label>
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
              </div>

              {/* Confirm Password */}
              <div>
                <label className="label">Confirm Password</label>
                <div className="relative">
                  <Lock className="input-icon" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input input-with-icon"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3 mt-2 press-effect"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
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

            {/* Login Link */}
            <p className="text-center text-sm text-neutral-500">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
