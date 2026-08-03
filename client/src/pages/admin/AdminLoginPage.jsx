import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, ShieldCheck } from 'lucide-react';
import { adminLogin, clearError } from '../../store/slices/authSlice';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';
import Logo from '../../components/common/Logo';
import ErrorMessage from '../../components/common/ErrorMessage';
import Web3BackgroundCanvas from '../../components/common/Web3BackgroundCanvas';

const adminLoginSchema = z.object({
  email: z.string().min(1, 'Email is required.').email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

const AdminLoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(adminLoginSchema),
  });

  const onSubmit = async (data) => {
    dispatch(clearError());
    const result = await dispatch(adminLogin({ email: data.email, password: data.password }));
    if (!result.error) {
      const role = result.payload?.admin?.role;
      if (role === 'admin' || role === 'support_agent') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen bg-page-bg flex items-center justify-center px-4 py-8 text-page-text relative z-10 overflow-hidden">
      <Web3BackgroundCanvas variant="auto" />
      
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse duration-[6000ms]" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none z-0 animate-pulse duration-[8000ms]" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <Logo size="md" />
        </div>
        <div className="bg-page-card backdrop-blur-2xl border border-page-border p-8 shadow-2xl rounded-3xl">
          <div className="flex items-center justify-center gap-2 mb-1">
            <ShieldCheck size={22} className="text-amber-550 drop-shadow-[0_0_8px_rgba(245,197,24,0.3)]" />
            <h1 className="text-xl font-heading font-semibold text-page-text">
              Admin Portal
            </h1>
          </div>
          <p className="text-sm text-page-text-muted text-center mb-6">
            Sign in with your admin credentials
          </p>

          <ErrorMessage message={error} className="mb-4" />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <InputField
              label="Email*"
              name="email"
              type="email"
              icon={Mail}
              placeholder="admin@ascendmining.com"
              error={errors.email?.message}
              {...register('email')}
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

            <Button type="submit" fullWidth size="lg" loading={loading}>
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
