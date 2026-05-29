import { z } from "zod";
import { NextResponse } from "next/server";

// ── Shared field schemas ─────────────────────────────────────────────────────

export const emailSchema = z.string().email("Invalid email").max(254);

export const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s\-().]{7,20}$/, "Invalid phone number")
  .optional();

export const uuidSchema = z.string().uuid("Invalid ID");

// ── Lead schemas ─────────────────────────────────────────────────────────────

export const createLeadSchema = z.object({
  source: z.enum(["phone_call", "web_form", "email", "sms", "manual"]),
  status: z
    .enum(["new", "contacted", "waiting", "booked", "quoted", "closed", "lost", "ignored"])
    .optional()
    .default("new"),
  name: z.string().max(200).optional().nullable(),
  phone: phoneSchema,
  email: emailSchema.optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export const updateLeadSchema = z.object({
  status: z
    .enum(["new", "contacted", "waiting", "booked", "quoted", "closed", "lost", "ignored"])
    .optional(),
  name: z.string().max(200).optional().nullable(),
  phone: phoneSchema,
  email: emailSchema.optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  assigned_to: uuidSchema.optional().nullable(),
});

// ── Alert schemas ────────────────────────────────────────────────────────────

export const updateAlertSchema = z.object({
  id: uuidSchema,
  is_read: z.boolean().optional(),
  is_resolved: z.boolean().optional(),
});

export const alertActionSchema = z.object({
  action: z.enum(["run_engine", "mark_all_read"]),
});

// ── Report schemas ───────────────────────────────────────────────────────────

export const createReportSchema = z.object({
  period: z.enum(["weekly", "monthly"]),
});

// ── Business schemas ─────────────────────────────────────────────────────────

export const updateBusinessSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.string().max(100).optional(),
  owner_name: z.string().max(200).optional(),
  phone: phoneSchema,
  email: emailSchema.optional(),
  timezone: z.string().max(100).optional(),
  website: z.string().url().optional().nullable(),
  twilio_number: phoneSchema,
});

// ── Helpers ──────────────────────────────────────────────────────────────────

export function validationError(errors: z.ZodError): NextResponse {
  return NextResponse.json(
    {
      error: "Validation failed",
      details: errors.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    },
    { status: 400 }
  );
}

export function sanitizeString(input: unknown): string | null {
  if (typeof input !== "string") return null;
  return input.trim().replace(/[\x00-\x1F\x7F]/g, "").slice(0, 10_000);
}
