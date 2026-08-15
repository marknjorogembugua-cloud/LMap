import { redirect } from "next/navigation";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import {
  UsersIcon,
  ShieldCheckIcon,
  SparklesIcon,
  MapPinIcon,
  BanknotesIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  StarIcon,
  DevicePhoneMobileIcon,
  CheckBadgeIcon,
  WrenchIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import { getSession } from "@/lib/session";
import SplashScreen from "@/components/SplashScreen";
import FindWorkButton from "@/components/FindWorkButton";
import JobTitlesBackdrop from "@/components/JobTitlesBackdrop";

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

const FEATURES: { icon: HeroIcon; title: string; body: string }[] = [
  {
    icon: MapPinIcon,
    title: "Nearby matching",
    body: "Jobs and workers are sorted by distance, so you always see what's closest first.",
  },
  {
    icon: BanknotesIcon,
    title: "Instant M-Pesa payments",
    body: "Clients pay by STK Push the moment a job is marked complete — no cash, no chasing.",
  },
  {
    icon: CheckBadgeIcon,
    title: "Verified worker badges",
    body: "Workers can get ID-verified so clients know exactly who's showing up.",
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: "Built-in messaging",
    body: "Agree on the details, share updates, and keep a record — all inside the app.",
  },
  {
    icon: UserGroupIcon,
    title: "Your network",
    body: "Every completed job adds to your network, so past clients and workers are one tap away.",
  },
  {
    icon: StarIcon,
    title: "Ratings that matter",
    body: "Every job ends with a review, building a track record that follows you.",
  },
];

const TRUST_ITEMS: { icon: HeroIcon; title: string; body: string }[] = [
  {
    icon: DevicePhoneMobileIcon,
    title: "No passwords to leak",
    body: "Accounts are secured with a one-time code sent to your phone or email — nothing to steal, nothing to forget.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Know who you're dealing with",
    body: "Optional ID verification for workers, plus a visible rating and job history for every account.",
  },
  {
    icon: BanknotesIcon,
    title: "Pay only when it's done",
    body: "Clients release payment through M-Pesa once the job is marked complete, not before.",
  },
];

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="relative bg-black text-white overflow-x-hidden">
      <SplashScreen />

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG mark, no need for next/image optimization */}
        <img src="/logo-wordmark-light.svg" alt="LinkMeUp" className="h-6" />
        <Link href="/login" className="text-sm font-medium text-neutral-300 hover:text-white transition">
          Log in
        </Link>
      </header>

      {/* Hero */}
      <section className="relative flex flex-col justify-center overflow-hidden bg-gradient-to-b from-brand/15 via-black to-black px-6 pt-8 pb-20">
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

        <div className="relative max-w-md mx-auto w-full text-center py-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Find work. Hire help.
            <br />
            Get paid instantly.
          </h1>
          <p className="text-neutral-400 text-base mt-4 max-w-sm mx-auto">
            LinkMeUp connects Kenya&apos;s skilled workers with people who need a job done —
            nearby, verified, and paid via M-Pesa the moment it&apos;s complete.
          </p>

          <div className="flex flex-col gap-3 mt-8">
            <FindWorkButton />
            <Link
              href="/signup?role=CLIENT"
              className="flex items-center justify-center gap-2.5 border border-neutral-600 text-white font-semibold rounded-full py-3.5 active:scale-[0.98] transition"
            >
              <UsersIcon className="w-5 h-5" strokeWidth={2} />
              Hire someone
            </Link>
          </div>

          <p className="text-neutral-500 text-sm mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-brand font-medium">
              Log in
            </Link>
          </p>

          <div className="flex items-center justify-center gap-5 mt-10 text-neutral-500 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <BanknotesIcon className="w-4 h-4" /> M-Pesa payments
            </span>
            <span className="flex items-center gap-1.5">
              <CheckBadgeIcon className="w-4 h-4" /> Verified workers
            </span>
            <span className="flex items-center gap-1.5">
              <MapPinIcon className="w-4 h-4" /> Built for Kenya
            </span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative px-6 py-20 max-w-5xl mx-auto w-full">
        <h2 className="text-2xl sm:text-3xl font-bold text-center tracking-tight">How LinkMeUp works</h2>
        <p className="text-neutral-400 text-center text-sm mt-2 max-w-md mx-auto">
          One app, two sides of the same job.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <HowItWorksCard
            eyebrow="For workers"
            steps={[
              "Sign up and set up your profile — skills, area, rates.",
              "Browse open jobs sorted by distance from you.",
              "Do the job, get paid instantly via M-Pesa.",
            ]}
          />
          <HowItWorksCard
            eyebrow="For clients"
            steps={[
              "Post a job or browse verified workers near you.",
              "Chat and agree on the details in-app.",
              "Pay via M-Pesa once the job is marked complete.",
            ]}
          />
        </div>
      </section>

      {/* Features */}
      <section className="relative px-6 py-20 bg-neutral-950 border-y border-neutral-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center tracking-tight">
            Everything you need, built in
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-5"
              >
                <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-brand/10 text-brand mb-4">
                  <f.icon className="w-5 h-5" strokeWidth={1.75} />
                </span>
                <p className="font-semibold text-white text-sm">{f.title}</p>
                <p className="text-neutral-400 text-xs mt-1.5 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & safety */}
      <section className="relative px-6 py-20 max-w-5xl mx-auto w-full">
        <h2 className="text-2xl sm:text-3xl font-bold text-center tracking-tight">Built on trust</h2>
        <p className="text-neutral-400 text-center text-sm mt-2 max-w-md mx-auto">
          The details that make it safe to hire a stranger, or work for one.
        </p>
        <div className="grid sm:grid-cols-3 gap-5 mt-12">
          {TRUST_ITEMS.map((t) => (
            <div key={t.title} className="text-center flex flex-col items-center">
              <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-brand/10 text-brand mb-4">
                <t.icon className="w-6 h-6" strokeWidth={1.75} />
              </span>
              <p className="font-semibold text-white text-sm">{t.title}</p>
              <p className="text-neutral-400 text-xs mt-1.5 leading-relaxed max-w-[22rem]">{t.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative px-6 py-20 bg-gradient-to-b from-black to-brand/10 text-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Ready to get started?</h2>
          <p className="text-neutral-400 text-sm mt-2">
            It takes less than a minute to sign up — no password, no paperwork.
          </p>
          <div className="flex flex-col gap-3 mt-8">
            <FindWorkButton />
            <Link
              href="/signup?role=CLIENT"
              className="flex items-center justify-center gap-2.5 border border-neutral-600 text-white font-semibold rounded-full py-3.5 active:scale-[0.98] transition"
            >
              <UsersIcon className="w-5 h-5" strokeWidth={2} />
              Hire someone
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 border-t border-neutral-900">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG mark, no need for next/image optimization */}
          <img src="/logo-wordmark-light.svg" alt="LinkMeUp" className="h-5 opacity-80" />
          <p className="text-neutral-500 text-xs">
            &copy; {new Date().getFullYear()} LinkMeUp. Built for Kenya&apos;s jua kali economy.
          </p>
          <Link href="/login" className="text-neutral-500 text-xs font-medium hover:text-white transition">
            Log in
          </Link>
        </div>
      </footer>
    </main>
  );
}

function HowItWorksCard({ eyebrow, steps }: { eyebrow: string; steps: string[] }) {
  return (
    <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-6">
      <p className="text-brand text-xs font-semibold uppercase tracking-wide">{eyebrow}</p>
      <ol className="mt-4 flex flex-col gap-4">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand/10 text-brand text-xs font-bold shrink-0 mt-0.5">
              {i + 1}
            </span>
            <span className="text-neutral-300 text-sm leading-relaxed">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
