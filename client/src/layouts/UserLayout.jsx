import { Outlet } from 'react-router-dom';
import Header from '../components/common/Header';
import Logo from '../components/common/Logo';
import Web3BackgroundCanvas from '../components/common/Web3BackgroundCanvas';

const UserLayout = () => {
  return (
    <div className="relative min-h-screen bg-page-bg font-sans antialiased text-on-surface">
      <Web3BackgroundCanvas />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />

        <main className="flex flex-1 flex-col">
          <Outlet />
        </main>

        <footer className="border-t border-slate-200/70 bg-white/70 text-slate-500 backdrop-blur-md dark:border-white/10 dark:bg-[#050811]/80 dark:text-slate-400">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-4 px-margin-mobile py-8 md:px-margin-desktop">
            <Logo size="sm" className="h-8 opacity-80" />
            <p className="text-center font-body-sm text-body-sm">
              &copy; 2026 <span className="font-semibold text-slate-700 dark:text-white">AscendHash</span>. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default UserLayout;
