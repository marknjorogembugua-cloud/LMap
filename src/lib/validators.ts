import { z } from "zod";

// Accepts Kenyan numbers in 07xx/01xx or 2547xx/2541xx form and normalizes to 2547xxxxxxxx.
export function normalizeKenyanPhone(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, "");
  if (/^0(7|1)\d{8}$/.test(digits)) return `254${digits.slice(1)}`;
  if (/^254(7|1)\d{8}$/.test(digits)) return digits;
  if (/^(7|1)\d{8}$/.test(digits)) return `254${digits}`;
  return null;
}

export const phoneSchema = z.string().refine((v) => normalizeKenyanPhone(v) !== null, {
  message: "Enter a valid Kenyan phone number, e.g. 0712 345 678",
});

export const otpCodeSchema = z.string().regex(/^\d{6}$/, "Enter the 6-digit code");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address");

export const requestOtpSchema = z
  .object({
    phone: phoneSchema.optional(),
    email: emailSchema.optional(),
    primaryRole: z.enum(["WORKER", "CLIENT"]).optional(),
  })
  .refine((d) => (d.phone ? 1 : 0) + (d.email ? 1 : 0) === 1, {
    message: "Provide either a phone number or an email address",
  });

export const verifyOtpSchema = z
  .object({
    phone: phoneSchema.optional(),
    email: emailSchema.optional(),
    code: otpCodeSchema,
    primaryRole: z.enum(["WORKER", "CLIENT"]).optional(),
    name: z.string().min(2).max(80).optional(),
  })
  .refine((d) => (d.phone ? 1 : 0) + (d.email ? 1 : 0) >= 1, {
    message: "Provide either a phone number or an email address",
  });

const latSchema = z.number().min(-90).max(90);
const lngSchema = z.number().min(-180).max(180);

export const workerProfileSchema = z.object({
  category: z.string().trim().min(2, "Tell us what you do").max(60),
  bio: z.string().max(500).optional(),
  skills: z.array(z.string()).max(15).default([]),
  county: z.string().min(2),
  area: z.string().min(2),
  lat: latSchema.optional(),
  lng: lngSchema.optional(),
  dailyRateKes: z.number().int().positive().optional(),
  hourlyRateKes: z.number().int().positive().optional(),
  experienceYears: z.number().int().min(0).max(60).optional(),
});

export const gigSchema = z.object({
  title: z.string().min(3).max(120),
  category: z.string().trim().min(2, "Add a category").max(60),
  description: z.string().min(10).max(1000),
  county: z.string().min(2),
  area: z.string().min(2),
  lat: latSchema.optional(),
  lng: lngSchema.optional(),
  budgetKes: z.number().int().positive(),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  targetWorkerId: z.string().optional(),
});

export const locationUpdateSchema = z.object({
  lat: latSchema,
  lng: lngSchema,
});

export const bookingCreateSchema = z.object({
  gigId: z.string(),
  workerId: z.string(),
  agreedAmountKes: z.number().int().positive(),
});

export const reviewSchema = z.object({
  bookingId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export const sendMessageSchema = z.object({
  text: z.string().min(1).max(1000),
});

export const pushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
});

export const pushUnsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export const certificationSchema = z.object({
  title: z.string().min(2).max(120),
  institution: z.string().max(120).optional(),
  year: z
    .number()
    .int()
    .min(1980)
    .max(new Date().getFullYear())
    .optional(),
});
