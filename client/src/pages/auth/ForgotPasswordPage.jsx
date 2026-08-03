import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import AuthShell from '../../components/auth/AuthShell';
import AuthField from '../../components/auth/AuthField';
import AuthButton from '../../components/auth/AuthButton';
import AuthMessage from '../../components/auth/AuthMessage';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
      await authService.forgotPassword(data.email);
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
    <AuthShell
      title="Recover Your AscendHash Account"
      subtitle="Enter your registered email and we'll send a secure reset code to get you back into your mining dashboard."
    >
      {step === 'email' ? (
        <>
          <h1 className="text-2xl font-heading font-semibold text-white mb-1">
            Forgot Your Password?
          </h1>
          <p className="text-sm text-slate-400 mb-6">
            Enter your email below and we'll send a reset code and link.
          </p>

          <AuthMessage message={error} className="mb-4" />

          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
            <AuthField
              label="Email Address*"
              name="email"
              type="email"
              icon={Mail}
              placeholder="Enter your email address"
              error={emailForm.formState.errors.email?.message}
              {...emailForm.register('email')}
            />

            <AuthButton type="submit" fullWidth size="lg" loading={loading}>
              Send Reset Code
            </AuthButton>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 hover:underline font-medium no-underline"
            >
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        </>
      ) : step === 'otp' ? (
        <>
          <h1 className="text-2xl font-heading font-semibold text-white mb-1">
            Enter Reset Code
          </h1>
          <p className="text-sm text-slate-400 mb-6">
            Enter the 6-digit code sent to{' '}
            <span className="font-medium text-amber-300">{email}</span>
          </p>
          <AuthMessage message={error} className="mb-4" />

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
                  className="w-12 h-14 text-center text-xl font-bold rounded-xl border border-slate-700/60 bg-slate-900/60 text-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all"
                  onChange={(e) => handleOtpChange(e, i)}
                  onKeyDown={(e) => handleOtpKeyDown(e, i)}
                  onPaste={i === 0 ? handleOtpPaste : undefined}
                />
              ))}
            </div>

            <input type="hidden" {...otpForm.register('otp')} />

            {otpForm.formState.errors.otp && (
              <p className="text-sm text-red-400 text-center">{otpForm.formState.errors.otp.message}</p>
            )}

            <AuthButton type="submit" fullWidth size="lg" loading={loading}>
              Verify Code
            </AuthButton>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => { setStep('email'); setError(null); }}
              className="text-sm text-amber-400 hover:text-amber-300 hover:underline font-medium bg-transparent border-none cursor-pointer"
            >
              <ArrowLeft size={16} className="inline mr-1" /> Use a different email
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-4 space-y-4">
          <div className="flex justify-center text-emerald-400">
            <CheckCircle size={48} className="animate-bounce" />
          </div>
          <h2 className="text-2xl font-heading font-semibold text-white">
            Reset Link Sent
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            If an account exists for that email, we have sent a secure link and reset code. Please check your inbox and spam folders.
          </p>
          <div className="pt-2">
            <Link to="/login" className="no-underline block">
              <AuthButton fullWidth size="lg">
                Back to Login
              </AuthButton>
            </Link>
          </div>
        </div>
      )}
    </AuthShell>
  );
};

export default ForgotPasswordPage;
