import "./globals.css";

export const metadata = {
  title: "Open Banking Intelligence Rail",
  description: "Hybrid Payments Orchestration Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}