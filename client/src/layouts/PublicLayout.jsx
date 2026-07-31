import { Outlet } from 'react-router-dom';
import PublicHeader from '../components/landing/PublicHeader';
import PublicFooter from '../components/landing/PublicFooter';
import BackgroundGlowsAndParticles from '../components/landing/ui/BackgroundGlowsAndParticles';
import PageTransition from '../components/landing/PageTransition';

const PublicLayout = () => {
  return (
    <div className="public-layout relative min-h-screen bg-[#050811] text-white overflow-x-hidden font-body antialiased">
      {/* Unified global background layer — fixed so particles, grid, and radial glows
          span the entire shell (Header → Content → Footer) without seams. */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <BackgroundGlowsAndParticles />
      </div>

      {/* Layout content layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <PublicHeader />
        <main className="flex-1">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
        <PublicFooter />
      </div>
    </div>
  );
};

export default PublicLayout;
