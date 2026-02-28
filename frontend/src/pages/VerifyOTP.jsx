import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOTP, resendOTP, isLoading } = useAuthStore();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(300);
  const [canResend, setCanResend] = useState(false);

  const userId = location.state?.userId;
  const email = location.state?.email;

  useEffect(() => {
    if (!userId) {
      navigate('/register');
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [userId, navigate]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      toast.error('Please enter complete OTP');
      return;
    }

    try {
      await verifyOTP(userId, otpString);
      toast.success('Email verified successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'OTP verification failed');
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0').focus();
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    try {
      await resendOTP(userId);
      toast.success('OTP has been resent to your email');
      setTimer(300);
      setCanResend(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <button
          onClick={() => navigate('/register')}
          className="btn-ghost inline-flex mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Register
        </button>

        <div className="card p-8 animate-fadeIn">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-neutral-100 rounded-sm flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7 text-neutral-600" />
            </div>
            <h2 className="text-2xl font-semibold text-neutral-900">Verify Your Email</h2>
            <p className="text-sm text-neutral-500 mt-2">
              We've sent a 6-digit code to
              <br />
              <span className="font-medium text-neutral-900">{email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Input */}
            <div className="flex justify-center gap-2 sm:gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-semibold border border-neutral-300 bg-white text-neutral-900 rounded-sm focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-none transition"
                />
              ))}
            </div>

            {/* Timer */}
            <div className="text-center">
              {timer > 0 ? (
                <p className="text-sm text-neutral-500">
                  OTP expires in{' '}
                  <span className="font-medium text-neutral-900">{formatTime(timer)}</span>
                </p>
              ) : (
                <p className="text-sm text-red-600 font-medium">OTP has expired</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || otp.join('').length !== 6}
              className="btn-primary w-full justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </button>
          </form>

          {/* Resend */}
          <div className="text-center mt-6">
            <p className="text-sm text-neutral-500">
              Didn't receive the code?{' '}
              <button
                onClick={handleResend}
                disabled={!canResend || isLoading}
                className="text-neutral-900 font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
              >
                Resend OTP
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
