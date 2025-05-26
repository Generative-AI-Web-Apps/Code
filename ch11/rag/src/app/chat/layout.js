import Footer from '@/components/Footer';
import { AI } from './actions';

const AppLayout = ({ children }) => {
  return (
    <AI>
      <div className="flex flex-col min-h-screen">
        <main className="flex flex-col flex-1 bg-muted/50">{children}</main>
        <Footer />
      </div>
    </AI>
  );
};

export default AppLayout;
