import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "F1 2020 Race Engineer & Telemetry Pit Wall",
  description: "Real-time F1 2020 race engineer, car setup optimizer, and lap-to-lap telemetry dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-black">
      <body className="min-h-screen bg-black text-neutral-100 antialiased">
        {children}
      </body>
    </html>
  );
}
