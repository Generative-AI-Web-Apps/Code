import './index.css';
import { ClerkProvider } from '@clerk/nextjs';
import Sidebar from '@/components/Sidebar';

export const metadata = {
  title: 'Astra AI',
  description: "Hello, I'm ✴️ Astra. Ask me anything you want.",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex flex-col flex-1 ml-60 bg-muted/50">
              <main className="flex-1">{children}</main>
            </div>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
