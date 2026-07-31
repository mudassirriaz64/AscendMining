import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { User, Mail, Phone, Lock, Globe, CheckCircle } from 'lucide-react';
import { register as registerUser, clearError } from '../../store/slices/authSlice';
import InputField from '../../components/common/InputField';
import SelectField from '../../components/common/SelectField';
import Button from '../../components/common/Button';
import Logo from '../../components/common/Logo';
import ErrorMessage from '../../components/common/ErrorMessage';
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
  referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [emailCheckError, setEmailCheckError] = useState('');
  const [emailCheckSuccess, setEmailCheckSuccess] = useState(false);

  const [usernameCheckLoading, setUsernameCheckLoading] = useState(false);
  const [usernameCheckError, setUsernameCheckError] = useState('');
  const [usernameCheckSuccess, setUsernameCheckSuccess] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

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

    setEmailCheckLoading(true);
    setEmailCheckError('');
    setEmailCheckSuccess(false);
    try {
      const res = await authService.checkAvailability({ email: val });
      if (!res.data.data.emailAvailable) {
        setEmailCheckError('This email is already registered.');
      } else {
        setEmailCheckSuccess(true);
      }
    } catch (err) {
      // ignore
    } finally {
      setEmailCheckLoading(false);
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

    setUsernameCheckLoading(true);
    setUsernameCheckError('');
    setUsernameCheckSuccess(false);
    try {
      const res = await authService.checkAvailability({ username: val });
      if (!res.data.data.usernameAvailable) {
        setUsernameCheckError('This username is already taken.');
      } else {
        setUsernameCheckSuccess(true);
      }
    } catch (err) {
      // ignore
    } finally {
      setUsernameCheckLoading(false);
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
      const payload = result.payload;
      const params = new URLSearchParams({ email: payload.email });
      if (payload.otp) {
        params.append('dev_otp', payload.otp);
      }
      navigate(`/verify-email?${params.toString()}`);
    }
  };

  return (
    <div className="min-h-screen bg-bg-light-alt flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo size="md" />
        </div>
        {registrationSuccess ? (
          <div className="bg-white rounded-2xl shadow-lg border border-border-light p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-success/15 text-success rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-text-light-bg">Welcome to AscendHash!</h2>
              <p className="text-sm text-text-secondary font-medium animate-pulse">Registration successful! Signing you up...</p>
            </div>
            <div className="flex justify-center pt-2">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-border-light p-8">
            <h1 className="text-xl font-heading font-semibold text-text-light-bg text-center mb-1">
              Create An Account
            </h1>
            <p className="text-sm text-text-secondary text-center mb-6">
              You can create account using email or username and the registration is fully free
            </p>

            <ErrorMessage message={error} className="mb-4" />

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <InputField
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

              <InputField
                label="Full Name"
                name="fullName"
                placeholder="Enter your full name"
                error={errors.fullName?.message}
                {...register('fullName')}
              />

              <InputField
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

              <SelectField
                label="Country"
                name="country"
                icon={Globe}
                placeholder="Select your country"
                options={COUNTRIES}
                error={errors.country?.message}
                {...register('country')}
              />

              <div>
                <label className="block text-[13px] text-text-secondary mb-1.5 font-medium">
                  Mobile
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-2.5 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary font-medium min-w-[80px] justify-center">
                    <Phone size={14} />
                    <span>{phoneCode}</span>
                  </div>
                  <InputField
                    name="phone"
                    placeholder="Phone number"
                    className="flex-1"
                    error={errors.phone?.message}
                    {...register('phone')}
                  />
                </div>
              </div>

              <InputField
                label="Password"
                name="password"
                type="password"
                icon={Lock}
                placeholder="Create a password"
                error={errors.password?.message}
                {...register('password')}
              />

              <InputField
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                icon={Lock}
                placeholder="Confirm your password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />

              <InputField
                label="Referral Code (Optional)"
                name="referralCode"
                placeholder="Enter referral code"
                error={errors.referralCode?.message}
                {...register('referralCode')}
              />

              <Button type="submit" fullWidth size="lg" loading={loading}>
                Register
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-text-secondary">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:text-primary-hover font-medium no-underline">
                  Login now
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
