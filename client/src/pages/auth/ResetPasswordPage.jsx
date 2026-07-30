import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Lock, CheckCircle, AlertTriangle } from 'lucide-react';
import Logo from '../../components/common/Logo';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';
import ErrorMessage from '../../components/common/ErrorMessage';
import authService from '../../services/authService';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data) => {
    if (!token) {
      setError('Invalid reset token. Please request a new password reset link.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await authService.resetPassword({
        token,
        password: data.password,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-light-alt flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo size="md" />
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-border-light p-8">
          {!token ? (
            <div className="text-center py-4 space-y-4">
              <div className="flex justify-center text-error">
                <AlertTriangle size={48} />
              </div>
              <h2 className="text-xl font-heading font-semibold text-text-light-bg">
                Missing Reset Token
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed">
                The password reset token is missing or invalid. Please check the email link or request a new reset request.
              </p>
              <div className="pt-2">
                <Link to="/forgot-password" className="no-underline">
                  <Button fullWidth size="lg">
                    Request New Link
                  </Button>
                </Link>
              </div>
            </div>
          ) : !success ? (
            <>
              <h1 className="text-xl font-heading font-semibold text-text-light-bg text-center mb-1">
                Create New Password
              </h1>
              <p className="text-sm text-text-secondary text-center mb-6">
                Please enter and confirm your new secure account password below.
              </p>

              <ErrorMessage message={error} className="mb-4" />

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <InputField
                  label="New Password*"
                  name="password"
                  type="password"
                  icon={Lock}
                  placeholder="Enter new password"
                  error={errors.password?.message}
                  {...register('password')}
                />

                <InputField
                  label="Confirm New Password*"
                  name="confirmPassword"
                  type="password"
                  icon={Lock}
                  placeholder="Re-enter new password"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />

                <Button type="submit" fullWidth size="lg" loading={loading}>
                  Reset Password
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4 space-y-4">
              <div className="flex justify-center text-success">
                <CheckCircle size={48} className="animate-bounce" />
              </div>
              <h2 className="text-xl font-heading font-semibold text-text-light-bg">
                Password Reset Successful
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed">
                Your account password has been updated. You can now log in securely with your new password.
              </p>
              <div className="pt-2">
                <Link to="/login" className="no-underline">
                  <Button fullWidth size="lg">
                    Login Now
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

export default ResetPasswordPage;
