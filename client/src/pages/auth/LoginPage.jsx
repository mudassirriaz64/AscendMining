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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    dispatch(clearError());
    const result = await dispatch(login(data));
    if (!result.error) {
      navigate('/dashboard');
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
              <Link to="/resend-verification" className="text-secondary hover:underline no-underline">
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
