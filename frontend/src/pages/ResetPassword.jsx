import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../services/auth.service';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      await authService.resetPassword(token, formData.password);
      setIsSuccess(true);
      toast.success('Password reset successfully!');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to reset password');
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full card p-8 text-center animate-fadeIn">
          <div className="w-14 h-14 bg-red-50 rounded-sm flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-7 h-7 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Invalid Link</h2>
          <p className="text-sm text-neutral-600 mb-6">
            This password reset link is invalid or has expired.
          </p>
          <Link to="/forgot-password" className="btn-primary inline-flex">
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full card p-8 text-center animate-fadeIn">
          <div className="w-14 h-14 bg-primary-500/10 rounded-sm flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-primary-500" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Password Reset!</h2>
          <p className="text-sm text-neutral-600 mb-6">
            Your password has been successfully reset. You can now log in with your new password.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary w-full justify-center"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Link to="/login" className="btn-ghost inline-flex mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Link>

        <div className="card p-8 animate-fadeIn">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Reset Password</h1>
            <p className="text-sm text-neutral-500">
              Enter your new password below.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  className="input pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                  className="input pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
