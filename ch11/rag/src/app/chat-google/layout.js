import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const AppLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex flex-col flex-1 bg-muted/50">{children}</main>

      <Footer />
    </div>
  );
};

export default AppLayout;
