"use client";

import { useEffect, useState, useCallback, useRef, use as usePromise } from "react";
import {
  PaperAirplaneIcon,
  CheckIcon,
  XMarkIcon,
  PlayIcon,
  CheckCircleIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline";
import StatusBadge from "@/components/StatusBadge";
import BackButton from "@/components/BackButton";
import WhatsAppShareButton from "@/components/WhatsAppShareButton";
import { useSession } from "@/lib/use-session";
import { useTap } from "@/lib/use-tap";

type BookingDetail = {
  id: string;
  status: string;
  agreedAmountKes: number;
  gig: { id: string; title: string; client: { id: string; name: string | null; phone: string | null } };
  worker: { id: string; name: string | null; phone: string | null };
  transaction: { id: string; status: string; mpesaReceiptNumber: string | null } | null;
  payout: {
    id: string;
    status: string;
    netAmountKes: number;
    mpesaReceiptNumber: string | null;
  } | null;
  dispute: { id: string; status: string; reason: string } | null;
  reviews: { reviewerId: string; rating: number; comment: string | null }[];
};

const DISPUTABLE_STATUSES = ["ACCEPTED", "IN_PROGRESS", "COMPLETED"];

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
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeBusy, setDisputeBusy] = useState(false);
  const [disputeError, setDisputeError] = useState<string | null>(null);
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

  async function submitDispute(e: React.FormEvent) {
    e.preventDefault();
    setDisputeError(null);
    setDisputeBusy(true);
    try {
      const res = await fetch(`/api/bookings/${id}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: disputeReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not submit report");
      setShowDisputeForm(false);
      setDisputeReason("");
      await load();
    } catch (err) {
      setDisputeError(err instanceof Error ? err.message : "Could not submit report");
    } finally {
      setDisputeBusy(false);
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
    <div className="fixed inset-0 z-30 flex flex-col bg-black">
      <div className="shrink-0 flex items-center gap-2 px-2 pb-3 border-b border-neutral-800 bg-neutral-950 safe-area-top">
        <BackButton fallbackHref="/messages" className="shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{booking.gig.title}</p>
          <p className="text-neutral-500 text-xs truncate">
            {isClient ? `Worker: ${booking.worker.name ?? "—"}` : `Client: ${booking.gig.client.name ?? "—"}`}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="relative flex-1 overflow-y-auto px-4 py-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-24 w-72 h-72 bg-brand/15 rounded-full blur-3xl"
        />

        <div className="relative flex items-center justify-between">
          <p className="font-bold text-brand">KES {booking.agreedAmountKes}</p>
        </div>

        {!terminal && (
          <div className="relative flex items-center mt-3">
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

        {error && <p className="relative text-red-400 text-sm mt-4">{error}</p>}

        <div className="relative mt-4 flex flex-col gap-3">
        {booking.dispute?.status === "OPEN" ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" strokeWidth={1.75} />
            <div>
              <p className="text-amber-300 font-semibold text-sm">This booking is under review</p>
              <p className="text-neutral-400 text-xs mt-1">
                A dispute has been raised and is being looked at. Payment is on hold until it&apos;s resolved.
              </p>
            </div>
          </div>
        ) : (
          <>
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

            {booking.transaction?.status === "SUCCESS" && isWorker && (
              <div className="mt-3 pt-3 border-t border-neutral-800">
                <p className="text-xs text-neutral-500">Your payout</p>
                {booking.payout?.status === "SUCCESS" ? (
                  <p className="text-brand text-sm mt-1 flex items-center gap-1.5">
                    <CheckCircleIcon className="w-4 h-4 shrink-0" strokeWidth={2} />
                    KES {booking.payout.netAmountKes} sent
                    {booking.payout.mpesaReceiptNumber ? ` · Receipt ${booking.payout.mpesaReceiptNumber}` : ""}
                  </p>
                ) : booking.payout?.status === "FAILED" ? (
                  <p className="text-red-400 text-sm mt-1">Payout failed — contact support.</p>
                ) : (
                  <p className="text-amber-400 text-sm mt-1">On its way to your phone.</p>
                )}
              </div>
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
          <>
            <p className="text-neutral-400 text-sm text-center">Thanks for your review!</p>
            <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-4 shadow-lg shadow-black/30">
              <p className="font-semibold text-sm text-white">Know someone who needs this?</p>
              <p className="text-neutral-400 text-xs mt-1 mb-3">Share LinkMeUp with them on WhatsApp.</p>
              <WhatsAppShareButton
                message={
                  isWorker
                    ? "I've been finding paying jobs nearby on LinkMeUp and getting paid instantly via M-Pesa. Check it out:"
                    : "I've been hiring trusted workers nearby on LinkMeUp — verified, and I only pay once the job's done. Check it out:"
                }
              />
            </div>
          </>
        )}

        {terminal && <p className="text-neutral-400 text-sm text-center">This conversation was {booking.status.toLowerCase()}.</p>}
          </>
        )}

        {!terminal && !booking.dispute && DISPUTABLE_STATUSES.includes(booking.status) && (
          <>
            {!showDisputeForm ? (
              <button
                type="button"
                onClick={() => setShowDisputeForm(true)}
                className="flex items-center justify-center gap-1.5 text-neutral-500 text-xs font-medium mt-1"
              >
                <ExclamationTriangleIcon className="w-3.5 h-3.5" strokeWidth={1.75} />
                Report a problem
              </button>
            ) : (
              <form
                onSubmit={submitDispute}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-3"
              >
                <p className="font-semibold text-sm text-white">What went wrong?</p>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Describe the issue in a bit of detail..."
                  rows={3}
                  required
                  className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-3.5 py-2.5 text-sm"
                />
                {disputeError && <p className="text-red-400 text-sm">{disputeError}</p>}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={disputeBusy}
                    className="flex-1 bg-neutral-800 text-white font-semibold rounded-xl py-2.5 text-sm disabled:opacity-60"
                  >
                    {disputeBusy ? "Submitting..." : "Submit report"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDisputeForm(false)}
                    className="flex-1 text-neutral-400 text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>

        <div className="relative flex flex-col gap-2 mt-6">
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
      </div>

      <form
        onSubmit={sendMessage}
        className="shrink-0 flex gap-2 px-3 py-3 border-t border-neutral-800 bg-neutral-950 safe-area-bottom"
      >
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
