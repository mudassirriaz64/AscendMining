import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import Logo from '../../components/common/Logo';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';
import ErrorMessage from '../../components/common/ErrorMessage';
import authService from '../../services/authService';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const otpRefs = useRef([]);

  const emailForm = useForm({
    resolver: zodResolver(emailSchema),
    mode: 'onChange',
  });

  const otpForm = useForm({
    resolver: zodResolver(otpSchema),
    mode: 'onChange',
  });

  const onEmailSubmit = async (data) => {
    try {
      setLoading(true);
      setError(null);
      setEmail(data.email);
      const res = await authService.forgotPassword(data.email);
      if (res.data?.data?.otp) setOtp(res.data.data.otp);
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to request reset.');
    } finally {
      setLoading(false);
    }
  };

  const onOTPSubmit = async (data) => {
    try {
      setLoading(true);
      setError(null);
      const res = await authService.verifyOTP({ email, otp: data.otp });
      const resetToken = res.data?.data?.resetToken;
      if (resetToken) {
        navigate(`/reset-password?token=${resetToken}`);
      } else {
        setError('Failed to verify OTP. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e, index) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length > 1) {
      const digits = val.split('');
      digits.forEach((d, i) => {
        if (index + i < 6) {
          if (otpRefs.current[index + i]) {
            otpRefs.current[index + i].value = d;
          }
        }
      });
      const nextIndex = Math.min(index + digits.length, 5);
      otpRefs.current[nextIndex]?.focus();
      const full = (otpForm.getValues('otp') || '').split('');
      digits.forEach((d, i) => {
        if (index + i < 6) full[index + i] = d;
      });
      otpForm.setValue('otp', full.join(''), { shouldValidate: true });
      return;
    }
    otpForm.setValue('otp', otpForm.getValues('otp')?.slice(0, index) + val + otpForm.getValues('otp')?.slice(index + 1), { shouldValidate: true });
    if (val && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      e.preventDefault();
      pasted.split('').forEach((d, i) => {
        if (otpRefs.current[i]) otpRefs.current[i].value = d;
      });
      otpForm.setValue('otp', pasted, { shouldValidate: true });
      otpRefs.current[5]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-bg-light-alt flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo size="md" />
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-border-light p-8">
          {step === 'email' ? (
            <>
              <h1 className="text-xl font-heading font-semibold text-text-light-bg text-center mb-1">
                Forgot Your Password?
              </h1>
              <p className="text-sm text-text-secondary text-center mb-6">
                Enter your email below and we'll send a reset code and link.
              </p>

              <ErrorMessage message={error} className="mb-4" />

              <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                <InputField
                  label="Email Address*"
                  name="email"
                  type="email"
                  icon={Mail}
                  placeholder="Enter your email address"
                  error={emailForm.formState.errors.email?.message}
                  {...emailForm.register('email')}
                />

                <Button type="submit" fullWidth size="lg" loading={loading}>
                  Send Reset Code
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-hover font-medium no-underline"
                >
                  <ArrowLeft size={16} /> Back to Login
                </Link>
              </div>
            </>
          ) : step === 'otp' && !success ? (
            <>
              <h1 className="text-xl font-heading font-semibold text-text-light-bg text-center mb-1">
                Enter Reset Code
              </h1>
              <p className="text-sm text-text-secondary text-center mb-6">
                Enter the 6-digit code sent to <span className="font-medium text-text-light-bg">{email}</span>
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

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => { setStep('email'); setError(null); }}
                  className="text-sm text-primary hover:text-primary-hover font-medium bg-transparent border-none cursor-pointer"
                >
                  <ArrowLeft size={16} className="inline mr-1" /> Use a different email
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4 space-y-4">
              <div className="flex justify-center text-success">
                <CheckCircle size={48} className="animate-bounce" />
              </div>
              <h2 className="text-xl font-heading font-semibold text-text-light-bg">
                Reset Link Sent
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed">
                If an account exists for that email, we have sent a secure link and reset code. Please check your inbox and spam folders.
              </p>
              <div className="pt-2">
                <Link to="/login" className="no-underline">
                  <Button fullWidth size="lg">
                    Back to Login
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
