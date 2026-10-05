import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import MotionProvider from "@/components/motion/MotionProvider";
import ScrollProgress from "@/components/motion/ScrollProgress";
import SmoothScroll from "@/components/motion/SmoothScroll";
import { getProfile } from "@/lib/settings";
import { siteUrl } from "@/lib/site";
import { themeScript } from "@/lib/themes";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  const title = `${profile.name} | ${profile.roles[0]}`;
  return {
    metadataBase: new URL(siteUrl),
    title: { default: title, template: `%s | ${profile.name}` },
    description: profile.pitch,
    applicationName: profile.name,
    authors: [{ name: profile.name, url: siteUrl }],
    alternates: { canonical: "/" },
    // The preview image comes from app/opengraph-image.tsx and app/twitter-image.tsx.
    openGraph: { type: "website", url: "/", siteName: profile.name, title, description: profile.pitch, locale: "en_US" },
    twitter: { card: "summary_large_image", title, description: profile.pitch },
  };
}

// Colours the browser UI (address bar on phones) to match the page.
export const viewport: Viewport = {
  themeColor: "#21202e",
};


export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Set by proxy.ts. Reading request headers is what makes every page render per request.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript() }} />
      </head>
      {/* min-h-dvh, not min-h-full: Lenis' CSS sets html/body height to auto, which would stop the
          footer from sinking to the bottom of short pages. */}
      <body className="min-h-dvh flex flex-col">
        <MotionProvider>
          <SmoothScroll>
            <ScrollProgress />
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </SmoothScroll>
        </MotionProvider>
      </body>
    </html>
  );
}
