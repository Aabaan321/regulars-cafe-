import { z } from 'zod';
import { brand } from '@/lib/config/brand';

/**
 * Every shape that crosses the network boundary.
 *
 * These are the *server's* schemas. Route handlers parse with them before
 * touching the database — the client-side copies of these rules are a
 * courtesy to the guest, not a control.
 *
 * Error messages are written to be shown to a guest as-is: they say what to do
 * next, not what the regex rejected.
 */

/* ── Primitives ───────────────────────────────────────────────────────────── */

export const emailSchema = z
  .email({ message: 'Please enter a valid email address.' })
  .trim()
  .toLowerCase()
  .max(254, { message: 'That email address is too long.' });

/**
 * UAE-friendly phone validation: accepts +971 50 123 4567, 0501234567,
 * 00971501234567 and the landline forms, and normalises to E.164.
 */
export const phoneSchema = z
  .string()
  .trim()
  .min(7, { message: 'Please enter a phone number we can reach you on.' })
  .max(24, { message: 'That phone number is too long.' })
  .refine((value) => /^[+0-9()\s-]+$/.test(value), {
    message: 'Please use digits, spaces and + only.',
  })
  .transform((value) => normalisePhone(value))
  .refine((value) => value.replace(/\D/g, '').length >= 7, {
    message: 'That phone number looks too short.',
  });

export function normalisePhone(input: string): string {
  const digits = input.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('00')) return `+${digits.slice(2)}`;
  // A local UAE mobile or landline written as 05… or 04…
  if (digits.startsWith('0')) return `+971${digits.slice(1)}`;
  if (digits.startsWith('971')) return `+${digits}`;
  return digits;
}

export const personNameSchema = z
  .string()
  .trim()
  .min(2, { message: 'Please tell us your name.' })
  .max(80, { message: 'That name is longer than we can store.' })
  // Rejects URLs and angle brackets — the two things spam always contains.
  .refine((v) => !/https?:\/\/|<|>/i.test(v), { message: 'Please enter a name, not a link.' });

export const localeSchema = z.enum(['en', 'ar']).default('en');
export const tierSchema = z.enum(['essential', 'signature', 'immersive']).default('essential');

/** Fields every public form carries. See `looksAutomated()`. */
export const botFieldsSchema = z.object({
  /** Honeypot. Hidden from humans; any value means automation. */
  website: z.string().max(0, { message: 'Rejected.' }).optional().or(z.literal('')),
  /** Epoch ms of when the form was rendered. */
  renderedAt: z.coerce.number().int().positive().optional(),
});

/* ── Tier 1: contact ──────────────────────────────────────────────────────── */

export const enquiryTopicSchema = z.enum([
  'general',
  'feedback',
  'press',
  'careers',
  'private_hire',
  'wholesale',
]);

export const enquirySchema = botFieldsSchema.extend({
  name: personNameSchema,
  email: emailSchema,
  phone: z.string().trim().max(24).optional().or(z.literal('')),
  topic: enquiryTopicSchema.default('general'),
  message: z
    .string()
    .trim()
    .min(10, { message: 'Please give us a little more detail — 10 characters or more.' })
    .max(2000, { message: 'Please keep it under 2,000 characters.' }),
  locale: localeSchema,
  sourceTier: tierSchema,
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

/* ── Tier 1: newsletter ───────────────────────────────────────────────────── */

export const subscribeSchema = botFieldsSchema.extend({
  email: emailSchema,
  name: z.string().trim().max(80).optional().or(z.literal('')),
  source: z.string().trim().max(40).default('footer'),
  locale: localeSchema,
  sourceTier: tierSchema,
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;

/* ── Tier 2: reservations ─────────────────────────────────────────────────── */

export const partySizeSchema = z.coerce
  .number()
  .int()
  .min(1, { message: 'A booking needs at least one guest.' })
  .max(brand.service.maxOnlinePartySize, {
    message: `For ${brand.service.privateHireThreshold} or more, please use the private hire form so we can look after you properly.`,
  });

export const isoDateSchema = z.iso.date({ message: 'Please choose a date.' });

export const occasionSchema = z.enum([
  'none',
  'birthday',
  'anniversary',
  'business',
  'date',
  'celebration',
  'first_visit',
]);

export const availabilityQuerySchema = z.object({
  date: isoDateSchema,
  partySize: partySizeSchema,
});

export const createReservationSchema = botFieldsSchema.extend({
  name: personNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  partySize: partySizeSchema,
  /** ISO instant of the chosen slot. */
  slot: z.iso.datetime({ offset: true, message: 'Please choose a time.' }),
  occasion: occasionSchema.default('none'),
  specialRequests: z.string().trim().max(500).optional().or(z.literal('')),
  highChairs: z.coerce.number().int().min(0).max(6).default(0),
  accessibilityNeeds: z.string().trim().max(300).optional().or(z.literal('')),
  marketingOptIn: z.coerce.boolean().default(false),
  /** Tier 3 floor plan: the specific table the guest picked. */
  preferredTableId: z.uuid().optional(),
  locale: localeSchema,
  sourceTier: tierSchema,
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;

export const manageReservationSchema = z.object({
  token: z.string().min(20).max(300),
  action: z.enum(['cancel', 'reschedule']),
  slot: z.iso.datetime({ offset: true }).optional(),
  partySize: partySizeSchema.optional(),
});

export const waitlistSchema = botFieldsSchema.extend({
  name: personNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  partySize: partySizeSchema,
  date: isoDateSchema,
  windowStart: z.string().regex(/^\d{2}:\d{2}$/, { message: 'Pick an earliest time.' }),
  windowEnd: z.string().regex(/^\d{2}:\d{2}$/, { message: 'Pick a latest time.' }),
  locale: localeSchema,
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;

/* ── Tier 2: ordering ─────────────────────────────────────────────────────── */

export const cartModifierSchema = z.object({
  groupId: z.string().min(1).max(60),
  optionId: z.string().min(1).max(60),
});

export const cartLineSchema = z.object({
  itemId: z.string().min(1).max(60),
  quantity: z.coerce.number().int().min(1).max(20),
  modifiers: z.array(cartModifierSchema).max(12).default([]),
  notes: z.string().trim().max(200).optional().or(z.literal('')),
});

export const checkoutSchema = botFieldsSchema.extend({
  name: personNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  /** ISO instant of the requested collection time. */
  pickupAt: z.iso.datetime({ offset: true, message: 'Please choose a collection time.' }),
  notes: z.string().trim().max(400).optional().or(z.literal('')),
  lines: z.array(cartLineSchema).min(1, { message: 'Your bag is empty.' }).max(40),
  locale: localeSchema,
  sourceTier: tierSchema,
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/* ── Tier 2: events & private hire ────────────────────────────────────────── */

export const eventEnquirySchema = botFieldsSchema.extend({
  name: personNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  company: z.string().trim().max(120).optional().or(z.literal('')),
  eventDate: isoDateSchema,
  headcount: z.coerce
    .number()
    .int()
    .min(1, { message: 'How many guests are you expecting?' })
    .max(400, { message: 'For more than 400 please call us — we will find a way.' }),
  budgetFils: z.coerce.number().int().min(0).max(100_000_000).optional(),
  eventType: z.enum(['cupping', 'workshop', 'supper_club', 'launch', 'community', 'private_hire']),
  message: z.string().trim().min(10).max(1500),
  eventId: z.uuid().optional(),
  locale: localeSchema,
});

export type EventEnquiryInput = z.infer<typeof eventEnquirySchema>;

/* ── Tier 2: loyalty & gift cards ─────────────────────────────────────────── */

export const loyaltyLookupSchema = botFieldsSchema.extend({
  email: emailSchema,
  locale: localeSchema,
});

export const loyaltyStampSchema = z.object({
  token: z.string().min(20).max(300),
  note: z.string().trim().max(120).optional(),
});

export const giftCardPurchaseSchema = botFieldsSchema.extend({
  purchaserName: personNameSchema,
  purchaserEmail: emailSchema,
  recipientName: z.string().trim().max(80).optional().or(z.literal('')),
  recipientEmail: z.union([emailSchema, z.literal('')]).optional(),
  amountFils: z
    .union([
      z.literal(10000),
      z.literal(15000),
      z.literal(25000),
      z.literal(50000),
      z.literal(100000),
    ])
    .describe('AED 100 / 150 / 250 / 500 / 1000'),
  message: z.string().trim().max(300).optional().or(z.literal('')),
  locale: localeSchema,
});

export const giftCardBalanceSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^GC-[0-9A-Z]{6}$/, { message: 'Gift card codes look like GC-4KP2XQ.' }),
});

/* ── Admin ────────────────────────────────────────────────────────────────── */

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, { message: 'Passwords are at least 8 characters.' }).max(200),
  redirectTo: z.string().startsWith('/').max(200).optional(),
});

export const menuItemUpdateSchema = z.object({
  id: z.string().min(1).max(60),
  name: z.string().trim().min(1).max(120).optional(),
  nameAr: z.string().trim().max(120).optional(),
  description: z.string().trim().max(600).optional(),
  descriptionAr: z.string().trim().max(600).optional(),
  priceFils: z.coerce.number().int().min(0).max(1_000_000).optional(),
  isAvailable: z.boolean().optional(),
  unavailableReason: z.string().trim().max(120).nullable().optional(),
  isOrderable: z.boolean().optional(),
  badges: z
    .array(z.enum(['new', 'signature']))
    .max(2)
    .optional(),
  dietary: z
    .array(z.enum(['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'contains-nuts', 'spicy']))
    .max(6)
    .optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
});

export const blackoutCreateSchema = z
  .object({
    date: isoDateSchema,
    reason: z.string().trim().min(2).max(120),
    isFullDay: z.boolean().default(true),
    startsAt: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .optional(),
    endsAt: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .optional(),
  })
  .refine((v) => v.isFullDay || (v.startsAt && v.endsAt && v.endsAt > v.startsAt), {
    message: 'A partial closure needs a start and an end, in that order.',
    path: ['endsAt'],
  });

export const tableUpsertSchema = z.object({
  id: z.uuid().optional(),
  code: z.string().trim().min(1).max(12),
  label: z.string().trim().min(1).max(60),
  seatsMin: z.coerce.number().int().min(1).max(20),
  seatsMax: z.coerce.number().int().min(1).max(20),
  zone: z.enum(['window', 'main', 'counter', 'courtyard', 'mezzanine']),
  shape: z.enum(['round', 'square', 'rect', 'booth']),
  isAccessible: z.boolean().default(false),
  isBookable: z.boolean().default(true),
  planX: z.coerce.number().min(0).max(100),
  planY: z.coerce.number().min(0).max(100),
  planW: z.coerce.number().min(1).max(40),
  planH: z.coerce.number().min(1).max(40),
});

/* ── Analytics ────────────────────────────────────────────────────────────── */

export const analyticsEventSchema = z.object({
  name: z.string().trim().min(1).max(60),
  tier: z.string().trim().max(20).default('unknown'),
  locale: localeSchema,
  sessionId: z.string().trim().min(4).max(64),
  path: z.string().trim().max(300).optional(),
  props: z.record(z.string(), z.unknown()).default({}),
});

/* ── Helpers ──────────────────────────────────────────────────────────────── */

export interface FieldErrors {
  readonly [field: string]: string | undefined;
}

/** Flattens a ZodError into `{ field: firstMessage }` for form rendering. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join('.') || 'form';
    out[key] ??= issue.message;
  }
  return out;
}
