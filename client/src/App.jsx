import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { checkAuth } from './store/slices/authSlice';
import LoadingSpinner from './components/common/LoadingSpinner';

const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const WithdrawNowPage = lazy(() => import('./pages/withdrawal/WithdrawNowPage'));
const MyWithdrawalsPage = lazy(() => import('./pages/withdrawal/MyWithdrawalsPage'));
const WalletAddressesPage = lazy(() => import('./pages/account/WalletAddressesPage'));
const StartMiningPage = lazy(() => import('./pages/mining/StartMiningPage'));
const MiningTracksPage = lazy(() => import('./pages/mining/MiningTracksPage'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const UserListPage = lazy(() => import('./pages/admin/users/UserListPage'));
const UserDetailPage = lazy(() => import('./pages/admin/users/UserDetailPage'));
const CoinListPage = lazy(() => import('./pages/admin/coins/CoinListPage'));
const PackageListPage = lazy(() => import('./pages/admin/packages/PackageListPage'));
const AdminSupportPage = lazy(() => import('./pages/admin/support/AdminSupportPage'));
const SupportChatPage = lazy(() => import('./pages/support/SupportChatPage'));
const SupportTicketsPage = lazy(() => import('./pages/support/SupportTicketsPage'));
const SupportChatWidget = lazy(() => import('./components/common/SupportChatWidget'));

const ProtectedRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const InvestorRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'investor') return <Navigate to="/dashboard" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role !== 'admin' && user.role !== 'support_agent') return <Navigate to="/admin/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const AdminPublicRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  if (user && (user.role === 'admin' || user.role === 'support_agent')) return <Navigate to="/admin" replace />;
  return children;
};

const App = () => {
  const dispatch = useDispatch();
  const { hydrated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkAuth());
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
      <Toaster position="top-right" />
      <Suspense fallback={<LoadingSpinner />}>
        {user?.role === 'investor' ? <SupportChatWidget /> : null}
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/admin/login" element={<AdminPublicRoute><AdminLoginPage /></AdminPublicRoute>} />

          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/withdraw" element={<ProtectedRoute><WithdrawNowPage /></ProtectedRoute>} />
          <Route path="/withdraw/history" element={<ProtectedRoute><MyWithdrawalsPage /></ProtectedRoute>} />
          <Route path="/wallets" element={<ProtectedRoute><WalletAddressesPage /></ProtectedRoute>} />
          <Route path="/mining/plans" element={<ProtectedRoute><StartMiningPage /></ProtectedRoute>} />
          <Route path="/mining/tracks" element={<ProtectedRoute><MiningTracksPage /></ProtectedRoute>} />
          <Route path="/support/chat" element={<InvestorRoute><SupportChatPage /></InvestorRoute>} />
          <Route path="/support/tickets" element={<InvestorRoute><SupportTicketsPage /></InvestorRoute>} />

          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<Navigate to="/admin/users" replace />} />
            <Route path="users" element={<UserListPage />} />
            <Route path="users/:id" element={<UserDetailPage />} />
            <Route path="coins" element={<CoinListPage />} />
            <Route path="packages" element={<PackageListPage />} />
            <Route path="support" element={<AdminSupportPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
