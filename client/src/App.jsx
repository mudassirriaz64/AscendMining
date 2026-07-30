import { lazy, Suspense, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { checkAuth } from './store/slices/authSlice';
import LoadingSpinner from './components/common/LoadingSpinner';

const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const WithdrawNowPage = lazy(() => import('./pages/withdrawal/WithdrawNowPage'));
const MyWithdrawalsPage = lazy(() => import('./pages/withdrawal/MyWithdrawalsPage'));
const WalletAddressesPage = lazy(() => import('./pages/account/WalletAddressesPage'));
const StartMiningPage = lazy(() => import('./pages/mining/StartMiningPage'));
const MiningTracksPage = lazy(() => import('./pages/mining/MiningTracksPage'));
const ProfilePage = lazy(() => import('./pages/account/ProfilePage'));
const ChangePasswordPage = lazy(() => import('./pages/account/ChangePasswordPage'));
const PaymentsLogPage = lazy(() => import('./pages/account/PaymentsLogPage'));
const TransactionsPage = lazy(() => import('./pages/account/TransactionsPage'));
const KYCPage = lazy(() => import('./pages/account/KYCPage'));
const MyReferralPage = lazy(() => import('./pages/account/MyReferralPage'));
const ReferralBonusLogsPage = lazy(() => import('./pages/account/ReferralBonusLogsPage'));
const DepositPage = lazy(() => import('./pages/account/DepositPage'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const UserListPage = lazy(() => import('./pages/admin/users/UserListPage'));
const UserDetailPage = lazy(() => import('./pages/admin/users/UserDetailPage'));
const CoinListPage = lazy(() => import('./pages/admin/coins/CoinListPage'));
const PackageListPage = lazy(() => import('./pages/admin/packages/PackageListPage'));
const AdminSupportPage = lazy(() => import('./pages/admin/support/AdminSupportPage'));
const AdminDepositsPage = lazy(() => import('./pages/admin/deposits/AdminDepositsPage'));
const AdminWithdrawalsPage = lazy(() => import('./pages/admin/withdrawals/AdminWithdrawalsPage'));
const AdminPaymentMethodsPage = lazy(() => import('./pages/admin/paymentMethods/AdminPaymentMethodsPage'));
const AdminFAQsPage = lazy(() => import('./pages/admin/faqs/AdminFAQsPage'));
const AdminServicesPage = lazy(() => import('./pages/admin/services/AdminServicesPage'));
const AdminContactMessagesPage = lazy(() => import('./pages/admin/contactMessages/AdminContactMessagesPage'));
const AdminReferralsPage = lazy(() => import('./pages/admin/referrals/AdminReferralsPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/dashboard/AdminDashboardPage'));
const AdminMiningSettingsPage = lazy(() => import('./pages/admin/mining/MiningSettingsPage'));
const AdminKYCPage = lazy(() => import('./pages/admin/kyc/AdminKYCPage'));
const AdminAuditLogsPage = lazy(() => import('./pages/admin/auditLogs/AuditLogsPage'));
const SupportChatPage = lazy(() => import('./pages/support/SupportChatPage'));
const SupportTicketsPage = lazy(() => import('./pages/support/SupportTicketsPage'));
const SupportChatWidget = lazy(() => import('./components/common/SupportChatWidget'));

const PublicLayout = lazy(() => import('./layouts/PublicLayout'));
const HomePage = lazy(() => import('./pages/public/HomePage'));
const AboutPage = lazy(() => import('./pages/public/AboutPage'));
const ServicesPage = lazy(() => import('./pages/public/ServicesPage'));
const PackagesPage = lazy(() => import('./pages/public/PackagesPage'));
const FAQsPage = lazy(() => import('./pages/public/FAQsPage'));
const SupportPage = lazy(() => import('./pages/public/SupportPage'));
const ContactPage = lazy(() => import('./pages/public/ContactPage'));

const TitleHandler = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const siteName = 'AscendHash';

    if (path.startsWith('/admin')) {
      document.title = `Admin Panel | ${siteName}`;
      return;
    }

    const titleMap = {
      '/': `Home | ${siteName}`,
      '/about': `About Us | ${siteName}`,
      '/services': `Our Services | ${siteName}`,
      '/packages': `Investment Packages | ${siteName}`,
      '/faqs': `FAQs | ${siteName}`,
      '/support': `Customer Support | ${siteName}`,
      '/contact': `Contact Us | ${siteName}`,
      '/login': siteName,
      '/register': siteName,
      '/forgot-password': `Forgot Password | ${siteName}`,
      '/reset-password': `Reset Password | ${siteName}`,
      '/admin/login': siteName,
    };

    if (titleMap[path]) {
      document.title = titleMap[path];
    } else {
      document.title = `Client Dashboard | ${siteName}`;
    }

    // Reset window scroll position to top on navigation
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
};

const ProtectedRoute = ({ children }) => {
  const { user, hydrated } = useSelector((state) => state.auth);
  if (!hydrated) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin' || user.role === 'support_agent') return <Navigate to="/admin" replace />;
  return children;
};

const InvestorRoute = ({ children }) => {
  const { user, hydrated } = useSelector((state) => state.auth);
  if (!hydrated) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'investor') return <Navigate to="/dashboard" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, hydrated } = useSelector((state) => state.auth);
  if (!hydrated) return null;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role !== 'admin' && user.role !== 'support_agent') return <Navigate to="/admin/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, hydrated } = useSelector((state) => state.auth);
  if (!hydrated) return null;
  if (user) {
    if (user.role === 'admin' || user.role === 'support_agent') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const AdminPublicRoute = ({ children }) => {
  const { user, hydrated } = useSelector((state) => state.auth);
  if (!hydrated) return null;
  if (user && (user.role === 'admin' || user.role === 'support_agent')) return <Navigate to="/admin" replace />;
  return children;
};

const App = () => {
  const dispatch = useDispatch();
  const { hydrated, user } = useSelector((state) => state.auth);
  const checkAuthRef = useRef(false);

  useEffect(() => {
    if (!checkAuthRef.current) {
      checkAuthRef.current = true;
      dispatch(checkAuth());
    }
  }, [dispatch]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-bg-light-alt flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Router>
      <TitleHandler />
      <Toaster position="top-right" />
      <Suspense fallback={<LoadingSpinner />}>
        {user?.role === 'investor' ? <SupportChatWidget /> : null}
        <Routes>
          {/* Public Marketing Pages */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/packages" element={<PackagesPage />} />
            <Route path="/faqs" element={<FAQsPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Route>

          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
          <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
          <Route path="/admin/login" element={<AdminPublicRoute><AdminLoginPage /></AdminPublicRoute>} />

          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/withdraw" element={<ProtectedRoute><WithdrawNowPage /></ProtectedRoute>} />
          <Route path="/withdraw/history" element={<ProtectedRoute><MyWithdrawalsPage /></ProtectedRoute>} />
          <Route path="/wallets" element={<ProtectedRoute><WalletAddressesPage /></ProtectedRoute>} />
          <Route path="/mining/plans" element={<ProtectedRoute><StartMiningPage /></ProtectedRoute>} />
          <Route path="/mining/tracks" element={<ProtectedRoute><MiningTracksPage /></ProtectedRoute>} />
          <Route path="/support/chat" element={<InvestorRoute><SupportChatPage /></InvestorRoute>} />
          <Route path="/support/tickets" element={<InvestorRoute><SupportTicketsPage /></InvestorRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/profile/password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
          <Route path="/deposit" element={<ProtectedRoute><DepositPage /></ProtectedRoute>} />
          <Route path="/deposits" element={<ProtectedRoute><PaymentsLogPage /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
          <Route path="/kyc" element={<ProtectedRoute><KYCPage /></ProtectedRoute>} />
          <Route path="/referrals" element={<ProtectedRoute><MyReferralPage /></ProtectedRoute>} />
          <Route path="/referrals/bonus" element={<ProtectedRoute><ReferralBonusLogsPage /></ProtectedRoute>} />

          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="users" element={<UserListPage />} />
            <Route path="users/:id" element={<UserDetailPage />} />
            <Route path="coins" element={<CoinListPage />} />
            <Route path="packages" element={<PackageListPage />} />
            <Route path="deposits" element={<AdminDepositsPage />} />
            <Route path="withdrawals" element={<AdminWithdrawalsPage />} />
            <Route path="payment-methods" element={<AdminPaymentMethodsPage />} />
            <Route path="faqs" element={<AdminFAQsPage />} />
            <Route path="services" element={<AdminServicesPage />} />
            <Route path="contact-messages" element={<AdminContactMessagesPage />} />
            <Route path="referrals" element={<AdminReferralsPage />} />
            <Route path="mining-settings" element={<AdminMiningSettingsPage />} />
            <Route path="kyc" element={<AdminKYCPage />} />
            <Route path="audit-logs" element={<AdminAuditLogsPage />} />
            <Route path="support" element={<AdminSupportPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
