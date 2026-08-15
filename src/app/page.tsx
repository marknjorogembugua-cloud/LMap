import { redirect } from "next/navigation";
import Link from "next/link";
import { UsersIcon, WrenchIcon, WrenchScrewdriverIcon, ShieldCheckIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { getSession } from "@/lib/session";
import SplashScreen from "@/components/SplashScreen";
import FindWorkButton from "@/components/FindWorkButton";
import JobTitlesBackdrop from "@/components/JobTitlesBackdrop";

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="relative min-h-dvh flex flex-col justify-center overflow-hidden bg-gradient-to-b from-brand/15 via-black to-black text-white px-6 py-16">
      <SplashScreen />
      <JobTitlesBackdrop />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-20 w-72 h-72 bg-brand/30 rounded-full blur-3xl motion-safe:animate-[float-slow_10s_ease-in-out_infinite]" />
        <div className="absolute -bottom-28 -left-16 w-80 h-80 bg-brand-bright/20 rounded-full blur-3xl motion-safe:animate-[float-slow-reverse_12s_ease-in-out_infinite]" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
        <WrenchIcon className="absolute top-[14%] left-[9%] w-8 h-8 text-white/[0.06] -rotate-12" />
        <WrenchScrewdriverIcon className="absolute top-[22%] right-[11%] w-10 h-10 text-white/[0.06] rotate-12" />
        <ShieldCheckIcon className="absolute bottom-[20%] left-[13%] w-9 h-9 text-white/[0.06] rotate-6" />
        <SparklesIcon className="absolute bottom-[28%] right-[15%] w-6 h-6 text-brand/25 motion-safe:animate-[glow-pulse_3s_ease-in-out_infinite]" />
      </div>

      <div className="relative max-w-md mx-auto w-full text-center">
        <h1 className="sr-only">LinkMeUp</h1>
        <div className="relative inline-block mb-12">
          <div
            aria-hidden="true"
            className="absolute inset-0 -m-6 bg-brand/40 rounded-full blur-2xl motion-safe:animate-[glow-pulse_4s_ease-in-out_infinite]"
          />
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG mark, no need for next/image optimization */}
          <img src="/logo-wordmark-light.svg" alt="LinkMeUp" className="relative h-9 mx-auto" />
        </div>

        <div className="flex flex-col gap-3">
          <FindWorkButton />
          <Link
            href="/signup?role=CLIENT"
            className="flex items-center justify-center gap-2.5 border border-neutral-600 text-white font-semibold rounded-full py-3.5 active:scale-[0.98] transition"
          >
            <UsersIcon className="w-5 h-5" strokeWidth={2} />
            Hire someone
          </Link>
        </div>

        <p className="relative text-neutral-500 text-sm mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-brand font-medium">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
