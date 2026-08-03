import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { User, Mail, Phone, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { register as registerUser, clearError } from '../../store/slices/authSlice';
import AuthShell from '../../components/auth/AuthShell';
import AuthField from '../../components/auth/AuthField';
import AuthSelect from '../../components/auth/AuthSelect';
import AuthButton from '../../components/auth/AuthButton';
import AuthMessage from '../../components/auth/AuthMessage';
import authService from '../../services/authService';

const COUNTRIES = [
  { value: 'US', label: 'United States', code: '+1' },
  { value: 'GB', label: 'United Kingdom', code: '+44' },
  { value: 'CA', label: 'Canada', code: '+1' },
  { value: 'AU', label: 'Australia', code: '+61' },
  { value: 'AF', label: 'Afghanistan', code: '+93' },
  { value: 'DZ', label: 'Algeria', code: '+213' },
  { value: 'AR', label: 'Argentina', code: '+54' },
  { value: 'AT', label: 'Austria', code: '+43' },
  { value: 'BH', label: 'Bahrain', code: '+973' },
  { value: 'BD', label: 'Bangladesh', code: '+880' },
  { value: 'BE', label: 'Belgium', code: '+32' },
  { value: 'BR', label: 'Brazil', code: '+55' },
  { value: 'CL', label: 'Chile', code: '+56' },
  { value: 'CN', label: 'China', code: '+86' },
  { value: 'CO', label: 'Colombia', code: '+57' },
  { value: 'CZ', label: 'Czech Republic', code: '+420' },
  { value: 'DK', label: 'Denmark', code: '+45' },
  { value: 'EG', label: 'Egypt', code: '+20' },
  { value: 'FI', label: 'Finland', code: '+358' },
  { value: 'FR', label: 'France', code: '+33' },
  { value: 'DE', label: 'Germany', code: '+49' },
  { value: 'GH', label: 'Ghana', code: '+233' },
  { value: 'GR', label: 'Greece', code: '+30' },
  { value: 'HU', label: 'Hungary', code: '+36' },
  { value: 'IN', label: 'India', code: '+91' },
  { value: 'ID', label: 'Indonesia', code: '+62' },
  { value: 'IR', label: 'Iran', code: '+98' },
  { value: 'IQ', label: 'Iraq', code: '+964' },
  { value: 'IE', label: 'Ireland', code: '+353' },
  { value: 'IL', label: 'Israel', code: '+972' },
  { value: 'IT', label: 'Italy', code: '+39' },
  { value: 'JP', label: 'Japan', code: '+81' },
  { value: 'JO', label: 'Jordan', code: '+962' },
  { value: 'KE', label: 'Kenya', code: '+254' },
  { value: 'KW', label: 'Kuwait', code: '+965' },
  { value: 'LB', label: 'Lebanon', code: '+961' },
  { value: 'MY', label: 'Malaysia', code: '+60' },
  { value: 'MX', label: 'Mexico', code: '+52' },
  { value: 'MA', label: 'Morocco', code: '+212' },
  { value: 'NP', label: 'Nepal', code: '+977' },
  { value: 'NL', label: 'Netherlands', code: '+31' },
  { value: 'NZ', label: 'New Zealand', code: '+64' },
  { value: 'NG', label: 'Nigeria', code: '+234' },
  { value: 'NO', label: 'Norway', code: '+47' },
  { value: 'OM', label: 'Oman', code: '+968' },
  { value: 'PK', label: 'Pakistan', code: '+92' },
  { value: 'PE', label: 'Peru', code: '+51' },
  { value: 'PH', label: 'Philippines', code: '+63' },
  { value: 'PL', label: 'Poland', code: '+48' },
  { value: 'PT', label: 'Portugal', code: '+351' },
  { value: 'QA', label: 'Qatar', code: '+974' },
  { value: 'RO', label: 'Romania', code: '+40' },
  { value: 'RU', label: 'Russia', code: '+7' },
  { value: 'SA', label: 'Saudi Arabia', code: '+966' },
  { value: 'SG', label: 'Singapore', code: '+65' },
  { value: 'ZA', label: 'South Africa', code: '+27' },
  { value: 'KR', label: 'South Korea', code: '+82' },
  { value: 'ES', label: 'Spain', code: '+34' },
  { value: 'LK', label: 'Sri Lanka', code: '+94' },
  { value: 'SE', label: 'Sweden', code: '+46' },
  { value: 'CH', label: 'Switzerland', code: '+41' },
  { value: 'SY', label: 'Syria', code: '+963' },
  { value: 'TZ', label: 'Tanzania', code: '+255' },
  { value: 'TH', label: 'Thailand', code: '+66' },
  { value: 'TN', label: 'Tunisia', code: '+216' },
  { value: 'TR', label: 'Turkey', code: '+90' },
  { value: 'UG', label: 'Uganda', code: '+256' },
  { value: 'UA', label: 'Ukraine', code: '+380' },
  { value: 'AE', label: 'United Arab Emirates', code: '+971' },
  { value: 'VE', label: 'Venezuela', code: '+58' },
  { value: 'VN', label: 'Vietnam', code: '+84' },
  { value: 'YE', label: 'Yemen', code: '+967' },
];

const registerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required.'),
  username: z
    .string()
    .min(3, 'Username must be 3–20 characters, letters/numbers/underscore only.')
    .max(20, 'Username must be 3–20 characters, letters/numbers/underscore only.')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username must be 3–20 characters, letters/numbers/underscore only.'),
  email: z.string().min(1, 'Email is required.').email('Enter a valid email address.'),
  country: z.string().min(1, 'Country is required.'),
  phone: z.string().optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters with a letter and a number.')
    .regex(/[a-zA-Z]/, 'Password must be at least 8 characters with a letter and a number.')
    .regex(/[0-9]/, 'Password must be at least 8 characters with a letter and a number.'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [emailCheckError, setEmailCheckError] = useState('');
  const [emailCheckSuccess, setEmailCheckSuccess] = useState(false);

  const [usernameCheckError, setUsernameCheckError] = useState('');
  const [usernameCheckSuccess, setUsernameCheckSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  const selectedCountryVal = watch('country');
  const selectedCountryObj =
    COUNTRIES.find((c) => c.value === selectedCountryVal || c.label === selectedCountryVal) ||
    COUNTRIES[0];
  const phoneCode = selectedCountryObj?.code || '+1';

  const handleEmailBlur = async (e) => {
    const val = e.target.value;
    register('email').onBlur(e);

    if (!val || !/^\S+@\S+\.\S+$/.test(val)) {
      setEmailCheckError('');
      setEmailCheckSuccess(false);
      return;
    }

    setEmailCheckError('');
    setEmailCheckSuccess(false);
    try {
      const res = await authService.checkAvailability({ email: val });
      if (!res.data.data.emailAvailable) {
        setEmailCheckError('This email is already registered.');
      } else {
        setEmailCheckSuccess(true);
      }
    } catch {
      // ignore
    }
  };

  const handleEmailChange = (e) => {
    register('email').onChange(e);
    setEmailCheckError('');
    setEmailCheckSuccess(false);
  };

  const handleUsernameBlur = async (e) => {
    const val = e.target.value;
    register('username').onBlur(e);

    if (!val || val.length < 3 || !/^[a-zA-Z0-9_]+$/.test(val)) {
      setUsernameCheckError('');
      setUsernameCheckSuccess(false);
      return;
    }

    setUsernameCheckError('');
    setUsernameCheckSuccess(false);
    try {
      const res = await authService.checkAvailability({ username: val });
      if (!res.data.data.usernameAvailable) {
        setUsernameCheckError('This username is already taken.');
      } else {
        setUsernameCheckSuccess(true);
      }
    } catch {
      // ignore
    }
  };

  const handleUsernameChange = (e) => {
    register('username').onChange(e);
    setUsernameCheckError('');
    setUsernameCheckSuccess(false);
  };

  const onSubmit = async (data) => {
    dispatch(clearError());
    const userData = {
      ...data,
      phone: data.phone ? `${phoneCode} ${data.phone}`.trim() : undefined,
    };
    const result = await dispatch(registerUser(userData));
    if (!result.error) {
      toast.success('Account created successfully! Welcome to AscendHash.');
      navigate('/dashboard');
    }
  };

  return (
    <AuthShell
      title="Join AscendHash & Start Mining"
      subtitle="Create your free account in minutes and deploy high-hash mining power instantly from your wallet balance."
    >
      <h1 className="text-2xl font-heading font-semibold text-page-text mb-1">
        Create An Account
      </h1>
      <p className="text-sm text-page-text-muted mb-6">
        Registration is fully free using email or username
      </p>

      <AuthMessage message={error} className="mb-4" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <AuthField
          label="Username"
          name="username"
          icon={User}
          placeholder="Choose a username"
          error={usernameCheckError || errors.username?.message}
          success={usernameCheckSuccess}
          {...register('username')}
          onBlur={handleUsernameBlur}
          onChange={handleUsernameChange}
        />

        <AuthField
          label="Full Name"
          name="fullName"
          placeholder="Enter your full name"
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        <AuthField
          label="E-Mail Address"
          name="email"
          icon={Mail}
          type="email"
          placeholder="Enter your email"
          error={emailCheckError || errors.email?.message}
          success={emailCheckSuccess}
          {...register('email')}
          onBlur={handleEmailBlur}
          onChange={handleEmailChange}
        />

        <AuthSelect
          label="Country"
          name="country"
          placeholder="Select your country"
          options={COUNTRIES}
          error={errors.country?.message}
          {...register('country')}
        />

        <div>
          <label className="block text-[13px] text-slate-400 mb-1.5 font-medium">
            Mobile
          </label>
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 px-3 py-3 bg-amber-400/10 border border-amber-400/20 rounded-xl text-sm text-amber-300 font-medium min-w-[80px] justify-center">
              <Phone size={14} />
              <span>{phoneCode}</span>
            </div>
            <AuthField
              name="phone"
              placeholder="Phone number"
              className="flex-1"
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>
        </div>

        <AuthField
          label="Password"
          name="password"
          type="password"
          icon={Lock}
          placeholder="Create a password"
          error={errors.password?.message}
          {...register('password')}
        />

        <AuthField
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          icon={Lock}
          placeholder="Confirm your password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <AuthButton type="submit" fullWidth size="lg" loading={loading}>
          Register
        </AuthButton>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-slate-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-amber-400 hover:text-amber-300 hover:underline font-medium no-underline"
          >
            Login now
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};

export default RegisterPage;
