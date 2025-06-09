import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const AppLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 flex items-center justify-between w-full px-4 border-b h-14 shrink-0 bg-background backdrop-blur-xl">
        <Navbar />
      </header>
      <main className="flex flex-col flex-1 bg-muted/50">{children}</main>
      <Footer />
    </div>
  );
};

export default AppLayout;
