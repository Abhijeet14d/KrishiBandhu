import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../services/auth.service';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    try {
      setIsLoading(true);
      await authService.forgotPassword(email);
      setIsSubmitted(true);
      toast.success('Password reset link sent to your email');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full card p-8 text-center animate-fadeIn">
          <div className="w-14 h-14 bg-primary-500/10 rounded-sm flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-primary-500" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Check Your Email</h2>
          <p className="text-sm text-neutral-600 mb-6">
            We've sent a password reset link to <span className="font-medium text-neutral-900">{email}</span>. 
            Please check your inbox and follow the instructions.
          </p>
          <p className="text-sm text-neutral-500 mb-6">
            Didn't receive the email? Check your spam folder or{' '}
            <button
              onClick={() => setIsSubmitted(false)}
              className="text-neutral-900 font-medium hover:underline"
            >
              try again
            </button>
          </p>
          <Link to="/login" className="btn-ghost inline-flex">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
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
            <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Forgot Password?</h1>
            <p className="text-sm text-neutral-500">
              No worries! Enter your email and we'll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="input pl-10"
                />
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
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
