import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, CheckCircle, RefreshCw, Mail } from 'lucide-react';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import Logo from '../../components/common/Logo';
import Button from '../../components/common/Button';
import ErrorMessage from '../../components/common/ErrorMessage';
import InputField from '../../components/common/InputField';
import authService from '../../services/authService';
import { setTokens } from '../../services/tokenStorage';
import { setUser } from '../../store/slices/authSlice';

const otpSchema = z.object({
  otp: z.string().length(6, 'Verification code must be 6 digits').regex(/^\d{6}$/, 'Verification code must be 6 digits'),
});

const emailFormSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address.'),
});

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const urlEmail = decodeURIComponent(searchParams.get('email') || '').trim();
  const isUrlEmailValid = urlEmail && urlEmail.includes('@') && urlEmail !== 'undefined';
  const initialDevOtp = searchParams.get('dev_otp') || '';

  const [email, setEmail] = useState(isUrlEmailValid ? urlEmail : '');
  const [emailInputRequired, setEmailInputRequired] = useState(!isUrlEmailValid);
  const [devOtp, setDevOtp] = useState(initialDevOtp);
  
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const otpRefs = useRef([]);

  const otpForm = useForm({
    resolver: zodResolver(otpSchema),
    mode: 'onChange',
    defaultValues: { otp: '' },
  });

  const emailForm = useForm({
    resolver: zodResolver(emailFormSchema),
    mode: 'onChange',
    defaultValues: { email: '' },
  });

  // Resend countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const onEmailSubmit = async (data) => {
    try {
      setLoading(true);
      setError(null);
      const res = await authService.resendVerificationOTP({ email: data.email });
      
      setEmail(data.email);
      setEmailInputRequired(false);
      setResendTimer(60);
      toast.success('Verification code sent successfully!');

      if (res.data?.data?.otp) {
        setDevOtp(res.data.data.otp);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to send verification code. Please try again.');
      toast.error('Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const onOTPSubmit = async (data) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await authService.verifyEmail({ email, otp: data.otp });
      const result = res.data.data;

      // Save tokens locally
      setTokens({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });

      // Dispatch user success to Redux state
      dispatch(setUser(result.user));

      setSuccess(true);
      toast.success('Email verified successfully! Logging you in...');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Verification failed. Please try again.');
      toast.error('Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0 || resending) return;
    try {
      setResending(true);
      setError(null);
      const res = await authService.resendVerificationOTP({ email });
      
      toast.success('Verification code resent successfully!');
      setResendTimer(60);
      
      if (res.data?.data?.otp) {
        setDevOtp(res.data.data.otp);
      }
    } catch (err) {
      toast.error('Failed to resend code. Please try again later.');
    } finally {
      setResending(false);
    }
  };

  const handleOtpChange = (e, index) => {
    const val = e.target.value.replace(/\D/g, ''); // only allow digits
    
    // Set current element's value (handling input restrictions)
    e.target.value = val.slice(-1);

    if (val.length > 1) {
      const digits = val.slice(0, 6).split('');
      digits.forEach((d, i) => {
        if (otpRefs.current[index + i]) {
          otpRefs.current[index + i].value = d;
        }
      });
      const nextIndex = Math.min(index + digits.length, 5);
      otpRefs.current[nextIndex]?.focus();
    } else if (val) {
      otpRefs.current[index + 1]?.focus();
    }

    // Sync state
    const full = Array.from({ length: 6 }).map((_, i) => otpRefs.current[i]?.value || '').join('');
    otpForm.setValue('otp', full, { shouldValidate: true });
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!e.target.value) {
        const prevInput = otpRefs.current[index - 1];
        if (prevInput) {
          prevInput.value = '';
          prevInput.focus();
        }
      } else {
        e.target.value = '';
      }
      setTimeout(() => {
        const full = Array.from({ length: 6 }).map((_, i) => otpRefs.current[i]?.value || '').join('');
        otpForm.setValue('otp', full, { shouldValidate: true });
      }, 0);
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      pasted.split('').forEach((d, i) => {
        if (otpRefs.current[i]) {
          otpRefs.current[i].value = d;
        }
      });
      otpForm.setValue('otp', pasted, { shouldValidate: true });
      otpRefs.current[5]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-bg-light-alt flex items-center justify-center px-4 py-8 font-sans">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo size="md" />
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-border-light p-8">
          {success ? (
            <div className="text-center py-4 space-y-4">
              <div className="flex justify-center text-success">
                <CheckCircle size={48} className="animate-bounce" />
              </div>
              <h2 className="text-xl font-bold text-text-light-bg">Email Verified!</h2>
              <p className="text-sm text-text-secondary">
                Your email address has been confirmed. Setting up your session...
              </p>
              <div className="flex justify-center pt-2">
                <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          ) : emailInputRequired ? (
            <>
              <h1 className="text-xl font-heading font-semibold text-text-light-bg text-center mb-1">
                Resend Activation Email
              </h1>
              <p className="text-sm text-text-secondary text-center mb-6">
                Enter your registered email address to receive a 6-digit activation code.
              </p>

              <ErrorMessage message={error} className="mb-4" />

              <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                <InputField
                  label="Email Address*"
                  name="email"
                  type="email"
                  icon={Mail}
                  placeholder="Enter your registered email address"
                  error={emailForm.formState.errors.email?.message}
                  {...emailForm.register('email')}
                />

                <Button type="submit" fullWidth size="lg" loading={loading}>
                  Send Verification Code
                </Button>
              </form>

              <div className="mt-6 text-center border-t border-border-light pt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-hover font-semibold no-underline"
                >
                  <ArrowLeft size={16} /> Back to Login
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-xl font-heading font-semibold text-text-light-bg text-center mb-1">
                Verify Your Email
              </h1>
              <p className="text-sm text-text-secondary text-center mb-6">
                Enter the 6-digit verification code sent to <span className="font-semibold text-text-light-bg">{email}</span>
              </p>

              <ErrorMessage message={error} className="mb-4" />

              <form onSubmit={otpForm.handleSubmit(onOTPSubmit)} className="space-y-6">
                <div className="flex gap-2 justify-center">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      autoFocus={i === 0}
                      className="w-12 h-14 text-center text-xl font-bold rounded-lg border border-outline-variant bg-white text-on-surface focus:border-primary-container focus:ring-2 focus:ring-primary-container/30 outline-none transition-colors"
                      onChange={(e) => handleOtpChange(e, i)}
                      onKeyDown={(e) => handleOtpKeyDown(e, i)}
                      onPaste={i === 0 ? handleOtpPaste : undefined}
                    />
                  ))}
                </div>

                <input type="hidden" {...otpForm.register('otp')} />

                {otpForm.formState.errors.otp && (
                  <p className="text-sm text-error text-center">{otpForm.formState.errors.otp.message}</p>
                )}

                <Button type="submit" fullWidth size="lg" loading={loading}>
                  Verify Code
                </Button>
              </form>

              <div className="mt-6 text-center border-t border-border-light pt-4 flex flex-col gap-3">
                <div className="text-sm text-text-secondary">
                  Didn't receive the code?{' '}
                  {resendTimer > 0 ? (
                    <span className="font-medium text-text-light-bg">Resend in {resendTimer}s</span>
                  ) : (
                    <button
                      type="button"
                      disabled={resending}
                      onClick={handleResendCode}
                      className="text-primary hover:text-primary-hover font-semibold bg-transparent border-none cursor-pointer inline-flex items-center gap-1"
                    >
                      {resending && <RefreshCw size={14} className="animate-spin" />}
                      Resend Code
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-border-light/50">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailInputRequired(true);
                      setEmail('');
                      setDevOtp('');
                      setError(null);
                      otpForm.reset();
                    }}
                    className="text-sm text-primary hover:text-primary-hover font-semibold bg-transparent border-none cursor-pointer inline-flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={16} /> Use a different email
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
