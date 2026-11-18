import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Uni+ · Trouvez votre coloc",
  description: "Ne vivez plus jamais avec le mauvais coloc. Uni+ jumelle les étudiants de Kitchener-Waterloo.",
  applicationName: "Uni+",
  appleWebApp: { capable: true, title: "Uni+", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F7F8FB",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr-CA" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="min-h-dvh bg-bg antialiased">
        {/* Phone-width column: full width on phones, centred "app" on laptops. */}
        <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-bg md:border-x md:border-line md:shadow-soft">
          {children}
        </div>
      </body>
    </html>
  );
}
