"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BriefcaseIcon, UsersIcon } from "@heroicons/react/24/outline";
import { useSession } from "@/lib/use-session";

type Step = "role" | "details" | "otp";
type Method = "phone" | "email";
type Role = "WORKER" | "CLIENT";

export default function SignupForm() {
  const router = useRouter();
  const { refresh } = useSession();
  const searchParams = useSearchParams();
  const presetRole = searchParams.get("role");
  const initialRole: Role | null =
    presetRole === "WORKER" || presetRole === "CLIENT" ? presetRole : null;

  const [role, setRole] = useState<Role | null>(initialRole);
  const [step, setStep] = useState<Step>(initialRole ? "details" : "role");
  const [method, setMethod] = useState<Method>("phone");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  function chooseRole(next: Role) {
    setRole(next);
    setStep("details");
  }

  function switchMethod(next: Method) {
    setMethod(next);
    setError(null);
  }

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          method === "phone"
            ? { mode: "signup", phone, primaryRole: role }
            : { mode: "signup", email, primaryRole: role }
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setDevCode(data.devCode ?? null);
      setCode(data.devCode ?? "");
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          method === "phone"
            ? { mode: "signup", phone, code, name, primaryRole: role }
            : { mode: "signup", email, code, name, primaryRole: role }
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invalid code");

      await refresh();

      if (role === "WORKER") {
        router.push("/onboarding/worker");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  function backToDetails() {
    setDevCode(null);
    setStep("details");
  }

  return (
    <main className="min-h-full flex flex-col justify-center px-6 py-12 max-w-md mx-auto w-full">
      <div className="text-center mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG mark, no need for next/image optimization */}
        <img src="/logo-wordmark-light.svg" alt="LinkMeUp" className="h-7 mx-auto mb-5" />
        <h1 className="text-2xl font-bold text-white">
          {step === "role"
            ? "Get started"
            : role === "WORKER"
              ? "Find work near you"
              : "Find help near you"}
        </h1>
        <p className="text-neutral-400 text-sm mt-1">
          {step === "role"
            ? "What are you here to do?"
            : step === "details"
              ? "Create your account"
              : "Enter the code we sent you"}
        </p>
      </div>

      {step === "role" && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => chooseRole("WORKER")}
            className="flex items-center gap-3 bg-brand text-white font-bold rounded-2xl py-4 px-5 shadow-lg shadow-brand/20 active:scale-[0.98] transition"
          >
            <BriefcaseIcon className="w-5 h-5 shrink-0" strokeWidth={2} />
            <span className="text-left">
              <span className="block text-base">Find work</span>
              <span className="block text-xs font-normal text-white/80">I want to get hired</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => chooseRole("CLIENT")}
            className="flex items-center gap-3 border border-neutral-700 text-white font-bold rounded-2xl py-4 px-5 active:scale-[0.98] transition"
          >
            <UsersIcon className="w-5 h-5 shrink-0" strokeWidth={2} />
            <span className="text-left">
              <span className="block text-base">Hire someone</span>
              <span className="block text-xs font-normal text-neutral-400">I want to post jobs</span>
            </span>
          </button>
        </div>
      )}

      {step === "details" && (
        <form onSubmit={requestOtp} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={80}
            className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-4 py-3.5 text-lg focus:outline-none focus:ring-2 focus:ring-brand"
          />
          {method === "phone" ? (
            <input
              type="tel"
              inputMode="tel"
              placeholder="07XX XXX XXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-4 py-3.5 text-lg focus:outline-none focus:ring-2 focus:ring-brand"
            />
          ) : (
            <input
              type="email"
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-4 py-3.5 text-lg focus:outline-none focus:ring-2 focus:ring-brand"
            />
          )}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-brand text-white font-semibold rounded-xl shadow-lg shadow-brand/20 py-3.5 disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send code"}
          </button>
          <button
            type="button"
            onClick={() => switchMethod(method === "phone" ? "email" : "phone")}
            className="text-brand text-sm font-medium"
          >
            {method === "phone" ? "Use email instead" : "Use phone instead"}
          </button>
          {!initialRole && (
            <button
              type="button"
              onClick={() => setStep("role")}
              className="text-neutral-500 text-sm font-medium"
            >
              Back
            </button>
          )}
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={verifyOtp} className="flex flex-col gap-4">
          {devCode && (
            <p className="text-amber-400 text-sm bg-amber-950/40 border border-amber-800 rounded-lg px-3 py-2">
              Dev mode (no SMS/email provider configured): your code is <strong>{devCode}</strong>
            </p>
          )}
          <input
            type="text"
            inputMode="numeric"
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            maxLength={6}
            className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-4 py-3.5 text-lg tracking-[0.3em] text-center focus:outline-none focus:ring-2 focus:ring-brand"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-brand text-white font-semibold rounded-xl shadow-lg shadow-brand/20 py-3.5 disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Create account"}
          </button>
          <button type="button" onClick={backToDetails} className="text-brand text-sm font-medium">
            {method === "phone" ? "Change phone number" : "Change email address"}
          </button>
        </form>
      )}

      {step !== "otp" && (
        <p className="text-center text-neutral-500 text-sm mt-8">
          Already have an account?{" "}
          <Link href="/login" className="text-brand font-medium">
            Log in
          </Link>
        </p>
      )}
    </main>
  );
}
