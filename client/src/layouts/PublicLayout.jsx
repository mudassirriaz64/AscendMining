import { Outlet } from 'react-router-dom';
import PublicHeader from '../components/common/PublicHeader';
import PublicFooter from '../components/common/PublicFooter';

const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-bg-light-alt text-text-light-bg font-body antialiased">
      <PublicHeader />
      <main className="flex-grow">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
};

export default PublicLayout;
