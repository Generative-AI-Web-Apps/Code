import './index.css';

export const metadata = {
  title: 'Astra AI',
  description: "Hello, I'm ✴️ Astra. Ask me anything you want.",
};

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
