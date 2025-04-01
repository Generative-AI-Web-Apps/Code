import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import InterviewSidebar from '@/components/InterviewSidebar';
import { AI } from './actions';

export const dynamic = 'force-dynamic';

const AppLayout = async ({ children }) => {
  return (
    <AI>
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-50 w-full border-b h-14 shrink-0 bg-background backdrop-blur-xl">
          <Navbar />
        </header>

        <div className="flex flex-1">
          <InterviewSidebar />
          <main className="flex flex-col flex-1 bg-muted/50">{children}</main>
        </div>
        <Footer />
      </div>
    </AI>
  );
};

export default AppLayout;
