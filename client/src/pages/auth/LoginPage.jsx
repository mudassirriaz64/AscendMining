import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock } from 'lucide-react';
import { login, clearError } from '../../store/slices/authSlice';
import AuthShell from '../../components/auth/AuthShell';
import AuthField from '../../components/auth/AuthField';
import AuthButton from '../../components/auth/AuthButton';
import AuthMessage from '../../components/auth/AuthMessage';

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required.'),
  password: z.string().min(1, 'Password is required.'),
});

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);

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
    const result = await dispatch(login({ ...data, keepLoggedIn }));
    if (!result.error) {
      navigate('/dashboard');
    }
  };

  return (
    <AuthShell
      title="Welcome Back to AscendHash"
      subtitle="Sign in to manage your mining operations, track payouts, and grow your passive income from anywhere."
    >
      <h1 className="text-2xl font-heading font-semibold text-page-text mb-1">
        Login To Your Account
      </h1>
      <p className="text-sm text-page-text-muted mb-6">
        Sign in using your email or username
      </p>

      <AuthMessage message={error} className="mb-4" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <AuthField
          label="Username or Email*"
          name="emailOrUsername"
          icon={Mail}
          placeholder="Enter your email or username"
          error={errors.emailOrUsername?.message}
          {...register('emailOrUsername')}
        />

        <AuthField
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
              className="w-4 h-4 rounded bg-slate-900/60 border-slate-700 accent-amber-400 cursor-pointer"
            />
            <span className="text-sm text-page-text-muted">Keep me logged in</span>
          </label>
          <Link
            to="/forgot-password"
            className="text-sm text-amber-400 hover:text-amber-300 hover:underline font-medium no-underline"
          >
            Forgot Password?
          </Link>
        </div>

        <AuthButton type="submit" fullWidth size="lg" loading={loading}>
          Login
        </AuthButton>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-page-text-muted">
          Don't have any account?{' '}
          <Link
            to="/register"
            className="text-amber-400 hover:text-amber-300 hover:underline font-medium no-underline"
          >
            Create Account
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};

export default LoginPage;
