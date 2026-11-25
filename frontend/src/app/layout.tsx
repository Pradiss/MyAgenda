import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import AcordarServidor from "@/components/AcordarServidor";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "Agenda",
  description: "Nossa agenda colorida",
  applicationName: "Agenda",
  appleWebApp: { capable: true, title: "Agenda", statusBarStyle: "default" },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#f2f2ef",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={manrope.variable}>
      <body className="min-h-dvh font-sans antialiased">
        <AcordarServidor />
        {children}
      </body>
    </html>
  );
}
