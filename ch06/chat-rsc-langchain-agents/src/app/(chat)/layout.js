import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AI } from './actions';

const AppLayout = ({ children }) => {
  return (
    <AI>
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-50 flex items-center justify-between w-full px-4 border-b h-14 shrink-0 bg-background backdrop-blur-xl">
          <Navbar />
        </header>
        <main className="flex flex-col flex-1 bg-muted/50">{children}</main>
        <Footer />
      </div>
    </AI>
  );
};

export default AppLayout;
