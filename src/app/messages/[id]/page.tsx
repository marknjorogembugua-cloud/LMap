"use client";

import { useEffect, useState, useCallback, useRef, use as usePromise } from "react";
import Link from "next/link";
import {
  PaperAirplaneIcon,
  ChevronLeftIcon,
  CheckIcon,
  XMarkIcon,
  PlayIcon,
  CheckCircleIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline";
import StatusBadge from "@/components/StatusBadge";
import { useSession } from "@/lib/use-session";
import { useTap } from "@/lib/use-tap";

type BookingDetail = {
  id: string;
  status: string;
  agreedAmountKes: number;
  gig: { id: string; title: string; client: { id: string; name: string | null; phone: string | null } };
  worker: { id: string; name: string | null; phone: string | null };
  transaction: { id: string; status: string; mpesaReceiptNumber: string | null } | null;
  reviews: { reviewerId: string; rating: number; comment: string | null }[];
};

type Message = {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; name: string | null };
};

const STEPS = ["REQUESTED", "ACCEPTED", "IN_PROGRESS", "COMPLETED"];

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const { user } = useSession();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payMessage, setPayMessage] = useState<string | null>(null);
  const [needsPhone, setNeedsPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const acceptTap = useTap();
  const declineTap = useTap();
  const startTap = useTap();
  const completeTap = useTap();
  const payTap = useTap();
  const sendTap = useTap();

  const load = useCallback(async () => {
    const res = await fetch(`/api/bookings/${id}`);
    const data = await res.json();
    setBooking(data.booking ?? null);
    setLoading(false);
  }, [id]);

  const loadMessages = useCallback(async () => {
    const res = await fetch(`/api/bookings/${id}/messages`);
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages ?? []);
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount
    load();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount
    loadMessages();
    const messagePoll = setInterval(loadMessages, 3000);
    return () => {
      clearInterval(messagePoll);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [load, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  async function runAction(action: "accept" | "decline" | "start" | "complete") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${id}/${action}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function pay() {
    setBusy(true);
    setError(null);
    setPayMessage(null);
    setNeedsPhone(false);
    try {
      const res = await fetch("/api/payments/mpesa/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "PHONE_REQUIRED") {
          setNeedsPhone(true);
          return;
        }
        throw new Error(data.error ?? "Payment could not be started");
      }
      setPayMessage(data.message ?? "Check your phone to complete payment");

      pollRef.current = setInterval(async () => {
        const statusRes = await fetch(`/api/payments/mpesa/status/${id}`);
        const statusData = await statusRes.json();
        if (statusData.transaction?.status && statusData.transaction.status !== "PENDING") {
          if (pollRef.current) clearInterval(pollRef.current);
          await load();
        }
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment could not be started");
    } finally {
      setBusy(false);
    }
  }

  async function savePhoneAndPay(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSavingPhone(true);
    try {
      const res = await fetch("/api/account/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save phone number");
      setNeedsPhone(false);
      await pay();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save phone number");
    } finally {
      setSavingPhone(false);
    }
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: id, rating, comment: comment || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not submit review");
      setReviewSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit review");
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = messageText.trim();
    if (!text) return;
    sendTap.bump();
    setSendingMessage(true);
    try {
      const res = await fetch(`/api/bookings/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send message");
      setMessages((prev) => [...prev, data.message]);
      setMessageText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send message");
    } finally {
      setSendingMessage(false);
    }
  }

  if (loading) return <p className="text-center text-neutral-500 text-sm py-16">Loading...</p>;
  if (!booking || !user) return <p className="text-center text-neutral-500 text-sm py-16">Conversation not found.</p>;

  const isClient = booking.gig.client.id === user.id;
  const isWorker = booking.worker.id === user.id;
  const alreadyReviewed = booking.reviews.some((r) => r.reviewerId === user.id) || reviewSubmitted;
  const stepIndex = STEPS.indexOf(booking.status);
  const terminal = booking.status === "DECLINED" || booking.status === "CANCELLED";

  return (
    <main className="relative px-6 py-8 max-w-md mx-auto w-full overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-24 w-72 h-72 bg-brand/15 rounded-full blur-3xl"
      />

      <div className="relative bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-5 shadow-lg shadow-black/30">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-xl font-bold text-white leading-snug">{booking.gig.title}</h1>
          <StatusBadge status={booking.status} />
        </div>
        <p className="text-neutral-400 text-sm mt-1">
          {isClient ? `Worker: ${booking.worker.name ?? "—"}` : `Client: ${booking.gig.client.name ?? "—"}`}
        </p>
        <p className="font-bold text-brand mt-2">KES {booking.agreedAmountKes}</p>

        {!terminal && (
          <div className="flex items-center mt-5">
            {STEPS.map((s, i) => (
              <div key={s} className="flex-1 flex items-center">
                <div
                  className={`w-3 h-3 rounded-full shrink-0 transition-colors duration-300 ${
                    i <= stepIndex ? "bg-brand shadow-[0_0_0_3px] shadow-brand/20" : "bg-neutral-700"
                  }`}
                />
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 transition-colors duration-300 ${
                      i < stepIndex ? "bg-brand" : "bg-neutral-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="relative text-red-400 text-sm mt-4">{error}</p>}

      <div className="relative mt-6 flex flex-col gap-3">
        {booking.status === "REQUESTED" && isClient && (
          <div className="flex gap-2">
            <button
              disabled={busy}
              onClick={() => {
                acceptTap.bump();
                runAction("accept");
              }}
              className="flex-1 flex items-center justify-center gap-1.5 bg-brand text-white font-semibold rounded-xl shadow-lg shadow-brand/20 py-3 active:scale-[0.98] transition disabled:opacity-60"
            >
              <CheckIcon key={acceptTap.tapKey} className="w-4 h-4 animate-icon-pop" strokeWidth={2.5} />
              Accept
            </button>
            <button
              disabled={busy}
              onClick={() => {
                declineTap.bump();
                runAction("decline");
              }}
              className="flex-1 flex items-center justify-center gap-1.5 bg-neutral-800 text-neutral-200 font-semibold rounded-xl py-3 active:scale-[0.98] transition disabled:opacity-60"
            >
              <XMarkIcon key={declineTap.tapKey} className="w-4 h-4 animate-icon-pop" strokeWidth={2.5} />
              Decline
            </button>
          </div>
        )}
        {booking.status === "REQUESTED" && isWorker && (
          <p className="text-neutral-400 text-sm text-center">Waiting for the client to accept your request.</p>
        )}

        {booking.status === "ACCEPTED" && isWorker && (
          <button
            disabled={busy}
            onClick={() => {
              startTap.bump();
              runAction("start");
            }}
            className="flex items-center justify-center gap-1.5 bg-brand text-white font-semibold rounded-xl shadow-lg shadow-brand/20 py-3.5 active:scale-[0.98] transition disabled:opacity-60"
          >
            <PlayIcon key={startTap.tapKey} className="w-4 h-4 animate-icon-pop" strokeWidth={2} />
            Start job
          </button>
        )}
        {booking.status === "ACCEPTED" && isClient && (
          <p className="text-neutral-400 text-sm text-center">Waiting for the worker to start.</p>
        )}

        {booking.status === "IN_PROGRESS" && isClient && (
          <button
            disabled={busy}
            onClick={() => {
              completeTap.bump();
              runAction("complete");
            }}
            className="flex items-center justify-center gap-1.5 bg-brand text-white font-semibold rounded-xl shadow-lg shadow-brand/20 py-3.5 active:scale-[0.98] transition disabled:opacity-60"
          >
            <CheckCircleIcon key={completeTap.tapKey} className="w-4 h-4 animate-icon-pop" strokeWidth={2} />
            Mark job complete
          </button>
        )}
        {booking.status === "IN_PROGRESS" && isWorker && (
          <p className="text-neutral-400 text-sm text-center">Job in progress. The client will confirm once it&apos;s done.</p>
        )}

        {booking.status === "COMPLETED" && (
          <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-4 shadow-lg shadow-black/30">
            <p className="font-semibold text-sm text-white">Payment</p>
            {booking.transaction?.status === "SUCCESS" ? (
              <p className="text-brand text-sm mt-2 flex items-center gap-1.5">
                <CheckCircleIcon className="w-4 h-4 shrink-0" strokeWidth={2} />
                Paid via M-Pesa
                {booking.transaction.mpesaReceiptNumber ? ` · Receipt ${booking.transaction.mpesaReceiptNumber}` : ""}
              </p>
            ) : isClient ? (
              <>
                <p className="text-neutral-400 text-xs mt-1 mb-3">
                  Pay {booking.worker.name ?? "the worker"} KES {booking.agreedAmountKes} via M-Pesa STK Push.
                </p>
                {needsPhone ? (
                  <form onSubmit={savePhoneAndPay} className="flex flex-col gap-2">
                    <p className="text-neutral-300 text-xs">
                      Add a phone number to receive the M-Pesa prompt.
                    </p>
                    <input
                      type="tel"
                      inputMode="tel"
                      placeholder="07XX XXX XXX"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      required
                      className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                    <button
                      type="submit"
                      disabled={savingPhone}
                      className="w-full bg-amber-400 text-black font-semibold rounded-xl py-3 disabled:opacity-60 active:scale-[0.98] transition"
                    >
                      {savingPhone ? "Saving..." : "Save & pay"}
                    </button>
                  </form>
                ) : (
                  <button
                    disabled={busy || booking.transaction?.status === "PENDING"}
                    onClick={() => {
                      payTap.bump();
                      pay();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 bg-amber-400 text-black font-semibold rounded-xl py-3 disabled:opacity-60 active:scale-[0.98] transition"
                  >
                    <BanknotesIcon key={payTap.tapKey} className="w-4 h-4 animate-icon-pop" strokeWidth={2} />
                    {booking.transaction?.status === "PENDING" ? "Waiting for confirmation..." : "Pay via M-Pesa"}
                  </button>
                )}
                {payMessage && <p className="text-neutral-400 text-xs mt-2">{payMessage}</p>}
              </>
            ) : (
              <p className="text-neutral-400 text-sm mt-2">Waiting for payment from the client.</p>
            )}
          </div>
        )}

        {booking.status === "COMPLETED" && !alreadyReviewed && (
          <form
            onSubmit={submitReview}
            className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-3 shadow-lg shadow-black/30"
          >
            <p className="font-semibold text-sm text-white">Leave a review</p>
            <StarPicker value={rating} onChange={setRating} />
            <textarea
              placeholder="How was the job?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-3.5 py-2.5 text-sm"
            />
            <button
              type="submit"
              disabled={busy}
              className="bg-brand text-white font-semibold rounded-xl shadow-lg shadow-brand/20 py-2.5 disabled:opacity-60 active:scale-[0.98] transition"
            >
              Submit review
            </button>
          </form>
        )}
        {booking.status === "COMPLETED" && alreadyReviewed && (
          <p className="text-neutral-400 text-sm text-center">Thanks for your review!</p>
        )}

        {terminal && <p className="text-neutral-400 text-sm text-center">This conversation was {booking.status.toLowerCase()}.</p>}
      </div>

      <div className="relative mt-8">
        <h2 className="font-semibold text-white mb-3">Chat</h2>
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-3 flex flex-col gap-2 max-h-96 overflow-y-auto shadow-lg shadow-black/30">
          {messages.length === 0 ? (
            <p className="text-neutral-500 text-sm text-center py-6">
              No messages yet. Say hello to sort out the details.
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.sender.id === user.id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                      mine
                        ? "bg-gradient-to-br from-brand to-brand-bright text-white rounded-br-sm shadow-brand/20"
                        : "bg-neutral-800 text-neutral-100 rounded-bl-sm shadow-black/20"
                    }`}
                  >
                    {m.body}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="flex gap-2 mt-3">
          <input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <button
            type="submit"
            disabled={sendingMessage || !messageText.trim()}
            className="flex items-center justify-center w-11 h-11 shrink-0 bg-brand text-white rounded-xl shadow-lg shadow-brand/20 disabled:opacity-60 active:scale-[0.94] transition"
          >
            <PaperAirplaneIcon key={sendTap.tapKey} className="w-4 h-4 animate-icon-pop" />
          </button>
        </form>
      </div>

      <Link
        href="/messages"
        className="relative flex items-center justify-center gap-1 text-brand text-sm font-medium mt-8 active:scale-[0.98] transition"
      >
        <ChevronLeftIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
        Back to messages
      </Link>
    </main>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="active:scale-90 transition"
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          {n <= value ? (
            <StarIcon key={`filled-${n}-${value}`} className="w-7 h-7 text-amber-500 animate-icon-pop" />
          ) : (
            <StarOutlineIcon key={`outline-${n}-${value}`} className="w-7 h-7 text-neutral-700 animate-icon-pop" strokeWidth={1.5} />
          )}
        </button>
      ))}
    </div>
  );
}
