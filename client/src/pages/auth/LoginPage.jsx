import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock } from 'lucide-react';
import { login, clearError } from '../../store/slices/authSlice';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';
import Logo from '../../components/common/Logo';
import ErrorMessage from '../../components/common/ErrorMessage';

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required.'),
  password: z.string().min(1, 'Password is required.'),
});

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [unverifiedOtp, setUnverifiedOtp] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data) => {
    dispatch(clearError());
    setUnverifiedEmail('');
    setUnverifiedOtp('');
    const result = await dispatch(login({ ...data, keepLoggedIn }));
    if (!result.error) {
      navigate('/dashboard');
    } else {
      const payload = result.payload;
      if (payload?.error?.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(payload.error.email);
        if (payload.error.otp) {
          setUnverifiedOtp(payload.error.otp);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-bg-light-alt flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo size="md" />
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-border-light p-8">
          <h1 className="text-xl font-heading font-semibold text-text-light-bg text-center mb-1">
            Login To Your Account
          </h1>
          <p className="text-sm text-text-secondary text-center mb-6">
            You can sign in to your account using email or username
          </p>

          <ErrorMessage message={error} className="mb-4" />

          {unverifiedEmail && (
            <div className="mb-4 p-4 bg-primary/10 border border-primary/30 rounded-xl text-center space-y-3">
              <p className="text-sm text-text-light-bg font-medium">
                Your email address is not verified. Verify it now?
              </p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams({ email: unverifiedEmail });
                    if (unverifiedOtp) {
                      params.append('dev_otp', unverifiedOtp);
                    }
                    navigate(`/verify-email?${params.toString()}`);
                  }}
                  className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-on-primary font-bold text-xs rounded-lg transition-colors cursor-pointer border-none"
                >
                  Yes, Verify
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUnverifiedEmail('');
                    setUnverifiedOtp('');
                  }}
                  className="px-4 py-1.5 bg-gray-200 text-gray-700 font-bold text-xs rounded-lg hover:bg-gray-300 transition-colors cursor-pointer border-none"
                >
                  No, Cancel
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <InputField
              label="Username or Email*"
              name="emailOrUsername"
              icon={Mail}
              placeholder="Enter your email or username"
              error={errors.emailOrUsername?.message}
              {...register('emailOrUsername')}
            />

            <InputField
              label="Password*"
              name="password"
              type="password"
              icon={Lock}
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={keepLoggedIn}
                  onChange={(e) => setKeepLoggedIn(e.target.checked)}
                  className="w-4 h-4 rounded border-border-light text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                />
                <span className="text-sm text-text-secondary">Keep me logged in</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:text-primary-hover font-medium no-underline"
              >
                Forgot Password?
              </Link>
            </div>

            <Button type="submit" fullWidth size="lg" loading={loading}>
              Login
            </Button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-text-secondary">
              Don't have any account?{' '}
              <Link to="/register" className="text-primary hover:text-primary-hover font-medium no-underline">
                Create Account
              </Link>
            </p>
            <p className="text-xs text-text-secondary">
              <Link to="/verify-email" className="text-secondary hover:underline no-underline">
                Activation account Resend Email
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
