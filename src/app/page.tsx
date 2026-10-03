import About from "@/components/sections/About";
import Contact from "@/components/sections/Contact";
import Experience from "@/components/sections/Experience";
import Hero from "@/components/sections/Hero";
import Projects from "@/components/sections/Projects";
import { projects } from "@/lib/content";

export default function Home() {
  // TEMPORARY DIAGNOSTIC: remove after debugging the Vercel 500. This page is static, so it
  // logs at build time: look in the deployment's Build Logs.
  console.log("[debug] NEXT_PUBLIC_FIREBASE_PROJECT_ID =", JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID));
  console.log("[debug] env present:", {
    apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    appId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    serviceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
    adminUid: !!process.env.ADMIN_UID,
  });

  return (
    <>
      <Hero />
      <About />
      <Projects projects={projects} />
      <Experience />
      {/* Latest posts section is added once the blog exists. */}
      <Contact />
    </>
  );
}
