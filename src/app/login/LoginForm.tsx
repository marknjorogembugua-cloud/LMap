"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Step = "identifier" | "otp";
type Method = "phone" | "email";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") === "WORKER" ? "WORKER" : "CLIENT";

  const [step, setStep] = useState<Step>("identifier");
  const [method, setMethod] = useState<Method>("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

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
          method === "phone" ? { phone, primaryRole: role } : { email, primaryRole: role }
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
          method === "phone" ? { phone, code, primaryRole: role } : { email, code, primaryRole: role }
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invalid code");

      if (role === "WORKER" && !data.user.workerProfile) {
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

  function backToIdentifier() {
    setDevCode(null);
    setStep("identifier");
  }

  return (
    <main className="min-h-full flex flex-col justify-center px-6 py-12 max-w-md mx-auto w-full">
      <div className="text-center mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG mark, no need for next/image optimization */}
        <img src="/logo-wordmark-light.svg" alt="LinkMeApp" className="h-7 mx-auto mb-5" />
        <h1 className="text-2xl font-bold text-white">
          {role === "WORKER" ? "Find work near you" : "Find help near you"}
        </h1>
        <p className="text-neutral-400 text-sm mt-1">
          {step === "identifier"
            ? method === "phone"
              ? "Enter your phone number to continue"
              : "Enter your email to continue"
            : "Enter the code we sent you"}
        </p>
      </div>

      {step === "identifier" ? (
        <form onSubmit={requestOtp} className="flex flex-col gap-4">
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
        </form>
      ) : (
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
            {loading ? "Verifying..." : "Continue"}
          </button>
          <button type="button" onClick={backToIdentifier} className="text-brand text-sm font-medium">
            {method === "phone" ? "Change phone number" : "Change email address"}
          </button>
        </form>
      )}
    </main>
  );
}
